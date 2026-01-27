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
const mockGetDocs = vi.fn().mockResolvedValue({ docs: [] })

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_db, ...path) => ({ path: path.join('/') })),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  onSnapshot: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
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

import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import type { ChatMessage } from '@/types'

describe('useChatStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should have correct initial state', () => {
    const store = useChatStore()
    expect(store.messages).toEqual([])
    expect(store.isTyping).toBe(false)
    expect(store.unreadCount).toBe(0)
    expect(store.isChatOpen).toBe(false)
  })

  describe('sortedMessages', () => {
    it('should sort messages by timestamp ascending', () => {
      const store = useChatStore()
      store.messages = [
        { id: '3', text: 'Third', sender: 'a@b.com', timestamp: 3000, reactions: {} },
        { id: '1', text: 'First', sender: 'a@b.com', timestamp: 1000, reactions: {} },
        { id: '2', text: 'Second', sender: 'a@b.com', timestamp: 2000, reactions: {} }
      ]

      const sorted = store.sortedMessages
      expect(sorted[0].id).toBe('1')
      expect(sorted[1].id).toBe('2')
      expect(sorted[2].id).toBe('3')
    })

    it('should not mutate original array', () => {
      const store = useChatStore()
      store.messages = [
        { id: '2', text: 'B', sender: 'a@b.com', timestamp: 2000, reactions: {} },
        { id: '1', text: 'A', sender: 'a@b.com', timestamp: 1000, reactions: {} }
      ]

      store.sortedMessages
      expect(store.messages[0].id).toBe('2')
    })
  })

  describe('sendMessage', () => {
    it('should send a text message', async () => {
      const store = useChatStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any

      await store.sendMessage('Hello!')

      expect(mockAddDoc).toHaveBeenCalled()
      const data = mockAddDoc.mock.calls[0][1]
      expect(data).toMatchObject({
        text: 'Hello!',
        sender: 'me@test.com',
        reactions: {}
      })
    })

    it('should send message with attachment', async () => {
      const store = useChatStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any

      await store.sendMessage('See file', {
        data: 'base64data',
        name: 'file.pdf',
        type: 'application/pdf'
      })

      expect(mockAddDoc).toHaveBeenCalled()
      const data = mockAddDoc.mock.calls[0][1]
      expect(data).toMatchObject({
        text: 'See file',
        attachment: 'base64data',
        attachmentName: 'file.pdf',
        attachmentType: 'application/pdf'
      })
    })

    it('should not send without currentUser', async () => {
      const store = useChatStore()
      await store.sendMessage('Hello!')
      expect(mockAddDoc).not.toHaveBeenCalled()
    })
  })

  describe('markAsRead', () => {
    it('should reset unread count to 0', () => {
      const store = useChatStore()
      store.unreadCount = 5

      store.markAsRead()

      expect(store.unreadCount).toBe(0)
    })

    it('should update lastReadTimestamp', () => {
      const store = useChatStore()
      const before = Date.now()

      store.markAsRead()

      expect(store.lastReadTimestamp).toBeGreaterThanOrEqual(before)
    })
  })

  describe('setChatOpen', () => {
    it('should set isChatOpen to true', () => {
      const store = useChatStore()
      store.setChatOpen(true)
      expect(store.isChatOpen).toBe(true)
    })

    it('should set isChatOpen to false', () => {
      const store = useChatStore()
      store.isChatOpen = true
      store.setChatOpen(false)
      expect(store.isChatOpen).toBe(false)
    })

    it('should mark as read when opening chat', () => {
      const store = useChatStore()
      store.unreadCount = 3

      store.setChatOpen(true)

      expect(store.unreadCount).toBe(0)
    })

    it('should not mark as read when closing chat', () => {
      const store = useChatStore()
      store.unreadCount = 3

      store.setChatOpen(false)

      expect(store.unreadCount).toBe(3)
    })
  })

  describe('addReaction', () => {
    it('should add reaction to message', async () => {
      const store = useChatStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any

      store.messages = [
        { id: 'msg-1', text: 'Hi', sender: 'other@test.com', timestamp: 1000, reactions: {} }
      ]

      await store.addReaction('msg-1', '👍')

      expect(store.messages[0].reactions!['👍']).toContain('me@test.com')
      expect(mockUpdateDoc).toHaveBeenCalled()
    })

    it('should remove reaction if already present (toggle)', async () => {
      const store = useChatStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any

      store.messages = [
        {
          id: 'msg-1', text: 'Hi', sender: 'other@test.com', timestamp: 1000,
          reactions: { '👍': ['me@test.com'] }
        }
      ]

      await store.addReaction('msg-1', '👍')

      // Should remove reaction and clean up empty array
      expect(store.messages[0].reactions!['👍']).toBeUndefined()
    })

    it('should do nothing without currentUser', async () => {
      const store = useChatStore()
      store.messages = [
        { id: 'msg-1', text: 'Hi', sender: 'other@test.com', timestamp: 1000, reactions: {} }
      ]

      await store.addReaction('msg-1', '👍')

      expect(mockUpdateDoc).not.toHaveBeenCalled()
    })

    it('should do nothing for non-existent message', async () => {
      const store = useChatStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any

      store.messages = []

      await store.addReaction('non-existent', '👍')

      expect(mockUpdateDoc).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should not throw when no subscription', () => {
      const store = useChatStore()
      expect(() => store.cleanup()).not.toThrow()
    })
  })
})
