import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  Unsubscribe,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { ChatMessage } from '@/types'
import { useAuthStore } from './auth'
import { playSound, showDesktopNotification } from '@/utils/helpers'
import { createDelayedListener, getOptimizedDelay, logOptimization } from '@/composables/useOptimizedDelays'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])
  const isTyping = ref(false)
  const unreadCount = ref(0)
  const lastReadTime = ref(Date.now())
  const isChatOpen = ref(false) // Track if chat panel is open

  let messagesUnsubscribe: Unsubscribe | null = null
  let typingTimeout: number | null = null

  const sortedMessages = computed(() => {
    return [...messages.value].sort((a, b) => a.timestamp - b.timestamp)
  })

  const loadMessages = () => {
    const delay = getOptimizedDelay('CHAT_MESSAGES')
    logOptimization('Chat Messages', delay)
    
    const fetchMessages = () => {
      const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'))

      messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        const authStore = useAuthStore()
        const previousLength = messages.value.length

        messages.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as ChatMessage))

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

          // Envoi notification OneSignal locale si non lus
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
    })
    }
    
    // Utiliser le listener avec délai de 2s pour le chat
    const cleanup = createDelayedListener(fetchMessages, delay, true)
    messagesUnsubscribe = cleanup

    // Cleanup old messages (>30 days)
    cleanupOldMessages()
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

    // Stop typing indicator
    setTyping(false)
  }

  const setTyping = async (typing: boolean) => {
    const authStore = useAuthStore()
    if (!authStore.currentUser) return

    if (typing) {
      await authStore.updateUserField('isTyping', true)

      // Auto-clear after 3 seconds
      if (typingTimeout) clearTimeout(typingTimeout)
      typingTimeout = window.setTimeout(() => {
        setTyping(false)
      }, 3000)
    } else {
      await authStore.updateUserField('isTyping', false)
      if (typingTimeout) {
        clearTimeout(typingTimeout)
        typingTimeout = null
      }
    }
  }

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
    if (messagesUnsubscribe) {
      messagesUnsubscribe()
      messagesUnsubscribe = null
    }
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      typingTimeout = null
    }
  }

  return {
    messages,
    sortedMessages,
    isTyping,
    unreadCount,
    isChatOpen,
    lastReadTimestamp: computed(() => lastReadTime.value),
    loadMessages,
    sendMessage,
    setTyping,
    addReaction,
    editMessage,
    deleteMessage,
    markAsRead,
    setChatOpen,
    cleanup
  }
})
