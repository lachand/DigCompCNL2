import { ref, computed } from 'vue'
import { collection, addDoc, query, orderBy, limit, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'
import type { AIHistoryEntry, AIGenerationType } from '@/types'

const historyEntries = ref<AIHistoryEntry[]>([])
const isLoading = ref(false)
let unsubscribe: (() => void) | null = null

export function useAICache() {
  const authStore = useAuthStore()

  // Load history from Firestore
  const loadHistory = (limitCount = 50) => {
    if (unsubscribe) return // Already listening

    isLoading.value = true
    const q = query(
      collection(db, 'ai_history'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      historyEntries.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AIHistoryEntry))
      isLoading.value = false
    })
  }

  // Save generation to history
  const saveToHistory = async (
    outcomeId: string,
    outcomeDescription: string,
    type: AIGenerationType,
    model: string,
    content: string
  ) => {
    const entry: Omit<AIHistoryEntry, 'id'> = {
      outcomeId,
      outcomeDescription,
      type,
      model,
      content,
      timestamp: Date.now(),
      user: authStore.userData?.email || 'unknown'
    }

    await addDoc(collection(db, 'ai_history'), entry)
  }

  // Get cached result for same outcome/type
  const getCached = (outcomeId: string, type: AIGenerationType): AIHistoryEntry | null => {
    // Return most recent matching entry from last 24 hours
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000
    return historyEntries.value.find(
      e => e.outcomeId === outcomeId && e.type === type && e.timestamp > dayAgo
    ) || null
  }

  // Delete history entry
  const deleteEntry = async (entryId: string) => {
    await deleteDoc(doc(db, 'ai_history', entryId))
  }

  // Clear all history for current user
  const clearUserHistory = async () => {
    const userEmail = authStore.userData?.email
    if (!userEmail) return

    const entriesToDelete = historyEntries.value.filter(e => e.user === userEmail)
    await Promise.all(entriesToDelete.map(e => deleteDoc(doc(db, 'ai_history', e.id))))
  }

  // Filter history
  const getHistoryForOutcome = (outcomeId: string) => {
    return computed(() => historyEntries.value.filter(e => e.outcomeId === outcomeId))
  }

  const getHistoryByType = (type: AIGenerationType) => {
    return computed(() => historyEntries.value.filter(e => e.type === type))
  }

  // Stats
  const stats = computed(() => ({
    total: historyEntries.value.length,
    byType: {
      course: historyEntries.value.filter(e => e.type === 'course').length,
      td: historyEntries.value.filter(e => e.type === 'td').length,
      qcm: historyEntries.value.filter(e => e.type === 'qcm').length,
      practice: historyEntries.value.filter(e => e.type === 'practice').length
    },
    today: historyEntries.value.filter(e => e.timestamp > Date.now() - 24 * 60 * 60 * 1000).length
  }))

  // Cleanup
  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    historyEntries,
    isLoading,
    loadHistory,
    saveToHistory,
    getCached,
    deleteEntry,
    clearUserHistory,
    getHistoryForOutcome,
    getHistoryByType,
    stats,
    cleanup
  }
}
