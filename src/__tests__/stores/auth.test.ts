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
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  onSnapshot: vi.fn(),
  collection: vi.fn(),
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
  getUserColor: vi.fn((email: string) => '#3b82f6'),
  hashEmail: vi.fn(() => 0),
  formatDate: vi.fn(() => ''),
  playSound: vi.fn(),
  showDesktopNotification: vi.fn()
}))

import { useAuthStore } from '@/stores/auth'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { updateDoc } from 'firebase/firestore'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should have correct initial state', () => {
    const store = useAuthStore()
    expect(store.currentUser).toBeNull()
    expect(store.userData).toBeNull()
    expect(store.users).toEqual([])
    expect(store.loading).toBe(true)
    expect(store.error).toBe('')
  })

  it('should return default color when no user', () => {
    const store = useAuthStore()
    expect(store.userColor).toBe('#3b82f6')
  })

  describe('isPinned', () => {
    it('should return false when no userData', () => {
      const store = useAuthStore()
      expect(store.isPinned('1.1')).toBe(false)
    })

    it('should return false when user has no pinned outcomes', () => {
      const store = useAuthStore()
      store.userData = { uid: '1', email: 'test@test.com' } as any
      expect(store.isPinned('1.1')).toBe(false)
    })

    it('should return true when outcome is pinned', () => {
      const store = useAuthStore()
      store.userData = { uid: '1', email: 'test@test.com', pinned: ['1.1', '2.1'] } as any
      expect(store.isPinned('1.1')).toBe(true)
    })

    it('should return false when outcome is not pinned', () => {
      const store = useAuthStore()
      store.userData = { uid: '1', email: 'test@test.com', pinned: ['1.1', '2.1'] } as any
      expect(store.isPinned('3.1')).toBe(false)
    })
  })

  describe('login', () => {
    it('should call signInWithEmailAndPassword', async () => {
      const store = useAuthStore()
      vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({} as any)

      await store.login('test@test.com', 'password123')

      expect(signInWithEmailAndPassword).toHaveBeenCalled()
      const callArgs = vi.mocked(signInWithEmailAndPassword).mock.calls[0]
      expect(callArgs[1]).toBe('test@test.com')
      expect(callArgs[2]).toBe('password123')
    })

    it('should set loading to false after login', async () => {
      const store = useAuthStore()
      vi.mocked(signInWithEmailAndPassword).mockResolvedValueOnce({} as any)

      await store.login('test@test.com', 'password123')

      expect(store.loading).toBe(false)
    })

    it('should set error on login failure', async () => {
      const store = useAuthStore()
      vi.mocked(signInWithEmailAndPassword).mockRejectedValueOnce(
        new Error('Invalid credentials')
      )

      await expect(store.login('test@test.com', 'wrong')).rejects.toThrow()
      expect(store.error).toBe('Invalid credentials')
      expect(store.loading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should call firebaseSignOut', async () => {
      const store = useAuthStore()
      vi.mocked(signOut).mockResolvedValueOnce()

      await store.logout()

      expect(signOut).toHaveBeenCalled()
    })

    it('should update user state before signing out', async () => {
      const store = useAuthStore()
      store.currentUser = { uid: '1', email: 'test@test.com' } as any
      vi.mocked(updateDoc).mockResolvedValueOnce()
      vi.mocked(signOut).mockResolvedValueOnce()

      await store.logout()

      expect(updateDoc).toHaveBeenCalled()
      const callArgs = vi.mocked(updateDoc).mock.calls[0]
      expect(callArgs[1]).toEqual({ state: 'idle', isTyping: false })
    })
  })

  describe('togglePin', () => {
    it('should do nothing when no userData', async () => {
      const store = useAuthStore()
      await store.togglePin('1.1')
      expect(updateDoc).not.toHaveBeenCalled()
    })

    it('should add outcome to pinned list', async () => {
      const store = useAuthStore()
      store.userData = { uid: '1', email: 'test@test.com', pinned: [] } as any
      store.currentUser = { uid: '1' } as any
      vi.mocked(updateDoc).mockResolvedValueOnce()

      await store.togglePin('1.1')

      expect(updateDoc).toHaveBeenCalled()
      expect(vi.mocked(updateDoc).mock.calls[0][1]).toEqual({ pinned: ['1.1'] })
    })

    it('should remove outcome from pinned list', async () => {
      const store = useAuthStore()
      store.userData = { uid: '1', email: 'test@test.com', pinned: ['1.1', '2.1'] } as any
      store.currentUser = { uid: '1' } as any
      vi.mocked(updateDoc).mockResolvedValueOnce()

      await store.togglePin('1.1')

      expect(updateDoc).toHaveBeenCalled()
      expect(vi.mocked(updateDoc).mock.calls[0][1]).toEqual({ pinned: ['2.1'] })
    })

    it('should initialize pinned array if undefined', async () => {
      const store = useAuthStore()
      store.userData = { uid: '1', email: 'test@test.com' } as any
      store.currentUser = { uid: '1' } as any
      vi.mocked(updateDoc).mockResolvedValueOnce()

      await store.togglePin('1.1')

      expect(updateDoc).toHaveBeenCalled()
      expect(vi.mocked(updateDoc).mock.calls[0][1]).toEqual({ pinned: ['1.1'] })
    })
  })
})
