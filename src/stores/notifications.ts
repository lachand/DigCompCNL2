import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  limit
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from './auth'
import { useFirebaseOptimizer } from '@/composables/useFirebaseOptimizer'

export interface Notification {
  id?: string
  type: 'assignment' | 'status_change' | 'comment' | 'deadline' | 'review' | 'mention'
  title: string
  message: string
  outcomeId?: string
  year?: string
  targetUser: string
  createdBy: string
  createdAt: number
  read: boolean
  link?: string
  assignedBy?: string
  description?: string
}

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  
  const optimizer = useFirebaseOptimizer()
  let stopPolling: (() => void) | null = null

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  const sortedNotifications = computed(() => {
    return [...notifications.value]
      .filter(n => n && n.createdAt)
      .sort((a, b) => {
        const aTime = typeof a.createdAt === 'number' ? a.createdAt : 0
        const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0
        return bTime - aTime
      })
  })

  const loadNotifications = () => {
    const authStore = useAuthStore()
    
    // Watch for when currentUser is available
    const setupPolling = () => {
      if (!authStore.currentUser?.email) {
        // Wait for auth to be ready
        setTimeout(setupPolling, 100)
        return
      }

      // Clean up previous polling
      if (stopPolling) {
        stopPolling()
      }

      try {
        const queryFn = async () => {
          const q = query(
            collection(db, 'notifications'),
            where('targetUser', '==', authStore.currentUser.email),
            limit(100)
          )
          const snapshot = await getDocs(q)
          return snapshot.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : (data.createdAt?.toMillis?.() || Date.now())
            } as Notification
          })
        }

        const callback = (newNotifications: Notification[]) => {
          notifications.value = newNotifications
        }

        // Utiliser le polling optimisé (30 secondes)
        stopPolling = optimizer.startPolling('notifications', queryFn, callback)
        
      } catch (err) {
        console.error('Error setting up notifications polling:', err)
      }
    }

    setupPolling()
  }

  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    try {
      const now = Date.now()
      await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: now,
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
    const yearLabel = year === 'all' ? 'toutes les années' : year
    await createNotification({
      type: 'assignment',
      title: 'Nouvelle assignation',
      message: `${assignerEmail.split('@')[0]} vous a assigné au LO ${outcomeId} (${yearLabel})`,
      outcomeId,
      year,
      targetUser: assigneeEmail,
      createdBy: assignerEmail,
      assignedBy: assignerEmail,
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
    const statusLabels: Record<string, string> = {
      'draft': 'Brouillon',
      'in_progress': 'En cours',
      'review': 'En review',
      'validated': 'Validé',
      'obsolete': 'Obsolète'
    }
    const statusLabel = statusLabels[newStatus] || newStatus
    const promises = assignees.map(email =>
      createNotification({
        type: 'status_change',
        title: 'Changement de statut',
        message: `${changerEmail.split('@')[0]} a changé le statut du LO ${outcomeId} (${year}) à "${statusLabel}"`,
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
        message: `${commenterEmail.split('@')[0]} a commenté ${outcomeId}: "${commentText.substring(0, 60)}${commentText.length > 60 ? '...' : ''}"`,
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
      type: 'deadline',
      title: 'Nouvelle deadline',
      message: `Deadline assignée pour ${outcomeId} (${year}): "${eventType}" le ${eventDate}`,
      outcomeId,
      year,
      targetUser: targetEmail,
      createdBy: creatorEmail,
      assignedBy: creatorEmail,
      link: `/outcomes?lo=${outcomeId}`
    })
  }

  const notifyDeadlineAssigned = async (
    outcomeId: string,
    year: string,
    deadlineLabel: string,
    deadlineDate: string,
    assignees: string[],
    creatorEmail: string
  ) => {
    const promises = assignees.map(email =>
      createNotification({
        type: 'deadline',
        title: 'Deadline assignée',
        message: `${creatorEmail.split('@')[0]} vous a assigné une deadline pour ${outcomeId} (${year}): "${deadlineLabel}" le ${deadlineDate}`,
        outcomeId,
        year,
        targetUser: email,
        createdBy: creatorEmail,
        assignedBy: creatorEmail,
        link: `/calendar`
      })
    )
    await Promise.all(promises)
  }

  const notifyReviewRequest = async (
    outcomeId: string,
    year: string,
    reviewerEmail: string,
    requesterEmail: string,
    comment?: string
  ) => {
    await createNotification({
      type: 'review',
      title: 'Demande de review',
      message: `${requesterEmail.split('@')[0]} demande votre review pour ${outcomeId} (${year})${comment ? ` : "${comment.substring(0, 50)}"` : ''}`,
      outcomeId,
      year,
      targetUser: reviewerEmail,
      createdBy: requesterEmail,
      assignedBy: requesterEmail,
      link: `/outcomes?lo=${outcomeId}`
    })
  }

  const notifyReviewResult = async (
    outcomeId: string,
    year: string,
    status: 'approved' | 'rejected',
    requesterEmail: string,
    reviewerEmail: string,
    comment?: string
  ) => {
    const statusLabel = status === 'approved' ? 'approuvée' : 'rejetée'
    const actionVerb = status === 'approved' ? 'approuvé' : 'rejeté'
    await createNotification({
      type: 'review',
      title: `Review ${statusLabel}`,
      message: `${reviewerEmail.split('@')[0]} a ${actionVerb} votre review pour ${outcomeId} (${year})${comment ? ` : "${comment.substring(0, 50)}"` : ''}`,
      outcomeId,
      year,
      targetUser: requesterEmail,
      createdBy: reviewerEmail,
      link: `/outcomes?lo=${outcomeId}`
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
    notifyDeadlineAssigned,
    notifyReviewRequest,
    notifyReviewResult,
    cleanup
  }
})
