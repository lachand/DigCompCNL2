import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
  Unsubscribe,
  updateDoc,
  deleteDoc
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import type {
  DigCompData,
  Domain,
  LearningOutcome,
  YearLevel,
  StatusType,
  Resource,
  Comment,
  AuditLog,
  Lock,
  Snapshot,
  Deadline
} from '@/types'
import { useAuthStore } from './auth'
import { useNotificationsStore } from './notifications'
import { useToast } from '@/composables/useToast'
import { useGamification } from '@/composables/useGamification'

export const useCompetencesStore = defineStore('competences', () => {
  const digCompData = ref<DigCompData>({ domains: [] })
  const loading = ref(true)
  const locks = ref<Record<string, Lock>>({})
  const snapshots = ref<Snapshot[]>([])
  const auditLogs = ref<AuditLog[]>([])

  let dataUnsubscribe: Unsubscribe | null = null
  let locksUnsubscribe: Unsubscribe | null = null
  let snapshotsUnsubscribe: Unsubscribe | null = null
  let auditUnsubscribe: Unsubscribe | null = null

  const { success, error: showError } = useToast()

  // Computed
  const allOutcomes = computed(() => {
    const outcomes: LearningOutcome[] = []
    digCompData.value.domains.forEach(domain => {
      domain.competences.forEach(comp => {
        outcomes.push(...comp.outcomes)
      })
    })
    return outcomes
  })

  const getOutcomeById = (id: string): LearningOutcome | null => {
    return allOutcomes.value.find(o => o.id === id) || null
  }

  const isLocked = (outcomeId: string): boolean => {
    const authStore = useAuthStore()
    const lock = locks.value[outcomeId]
    if (!lock) return false

    const isExpired = Date.now() - lock.timestamp > 5 * 60 * 1000 // 5 minutes
    if (isExpired) return false

    return lock.user !== authStore.currentUser?.email
  }

  const getLockedBy = (outcomeId: string): string | null => {
    const lock = locks.value[outcomeId]
    if (!lock) return null

    const isExpired = Date.now() - lock.timestamp > 5 * 60 * 1000
    if (isExpired) return null

    return lock.user
  }

  // Actions
  const loadData = async () => {
    loading.value = true
    try {
      const docRef = doc(db, 'digcomp_data', 'main_v2')
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        digCompData.value = docSnap.data() as DigCompData
      }

      // Setup real-time listener
      dataUnsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          digCompData.value = snapshot.data() as DigCompData
        }
      })

      // Listen to locks
      locksUnsubscribe = onSnapshot(collection(db, 'locks'), (snapshot) => {
        const newLocks: Record<string, Lock> = {}
        snapshot.docs.forEach(doc => {
          newLocks[doc.id] = doc.data() as Lock
        })
        locks.value = newLocks
      })

      // Listen to snapshots
      snapshotsUnsubscribe = onSnapshot(
        query(collection(db, 'snapshots'), orderBy('date', 'desc'), limit(20)),
        (snapshot) => {
          snapshots.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Snapshot))
        }
      )

      // Listen to audit logs
      auditUnsubscribe = onSnapshot(
        query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(50)),
        (snapshot) => {
          auditLogs.value = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as AuditLog))
        }
      )
    } catch (err) {
      console.error('Error loading data:', err)
      showError('Erreur de chargement des données')
    } finally {
      loading.value = false
    }
  }

  const saveData = async () => {
    try {
      const docRef = doc(db, 'digcomp_data', 'main_v2')
      await setDoc(docRef, {
        ...digCompData.value,
        lastUpdated: Date.now()
      })
      success('Données sauvegardées')
    } catch (err) {
      console.error('Error saving data:', err)
      showError('Erreur de sauvegarde')
    }
  }

  const updateStatus = async (
    outcomeId: string,
    year: YearLevel,
    status: StatusType
  ) => {
    const authStore = useAuthStore()
    const outcome = getOutcomeById(outcomeId)
    if (!outcome) return

    const oldStatus = outcome.mappings[year].status

    outcome.mappings[year].status = status
    await saveData()

    // Log audit
    await addDoc(collection(db, 'audit_logs'), {
      timestamp: Date.now(),
      user: authStore.currentUser?.email || '',
      action: 'status_change',
      targetId: outcomeId,
      desc: `Statut ${year} : ${oldStatus} → ${status}`,
      year,
      oldVal: oldStatus,
      newVal: status
    })

    // Activity feed
    await addDoc(collection(db, 'activity_feed'), {
      user: authStore.currentUser?.email || '',
      action: 'a changé le statut',
      detail: `${outcomeId} (${year}) : ${status}`,
      date: Date.now()
    })

    // Notify assignees (exclude external members)
    const notificationsStore = useNotificationsStore()
    const assignees = (outcome.assignees || []).filter(a => !a.startsWith('ext:'))
    if (assignees.length > 0) {
      await notificationsStore.notifyStatusChange(
        outcomeId,
        year,
        status,
        assignees,
        authStore.currentUser?.email || ''
      )
    }

    // Gamification
    const { recordAction } = useGamification()
    await recordAction('statusChange')
    if (status === 'validated') {
      await recordAction('validation')
    }
  }

  const updateCourseLink = async (
    outcomeId: string,
    year: YearLevel,
    link: string
  ) => {
    const authStore = useAuthStore()
    const outcome = getOutcomeById(outcomeId)
    if (!outcome) return

    outcome.mappings[year].courseLink = link
    await saveData()

    await addDoc(collection(db, 'audit_logs'), {
      timestamp: Date.now(),
      user: authStore.currentUser?.email || '',
      action: 'link_update',
      targetId: outcomeId,
      desc: `Lien ${year} modifié`,
      year,
      newVal: link
    })
  }

  const addResource = async (
    outcomeId: string,
    year: YearLevel,
    resource: Resource
  ) => {
    const authStore = useAuthStore()
    const outcome = getOutcomeById(outcomeId)
    if (!outcome) return

    if (!outcome.mappings[year].resources) {
      outcome.mappings[year].resources = []
    }

    outcome.mappings[year].resources!.push(resource)
    await saveData()

    await addDoc(collection(db, 'audit_logs'), {
      timestamp: Date.now(),
      user: authStore.currentUser?.email || '',
      action: 'resource_add',
      targetId: outcomeId,
      desc: `Ressource ajoutée (${year}) : ${resource.title}`,
      year
    })

    success('Ressource ajoutée')

    // Gamification
    const { recordAction } = useGamification()
    await recordAction('resource')
  }

  const reorderResources = async (
    outcomeId: string,
    year: YearLevel,
    fromIndex: number,
    toIndex: number
  ) => {
    const outcome = getOutcomeById(outcomeId)
    if (!outcome || !outcome.mappings[year].resources) return

    const resources = outcome.mappings[year].resources!
    const [moved] = resources.splice(fromIndex, 1)
    resources.splice(toIndex, 0, moved)
    await saveData()
  }

  const removeResource = async (
    outcomeId: string,
    year: YearLevel,
    resourceIndex: number
  ) => {
    const authStore = useAuthStore()
    const outcome = getOutcomeById(outcomeId)
    if (!outcome || !outcome.mappings[year].resources) return

    const resource = outcome.mappings[year].resources![resourceIndex]
    outcome.mappings[year].resources!.splice(resourceIndex, 1)
    await saveData()

    await addDoc(collection(db, 'audit_logs'), {
      timestamp: Date.now(),
      user: authStore.currentUser?.email || '',
      action: 'resource_remove',
      targetId: outcomeId,
      desc: `Ressource supprimée (${year}) : ${resource.title}`,
      year
    })
  }

  const updateDescription = async (outcomeId: string, newDescription: string) => {
    const authStore = useAuthStore()
    const outcome = getOutcomeById(outcomeId)
    if (!outcome) return

    const oldDescription = outcome.description
    outcome.description = newDescription
    await saveData()

    await addDoc(collection(db, 'audit_logs'), {
      timestamp: Date.now(),
      user: authStore.currentUser?.email || '',
      action: 'description_edit',
      targetId: outcomeId,
      desc: 'Description modifiée',
      oldVal: oldDescription,
      newVal: newDescription
    })
  }

  const toggleAssignee = async (outcomeId: string, assigneeKey: string) => {
    const outcome = getOutcomeById(outcomeId)
    if (!outcome) return

    if (!outcome.assignees) {
      outcome.assignees = []
    }

    const index = outcome.assignees.indexOf(assigneeKey)
    const isAdding = index === -1
    if (index > -1) {
      outcome.assignees.splice(index, 1)
    } else {
      outcome.assignees.push(assigneeKey)
    }

    await saveData()

    // Notify the assigned user (only for registered users, not external members)
    if (isAdding && !assigneeKey.startsWith('ext:')) {
      const authStore = useAuthStore()
      const notificationsStore = useNotificationsStore()
      await notificationsStore.notifyAssignment(
        outcomeId,
        'all',
        assigneeKey,
        authStore.currentUser?.email || ''
      )
    }
  }

  const toggleTag = async (outcomeId: string, tag: string) => {
    const outcome = getOutcomeById(outcomeId)
    if (!outcome) return

    if (!outcome.tags) {
      outcome.tags = []
    }

    const index = outcome.tags.indexOf(tag)
    if (index > -1) {
      outcome.tags.splice(index, 1)
    } else {
      outcome.tags.push(tag)
    }

    await saveData()
  }

  const addComment = async (
    outcomeId: string,
    text: string,
    year?: YearLevel
  ) => {
    const authStore = useAuthStore()
    const outcome = getOutcomeById(outcomeId)
    if (!outcome) return

    if (!outcome.comments) {
      outcome.comments = []
    }

    const comment: Comment = {
      text,
      author: authStore.currentUser?.email || '',
      date: Date.now(),
      ...(year !== undefined && { year })
    }

    outcome.comments.push(comment)
    await saveData()

    // Notify assignees about the new comment
    const notificationsStore = useNotificationsStore()
    const assignees = outcome.assignees || []
    if (assignees.length > 0) {
      await notificationsStore.notifyComment(
        outcomeId,
        text,
        assignees,
        authStore.currentUser?.email || ''
      )
    }

    // Gamification
    const { recordAction } = useGamification()
    await recordAction('comment')
  }

  const removeComment = async (outcomeId: string, commentIndex: number) => {
    const outcome = getOutcomeById(outcomeId)
    if (!outcome || !outcome.comments) return

    outcome.comments.splice(commentIndex, 1)
    await saveData()
  }

  const setLock = async (outcomeId: string) => {
    const authStore = useAuthStore()
    if (!authStore.currentUser?.email) return

    const lockRef = doc(db, 'locks', outcomeId)
    await setDoc(lockRef, {
      user: authStore.currentUser.email,
      timestamp: Date.now()
    })
  }

  const releaseLock = async (outcomeId: string) => {
    const lockRef = doc(db, 'locks', outcomeId)
    await deleteDoc(lockRef)
  }

  const createSnapshot = async (name: string) => {
    const authStore = useAuthStore()

    const snapshot: Snapshot = {
      name,
      user: authStore.currentUser?.email || '',
      date: Date.now(),
      data: JSON.parse(JSON.stringify(digCompData.value.domains)) // Deep copy
    }

    await addDoc(collection(db, 'snapshots'), snapshot)
    success('Snapshot créé')
  }

  const restoreSnapshot = async (snapshotId: string) => {
    const snapshot = snapshots.value.find(s => s.id === snapshotId)
    if (!snapshot) return

    digCompData.value.domains = JSON.parse(JSON.stringify(snapshot.data))
    await saveData()
    success('Snapshot restauré')
  }

  const setDeadline = async (
    outcomeId: string,
    year: YearLevel,
    deadline: Deadline
  ) => {
    const authStore = useAuthStore()
    const outcome = getOutcomeById(outcomeId)
    if (!outcome) return

    outcome.mappings[year].deadline = deadline
    await saveData()

    await addDoc(collection(db, 'audit_logs'), {
      timestamp: Date.now(),
      user: authStore.currentUser?.email || '',
      action: 'deadline_set',
      targetId: outcomeId,
      desc: `Deadline ${year} : ${deadline.label} (${new Date(deadline.date).toLocaleDateString('fr-FR')})`,
      year,
      newVal: deadline.label
    })

    // Activity feed
    await addDoc(collection(db, 'activity_feed'), {
      user: authStore.currentUser?.email || '',
      action: 'a défini une deadline',
      detail: `${outcomeId} (${year}) : ${deadline.label}`,
      date: Date.now()
    })

    // Notify assignees
    const notificationsStore = useNotificationsStore()
    const assignees = (outcome.assignees || []).filter(a => a !== authStore.currentUser?.email)
    if (assignees.length > 0) {
      await notificationsStore.notifyDeadlineAssigned(
        outcomeId,
        year,
        deadline.label,
        new Date(deadline.date).toLocaleDateString('fr-FR'),
        assignees,
        authStore.currentUser?.email || ''
      )
    }

    success('Deadline définie')
  }

  const removeDeadline = async (
    outcomeId: string,
    year: YearLevel
  ) => {
    const authStore = useAuthStore()
    const outcome = getOutcomeById(outcomeId)
    if (!outcome || !outcome.mappings[year].deadline) return

    const oldLabel = outcome.mappings[year].deadline!.label
    delete outcome.mappings[year].deadline
    await saveData()

    await addDoc(collection(db, 'audit_logs'), {
      timestamp: Date.now(),
      user: authStore.currentUser?.email || '',
      action: 'deadline_remove',
      targetId: outcomeId,
      desc: `Deadline ${year} supprimée : ${oldLabel}`,
      year,
      oldVal: oldLabel
    })

    success('Deadline supprimée')
  }

  const cleanup = () => {
    if (dataUnsubscribe) dataUnsubscribe()
    if (locksUnsubscribe) locksUnsubscribe()
    if (snapshotsUnsubscribe) snapshotsUnsubscribe()
    if (auditUnsubscribe) auditUnsubscribe()
  }

  return {
    digCompData,
    loading,
    locks,
    snapshots,
    auditLogs,
    allOutcomes,
    getOutcomeById,
    isLocked,
    getLockedBy,
    loadData,
    saveData,
    updateStatus,
    updateCourseLink,
    addResource,
    reorderResources,
    removeResource,
    updateDescription,
    toggleAssignee,
    toggleTag,
    addComment,
    removeComment,
    setLock,
    releaseLock,
    createSnapshot,
    restoreSnapshot,
    setDeadline,
    removeDeadline,
    cleanup
  }
})
