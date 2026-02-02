import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  addDoc,
  query,
  orderBy,
  updateDoc,
  doc,
  where,
  getDocs,
  deleteDoc,
  limit
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { ChatMessage } from '@/types'
import { useAuthStore } from './auth'
import { playSound, showDesktopNotification } from '@/utils/helpers'
import { useFirebaseOptimizer } from '@/composables/useFirebaseOptimizer'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const unreadCount = ref(0)
  const lastReadTime = ref(Date.now())
  const isChatOpen = ref(false)
  
  const optimizer = useFirebaseOptimizer()
  let stopPolling: (() => void) | null = null

  const sortedMessages = computed(() => {
    return [...messages.value].sort((a, b) => a.timestamp - b.timestamp)
  })

  const loadMessages = (limitCount: number = 20) => {
    const queryFn = async () => {
      // Charger seulement les messages récents par défaut
      const q = query(
        collection(db, 'messages'), 
        orderBy('timestamp', 'desc'), 
        limit(limitCount)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.reverse().map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage))
    }

    const callback = (newMessages: ChatMessage[]) => {
      const authStore = useAuthStore()
      const previousLength = messages.value.length
      
      messages.value = newMessages

      // Calculate unread
      unreadCount.value = messages.value.filter(m => m.timestamp > lastReadTime.value).length

      // Notify on new message (if not from current user and chat is closed or tab not focused)
      if (messages.value.length > previousLength) {
        const latestMsg = messages.value[messages.value.length - 1]
        const shouldNotify = latestMsg.sender !== authStore.currentUser?.email &&
          (document.hidden || !isChatOpen.value)

        if (shouldNotify) {
          const sound = authStore.userData?.prefSound || 'beep'
          playSound(sound)

          showDesktopNotification(
            'Nouveau message',
            `${latestMsg.sender}: ${latestMsg.text.substring(0, 50)}...`,
            () => window.focus()
          )

          // Notification locale via API Web Notifications
          if ('Notification' in window && Notification.permission === 'granted' && unreadCount.value > 0) {
            new Notification(`Nouveau message de ${latestMsg.sender}`,
              {
                body: latestMsg.text.substring(0, 80),
                icon: '/icons/icon-192x192.png',
                data: { url: window.location.href }
              }
            )
          }
        }
      }
    }

    // Utiliser le polling optimisé (5 secondes)
    stopPolling = optimizer.startPolling('messages', queryFn, callback)
  }

  // Fonction pour charger plus de messages (pagination)
  const loadMoreMessages = async (beforeTimestamp?: number) => {
    const limitCount = 20
    const q = beforeTimestamp
      ? query(
          collection(db, 'messages'),
          where('timestamp', '<', beforeTimestamp),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        )
      : query(
          collection(db, 'messages'),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        )

    const snapshot = await getDocs(q)
    const olderMessages = snapshot.docs.reverse().map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ChatMessage))

    // Ajouter les anciens messages au début
    messages.value = [...olderMessages, ...messages.value]

    return olderMessages.length === limitCount // Indique s'il y a potentiellement plus de messages
  }

  const sendMessage = async (text: string, attachment?: {
    data: string
    name: string
    type: string
  }) => {
    const authStore = useAuthStore()
    if (!authStore.currentUser?.email) return

    const message: Omit<ChatMessage, 'id'> = {
      text,
      sender: authStore.currentUser.email,
      timestamp: Date.now(),
      reactions: {}
    }

    if (attachment) {
      message.attachment = attachment.data
      message.attachmentName = attachment.name
      message.attachmentType = attachment.type
    }

    await addDoc(collection(db, 'messages'), message)
  }

  // Suppression de la fonction setTyping pour économiser des ressources

  const editMessage = async (messageId: string, newText: string) => {
    const authStore = useAuthStore()
    const message = messages.value.find(m => m.id === messageId)
    if (!message || message.sender !== authStore.currentUser?.email) return

    // Store edit history
    if (!message.editHistory) {
      message.editHistory = [{ text: message.text, timestamp: message.timestamp }]
    }
    message.editHistory.push({ text: message.text, timestamp: Date.now() })

    const messageRef = doc(db, 'messages', messageId)
    await updateDoc(messageRef, {
      text: newText,
      editedAt: Date.now(),
      editHistory: message.editHistory
    })
  }

  const deleteMessage = async (messageId: string) => {
    const authStore = useAuthStore()
    const message = messages.value.find(m => m.id === messageId)
    if (!message || message.sender !== authStore.currentUser?.email) return

    const messageRef = doc(db, 'messages', messageId)
    await updateDoc(messageRef, {
      deletedAt: Date.now(),
      text: '[Message supprimé]'
    })
  }

  const addReaction = async (messageId: string, emoji: string) => {
    const authStore = useAuthStore()
    const email = authStore.currentUser?.email
    if (!email) return

    const message = messages.value.find(m => m.id === messageId)
    if (!message) return

    if (!message.reactions) {
      message.reactions = {}
    }

    if (!message.reactions[emoji]) {
      message.reactions[emoji] = []
    }

    const index = message.reactions[emoji].indexOf(email)
    if (index > -1) {
      message.reactions[emoji].splice(index, 1)
      if (message.reactions[emoji].length === 0) {
        delete message.reactions[emoji]
      }
    } else {
      message.reactions[emoji].push(email)
    }

    const messageRef = doc(db, 'messages', messageId)
    await updateDoc(messageRef, {
      reactions: message.reactions
    })
  }

  const markAsRead = () => {
    lastReadTime.value = Date.now()
    unreadCount.value = 0
  }

  const setChatOpen = (open: boolean) => {
    isChatOpen.value = open
    if (open) {
      markAsRead()
    }
  }

  const cleanupOldMessages = async () => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const q = query(
      collection(db, 'messages'),
      where('timestamp', '<', thirtyDaysAgo)
    )

    const snapshot = await getDocs(q)
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
  }

  const cleanup = () => {
    if (stopPolling) {
      stopPolling()
      stopPolling = null
    }
  }

  return {
    messages,
    sortedMessages,
    unreadCount,
    isChatOpen,
    lastReadTimestamp: computed(() => lastReadTime.value),
    loadMessages,
    loadMoreMessages,
    sendMessage,
    addReaction,
    editMessage,
    deleteMessage,
    markAsRead,
    setChatOpen,
    cleanup
  }
})
