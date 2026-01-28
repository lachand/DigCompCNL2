/**
 * Debug composable for testing notifications system
 * Use this to manually trigger test notifications
 */

import { useNotificationsStore } from '@/stores/notifications'
import { useAuthStore } from '@/stores/auth'
import { useToast } from './useToast'

export function useNotificationDebug() {
  const notificationsStore = useNotificationsStore()
  const authStore = useAuthStore()
  const { success } = useToast()

  const createTestNotifications = async () => {
    if (!authStore.currentUser?.email) {
      console.error('No user logged in')
      return
    }

    const currentEmail = authStore.currentUser.email
    const testUser = 'test@example.com'

    try {
      // Test assignment notification
      await notificationsStore.notifyAssignment(
        '1.1.1',
        'L1',
        currentEmail,
        testUser
      )
      console.log('✓ Assignment notification created')

      // Test deadline notification
      await notificationsStore.notifyDeadlineAssigned(
        '1.1.1',
        'L1',
        'Finalisation L1',
        new Date().toLocaleDateString('fr-FR'),
        [currentEmail],
        testUser
      )
      console.log('✓ Deadline notification created')

      // Test review request notification
      await notificationsStore.notifyReviewRequest(
        '1.1.1',
        'L1',
        currentEmail,
        testUser,
        'Please review this outcome'
      )
      console.log('✓ Review request notification created')

      // Test status change notification
      await notificationsStore.notifyStatusChange(
        '1.1.1',
        'L1',
        'validated',
        [currentEmail],
        testUser
      )
      console.log('✓ Status change notification created')

      // Test comment notification
      await notificationsStore.notifyComment(
        '1.1.1',
        'This is a test comment',
        [currentEmail],
        testUser
      )
      console.log('✓ Comment notification created')

      success('5 notifications de test créées!')
    } catch (err) {
      console.error('Error creating test notifications:', err)
    }
  }

  const logNotifications = () => {
    console.log('=== NOTIFICATIONS DEBUG ===')
    console.log('Total notifications:', notificationsStore.notifications.length)
    console.log('Unread count:', notificationsStore.unreadCount)
    console.log('Notifications:', notificationsStore.sortedNotifications)
  }

  return {
    createTestNotifications,
    logNotifications
  }
}
