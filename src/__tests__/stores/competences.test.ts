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
const mockSetDoc = vi.fn().mockResolvedValue(undefined)
const mockAddDoc = vi.fn().mockResolvedValue({ id: 'mock-id' })
const mockGetDoc = vi.fn()
const mockDeleteDoc = vi.fn().mockResolvedValue(undefined)
const mockOnSnapshot = vi.fn()

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_db, ...path) => ({ path: path.join('/') })),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  addDoc: (...args: any[]) => mockAddDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
  Unsubscribe: vi.fn()
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

import { useCompetencesStore } from '@/stores/competences'
import { useAuthStore } from '@/stores/auth'
import type { Domain, LearningOutcome } from '@/types'

const createMockOutcome = (id: string, overrides?: Partial<LearningOutcome>): LearningOutcome => ({
  id,
  description: `Test outcome ${id}`,
  level: 'Basic',
  mappings: {
    L1: { status: 'none' },
    L2: { status: 'none' },
    L3: { status: 'none' }
  },
  ...overrides
})

const createMockDomains = (): Domain[] => [
  {
    id: '1',
    name: 'Domain 1',
    competences: [
      {
        id: '1.1',
        name: 'Competence 1.1',
        outcomes: [
          createMockOutcome('1.1.1'),
          createMockOutcome('1.1.2', { assignees: ['user@test.com'] })
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Domain 2',
    competences: [
      {
        id: '2.1',
        name: 'Competence 2.1',
        outcomes: [
          createMockOutcome('2.1.1', {
            tags: ['ASSP'],
            comments: [{ text: 'Test', author: 'a@b.com', date: 1000 }]
          })
        ]
      }
    ]
  }
]

describe('useCompetencesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should have correct initial state', () => {
    const store = useCompetencesStore()
    expect(store.digCompData).toEqual({ domains: [] })
    expect(store.loading).toBe(true)
    expect(store.locks).toEqual({})
    expect(store.snapshots).toEqual([])
    expect(store.auditLogs).toEqual([])
  })

  describe('allOutcomes', () => {
    it('should return empty array with no domains', () => {
      const store = useCompetencesStore()
      expect(store.allOutcomes).toEqual([])
    })

    it('should flatten all outcomes from all domains', () => {
      const store = useCompetencesStore()
      store.digCompData.domains = createMockDomains()
      expect(store.allOutcomes).toHaveLength(3)
      expect(store.allOutcomes.map(o => o.id)).toEqual(['1.1.1', '1.1.2', '2.1.1'])
    })
  })

  describe('getOutcomeById', () => {
    it('should return null for non-existent outcome', () => {
      const store = useCompetencesStore()
      store.digCompData.domains = createMockDomains()
      expect(store.getOutcomeById('9.9.9')).toBeNull()
    })

    it('should return the correct outcome', () => {
      const store = useCompetencesStore()
      store.digCompData.domains = createMockDomains()
      const outcome = store.getOutcomeById('1.1.1')
      expect(outcome).not.toBeNull()
      expect(outcome!.id).toBe('1.1.1')
      expect(outcome!.description).toBe('Test outcome 1.1.1')
    })
  })

  describe('isLocked', () => {
    it('should return false when no lock exists', () => {
      const store = useCompetencesStore()
      expect(store.isLocked('1.1.1')).toBe(false)
    })

    it('should return false when lock is expired (>5min)', () => {
      const store = useCompetencesStore()
      store.locks = {
        '1.1.1': { user: 'other@test.com', timestamp: Date.now() - 6 * 60 * 1000 }
      }
      expect(store.isLocked('1.1.1')).toBe(false)
    })

    it('should return true when locked by another user', () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any

      store.locks = {
        '1.1.1': { user: 'other@test.com', timestamp: Date.now() }
      }
      expect(store.isLocked('1.1.1')).toBe(true)
    })

    it('should return false when locked by current user', () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any

      store.locks = {
        '1.1.1': { user: 'me@test.com', timestamp: Date.now() }
      }
      expect(store.isLocked('1.1.1')).toBe(false)
    })
  })

  describe('getLockedBy', () => {
    it('should return null when no lock exists', () => {
      const store = useCompetencesStore()
      expect(store.getLockedBy('1.1.1')).toBeNull()
    })

    it('should return null when lock is expired', () => {
      const store = useCompetencesStore()
      store.locks = {
        '1.1.1': { user: 'other@test.com', timestamp: Date.now() - 6 * 60 * 1000 }
      }
      expect(store.getLockedBy('1.1.1')).toBeNull()
    })

    it('should return user email when lock is active', () => {
      const store = useCompetencesStore()
      store.locks = {
        '1.1.1': { user: 'other@test.com', timestamp: Date.now() }
      }
      expect(store.getLockedBy('1.1.1')).toBe('other@test.com')
    })
  })

  describe('updateStatus', () => {
    it('should update outcome status and save', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      await store.updateStatus('1.1.1', 'L1', 'draft')

      const outcome = store.getOutcomeById('1.1.1')
      expect(outcome!.mappings.L1.status).toBe('draft')
      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should do nothing for non-existent outcome', async () => {
      const store = useCompetencesStore()
      await store.updateStatus('9.9.9', 'L1', 'draft')
      expect(mockSetDoc).not.toHaveBeenCalled()
    })

    it('should create audit log entry', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      await store.updateStatus('1.1.1', 'L1', 'validated')

      // addDoc called for audit_log and activity_feed
      expect(mockAddDoc).toHaveBeenCalledTimes(2)
    })

    it('should notify assignees on status change', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      await store.updateStatus('1.1.2', 'L1', 'review')

      // addDoc: saveData + audit_log + activity_feed + 1 notification for assignee
      expect(mockAddDoc).toHaveBeenCalled()
    })
  })

  describe('addComment', () => {
    it('should add comment to outcome', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      await store.addComment('1.1.1', 'Hello world')

      const outcome = store.getOutcomeById('1.1.1')
      expect(outcome!.comments).toHaveLength(1)
      expect(outcome!.comments![0].text).toBe('Hello world')
      expect(outcome!.comments![0].author).toBe('me@test.com')
    })

    it('should add comment with optional year', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      await store.addComment('1.1.1', 'Year comment', 'L2')

      const outcome = store.getOutcomeById('1.1.1')
      expect(outcome!.comments![0].year).toBe('L2')
    })

    it('should not include year field when undefined', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      await store.addComment('1.1.1', 'No year')

      const outcome = store.getOutcomeById('1.1.1')
      expect(outcome!.comments![0]).not.toHaveProperty('year')
    })
  })

  describe('removeComment', () => {
    it('should remove comment at index', async () => {
      const store = useCompetencesStore()
      store.digCompData.domains = createMockDomains()

      const outcome = store.getOutcomeById('2.1.1')
      expect(outcome!.comments).toHaveLength(1)

      await store.removeComment('2.1.1', 0)

      expect(outcome!.comments).toHaveLength(0)
    })

    it('should do nothing for non-existent outcome', async () => {
      const store = useCompetencesStore()
      await store.removeComment('9.9.9', 0)
      expect(mockSetDoc).not.toHaveBeenCalled()
    })
  })

  describe('toggleAssignee', () => {
    it('should add assignee when not present', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      await store.toggleAssignee('1.1.1', 'new@test.com')

      const outcome = store.getOutcomeById('1.1.1')
      expect(outcome!.assignees).toContain('new@test.com')
    })

    it('should remove assignee when already present', async () => {
      const store = useCompetencesStore()
      store.digCompData.domains = createMockDomains()

      await store.toggleAssignee('1.1.2', 'user@test.com')

      const outcome = store.getOutcomeById('1.1.2')
      expect(outcome!.assignees).not.toContain('user@test.com')
    })

    it('should initialize assignees array if undefined', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      // 2.1.1 has no assignees initially
      await store.toggleAssignee('2.1.1', 'new@test.com')

      const outcome = store.getOutcomeById('2.1.1')
      expect(outcome!.assignees).toEqual(['new@test.com'])
    })
  })

  describe('toggleTag', () => {
    it('should add tag when not present', async () => {
      const store = useCompetencesStore()
      store.digCompData.domains = createMockDomains()

      await store.toggleTag('1.1.1', 'LANG')

      const outcome = store.getOutcomeById('1.1.1')
      expect(outcome!.tags).toContain('LANG')
    })

    it('should remove tag when already present', async () => {
      const store = useCompetencesStore()
      store.digCompData.domains = createMockDomains()

      await store.toggleTag('2.1.1', 'ASSP')

      const outcome = store.getOutcomeById('2.1.1')
      expect(outcome!.tags).not.toContain('ASSP')
    })
  })

  describe('updateDescription', () => {
    it('should update outcome description', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      await store.updateDescription('1.1.1', 'New description')

      const outcome = store.getOutcomeById('1.1.1')
      expect(outcome!.description).toBe('New description')
      expect(mockSetDoc).toHaveBeenCalled()
      expect(mockAddDoc).toHaveBeenCalled() // audit log
    })
  })

  describe('updateCourseLink', () => {
    it('should update course link for year', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      await store.updateCourseLink('1.1.1', 'L1', 'https://example.com')

      const outcome = store.getOutcomeById('1.1.1')
      expect(outcome!.mappings.L1.courseLink).toBe('https://example.com')
    })
  })

  describe('addResource', () => {
    it('should add resource to outcome year', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      await store.addResource('1.1.1', 'L1', { title: 'Test', url: 'https://test.com' })

      const outcome = store.getOutcomeById('1.1.1')
      expect(outcome!.mappings.L1.resources).toHaveLength(1)
      expect(outcome!.mappings.L1.resources![0].title).toBe('Test')
    })

    it('should initialize resources array if undefined', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      // L2 has no resources initially
      await store.addResource('1.1.1', 'L2', { title: 'New', url: 'https://new.com' })

      const outcome = store.getOutcomeById('1.1.1')
      expect(outcome!.mappings.L2.resources).toHaveLength(1)
    })
  })

  describe('removeResource', () => {
    it('should remove resource at index', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      // First add a resource
      const outcome = store.getOutcomeById('1.1.1')!
      outcome.mappings.L1.resources = [{ title: 'Res1', url: 'https://1.com' }]

      await store.removeResource('1.1.1', 'L1', 0)

      expect(outcome.mappings.L1.resources).toHaveLength(0)
    })
  })

  describe('setLock / releaseLock', () => {
    it('should call setDoc for lock', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any

      await store.setLock('1.1.1')

      expect(mockSetDoc).toHaveBeenCalled()
      const data = mockSetDoc.mock.calls[0][1]
      expect(data).toMatchObject({ user: 'me@test.com' })
    })

    it('should not set lock without currentUser', async () => {
      const store = useCompetencesStore()
      await store.setLock('1.1.1')
      expect(mockSetDoc).not.toHaveBeenCalled()
    })

    it('should call deleteDoc for unlock', async () => {
      const store = useCompetencesStore()
      await store.releaseLock('1.1.1')
      expect(mockDeleteDoc).toHaveBeenCalled()
    })
  })

  describe('createSnapshot', () => {
    it('should create a snapshot with current data', async () => {
      const store = useCompetencesStore()
      const authStore = useAuthStore()
      authStore.currentUser = { email: 'me@test.com' } as any
      store.digCompData.domains = createMockDomains()

      await store.createSnapshot('Test Snapshot')

      expect(mockAddDoc).toHaveBeenCalled()
      const data = mockAddDoc.mock.calls[0][1]
      expect(data).toMatchObject({
        name: 'Test Snapshot',
        user: 'me@test.com'
      })
    })
  })

  describe('restoreSnapshot', () => {
    it('should restore domains from snapshot', async () => {
      const store = useCompetencesStore()
      const snapshotDomains = createMockDomains()
      store.snapshots = [{
        id: 'snap-1',
        name: 'Old snapshot',
        user: 'me@test.com',
        date: Date.now(),
        data: snapshotDomains
      }]

      await store.restoreSnapshot('snap-1')

      expect(store.digCompData.domains).toHaveLength(2)
      expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should do nothing for non-existent snapshot', async () => {
      const store = useCompetencesStore()
      await store.restoreSnapshot('non-existent')
      expect(mockSetDoc).not.toHaveBeenCalled()
    })
  })
})
