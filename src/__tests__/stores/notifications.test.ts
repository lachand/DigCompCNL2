import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn()
}))

// Mock firebase/firestore
const mockAddDoc = vi.fn().mockResolvedValue({ id: 'mock-id' })
const mockUpdateDoc = vi.fn().mockResolvedValue(undefined)
const mockDeleteDoc = vi.fn().mockResolvedValue(undefined)

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_db, ...path) => ({ path: path.join('/') })),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  onSnapshot: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  setDoc: vi.fn(),
  serverTimestamp: vi.fn()
}))

// Mock firebase config
vi.mock('@/firebase/config', () => ({
  auth: {},
  db: {},
  firebaseApp: {}
}))

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  getUserColor: vi.fn(() => '#3b82f6'),
  hashEmail: vi.fn(() => 0),
  formatDate: vi.fn(() => ''),
  playSound: vi.fn(),
  showDesktopNotification: vi.fn()
}))

import { useNotificationsStore, type Notification } from '@/stores/notifications'

const createMockNotification = (overrides?: Partial<Notification>): Notification => ({
  id: 'notif-1',
  type: 'comment',
  title: 'Test',
  message: 'Test message',
  targetUser: 'user@test.com',
  createdBy: 'other@test.com',
  createdAt: 1000,
  read: false,
  ...overrides
})

describe('useNotificationsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should have correct initial state', () => {
    const store = useNotificationsStore()
    expect(store.notifications).toEqual([])
    expect(store.loading).toBe(false)
    expect(store.unreadCount).toBe(0)
  })

  describe('unreadCount', () => {
    it('should count unread notifications', () => {
      const store = useNotificationsStore()
      store.notifications = [
        createMockNotification({ id: '1', read: false }),
        createMockNotification({ id: '2', read: true }),
        createMockNotification({ id: '3', read: false })
      ]
      expect(store.unreadCount).toBe(2)
    })

    it('should return 0 when all read', () => {
      const store = useNotificationsStore()
      store.notifications = [
        createMockNotification({ id: '1', read: true }),
        createMockNotification({ id: '2', read: true })
      ]
      expect(store.unreadCount).toBe(0)
    })
  })

  describe('sortedNotifications', () => {
    it('should sort notifications by createdAt descending', () => {
      const store = useNotificationsStore()
      store.notifications = [
        createMockNotification({ id: '1', createdAt: 1000 }),
        createMockNotification({ id: '2', createdAt: 3000 }),
        createMockNotification({ id: '3', createdAt: 2000 })
      ]

      const sorted = store.sortedNotifications
      expect(sorted[0].id).toBe('2')
      expect(sorted[1].id).toBe('3')
      expect(sorted[2].id).toBe('1')
    })

    it('should not mutate original array', () => {
      const store = useNotificationsStore()
      store.notifications = [
        createMockNotification({ id: '1', createdAt: 1000 }),
        createMockNotification({ id: '2', createdAt: 3000 })
      ]

      store.sortedNotifications
      expect(store.notifications[0].id).toBe('1')
    })
  })

  describe('createNotification', () => {
    it('should call addDoc with notification data', async () => {
      const store = useNotificationsStore()

      await store.createNotification({
        type: 'comment',
        title: 'New',
        message: 'Test',
        targetUser: 'user@test.com',
        createdBy: 'other@test.com'
      })

      expect(mockAddDoc).toHaveBeenCalled()
      const data = mockAddDoc.mock.calls[0][1]
      expect(data).toMatchObject({
        type: 'comment',
        title: 'New',
        message: 'Test',
        targetUser: 'user@test.com',
        createdBy: 'other@test.com',
        read: false
      })
    })

    it('should handle errors gracefully', async () => {
      mockAddDoc.mockRejectedValueOnce(new Error('DB error'))
      const store = useNotificationsStore()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await store.createNotification({
        type: 'comment',
        title: 'New',
        message: 'Test',
        targetUser: 'user@test.com',
        createdBy: 'other@test.com'
      })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('markAsRead', () => {
    it('should call updateDoc with read: true', async () => {
      const store = useNotificationsStore()
      await store.markAsRead('notif-1')

      expect(mockUpdateDoc).toHaveBeenCalled()
      expect(mockUpdateDoc.mock.calls[0][1]).toEqual({ read: true })
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      const store = useNotificationsStore()
      store.notifications = [
        createMockNotification({ id: '1', read: false }),
        createMockNotification({ id: '2', read: true }),
        createMockNotification({ id: '3', read: false })
      ]

      await store.markAllAsRead()

      // Should only call for unread (2 calls)
      expect(mockUpdateDoc).toHaveBeenCalledTimes(2)
    })
  })

  describe('deleteNotification', () => {
    it('should call deleteDoc', async () => {
      const store = useNotificationsStore()
      await store.deleteNotification('notif-1')
      expect(mockDeleteDoc).toHaveBeenCalled()
    })
  })

  describe('clearAll', () => {
    it('should delete all notifications', async () => {
      const store = useNotificationsStore()
      store.notifications = [
        createMockNotification({ id: '1' }),
        createMockNotification({ id: '2' }),
        createMockNotification({ id: '3' })
      ]

      await store.clearAll()

      expect(mockDeleteDoc).toHaveBeenCalledTimes(3)
    })
  })

  describe('notifyAssignment', () => {
    it('should create assignment notification', async () => {
      const store = useNotificationsStore()
      await store.notifyAssignment('1.1.1', 'L1', 'user@test.com', 'admin@test.com')

      expect(mockAddDoc).toHaveBeenCalled()
      const data = mockAddDoc.mock.calls[0][1]
      expect(data).toMatchObject({
        type: 'assignment',
        title: 'Nouvelle assignation',
        targetUser: 'user@test.com',
        createdBy: 'admin@test.com',
        outcomeId: '1.1.1',
        year: 'L1'
      })
    })
  })

  describe('notifyStatusChange', () => {
    it('should create notification for each assignee', async () => {
      const store = useNotificationsStore()
      await store.notifyStatusChange(
        '1.1.1', 'L1', 'validated',
        ['user1@test.com', 'user2@test.com'],
        'admin@test.com'
      )

      expect(mockAddDoc).toHaveBeenCalledTimes(2)
    })

    it('should include status in message', async () => {
      const store = useNotificationsStore()
      await store.notifyStatusChange(
        '1.1.1', 'L2', 'review',
        ['user@test.com'],
        'admin@test.com'
      )

      expect(mockAddDoc).toHaveBeenCalled()
      const data = mockAddDoc.mock.calls[0][1]
      expect(data.type).toBe('status_change')
      expect(data.message).toContain('review')
    })
  })

  describe('notifyComment', () => {
    it('should create notification for each assignee', async () => {
      const store = useNotificationsStore()
      await store.notifyComment(
        '1.1.1', 'Great work!',
        ['user1@test.com', 'user2@test.com', 'user3@test.com'],
        'commenter@test.com'
      )

      expect(mockAddDoc).toHaveBeenCalledTimes(3)
    })

    it('should truncate long comment text', async () => {
      const store = useNotificationsStore()
      const longText = 'A'.repeat(100)
      await store.notifyComment('1.1.1', longText, ['user@test.com'], 'c@test.com')

      expect(mockAddDoc).toHaveBeenCalled()
      const data = mockAddDoc.mock.calls[0][1]
      expect(data.message).toContain('...')
    })
  })

  describe('notifyCalendarEvent', () => {
    it('should create calendar notification', async () => {
      const store = useNotificationsStore()
      await store.notifyCalendarEvent(
        '1.1.1', 'L1', 'Deadline', '2025-06-15',
        'user@test.com', 'admin@test.com'
      )

      expect(mockAddDoc).toHaveBeenCalled()
      const data = mockAddDoc.mock.calls[0][1]
      expect(data).toMatchObject({
        type: 'calendar',
        title: 'Evenement planifie',
        link: '/calendar'
      })
    })
  })

  describe('cleanup', () => {
    it('should not throw when no subscription', () => {
      const store = useNotificationsStore()
      expect(() => store.cleanup()).not.toThrow()
    })
  })
})
