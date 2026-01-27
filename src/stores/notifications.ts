import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  Unsubscribe,
  limit
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth'

export interface Notification {
  id?: string
  type: 'assignment' | 'status_change' | 'comment' | 'calendar' | 'mention'
  title: string
  message: string
  outcomeId?: string
  year?: string
  targetUser: string
  createdBy: string
  createdAt: number
  read: boolean
  link?: string
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)

  let unsubscribe: Unsubscribe | null = null

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) => b.createdAt - a.createdAt)
  })

  const loadNotifications = () => {
    const authStore = useAuthStore()
    if (!authStore.currentUser?.email) return

    const q = query(
      collection(db, 'notifications'),
      where('targetUser', '==', authStore.currentUser.email),
      orderBy('createdAt', 'desc'),
      limit(50)
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      notifications.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification))
    })
  }

  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: Date.now(),
        read: false
      })
    } catch (err) {
      console.error('Error creating notification:', err)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      })
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.value.filter(n => !n.read)
    const promises = unreadNotifications.map(n =>
      updateDoc(doc(db, 'notifications', n.id!), { read: true })
    )
    await Promise.all(promises)
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId))
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  const clearAll = async () => {
    const promises = notifications.value.map(n =>
      deleteDoc(doc(db, 'notifications', n.id!))
    )
    await Promise.all(promises)
  }

  // Helper functions to create specific notification types
  const notifyAssignment = async (
    outcomeId: string,
    year: string,
    assigneeEmail: string,
    assignerEmail: string
  ) => {
    await createNotification({
      type: 'assignment',
      title: 'Nouvelle assignation',
      message: `Vous avez ete assigne au LO ${outcomeId} (${year})`,
      outcomeId,
      year,
      targetUser: assigneeEmail,
      createdBy: assignerEmail,
      link: `/outcomes?lo=${outcomeId}`
    })
  }

  const notifyStatusChange = async (
    outcomeId: string,
    year: string,
    newStatus: string,
    assignees: string[],
    changerEmail: string
  ) => {
    const promises = assignees.map(email =>
      createNotification({
        type: 'status_change',
        title: 'Changement de statut',
        message: `Le LO ${outcomeId} (${year}) est maintenant "${newStatus}"`,
        outcomeId,
        year,
        targetUser: email,
        createdBy: changerEmail,
        link: `/outcomes?lo=${outcomeId}`
      })
    )
    await Promise.all(promises)
  }

  const notifyComment = async (
    outcomeId: string,
    commentText: string,
    assignees: string[],
    commenterEmail: string
  ) => {
    const promises = assignees.map(email =>
      createNotification({
        type: 'comment',
        title: 'Nouveau commentaire',
        message: `${commenterEmail.split('@')[0]}: "${commentText.substring(0, 50)}..."`,
        outcomeId,
        targetUser: email,
        createdBy: commenterEmail,
        link: `/outcomes?lo=${outcomeId}`
      })
    )
    await Promise.all(promises)
  }

  const notifyCalendarEvent = async (
    outcomeId: string,
    year: string,
    eventType: string,
    eventDate: string,
    targetEmail: string,
    creatorEmail: string
  ) => {
    await createNotification({
      type: 'calendar',
      title: 'Evenement planifie',
      message: `${eventType} planifiee pour ${outcomeId} (${year}) le ${eventDate}`,
      outcomeId,
      year,
      targetUser: targetEmail,
      createdBy: creatorEmail,
      link: '/calendar'
    })
  }

  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    notifications,
    loading,
    unreadCount,
    sortedNotifications,
    loadNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    notifyAssignment,
    notifyStatusChange,
    notifyComment,
    notifyCalendarEvent,
    cleanup
  }
})
