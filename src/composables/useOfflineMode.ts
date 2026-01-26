import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useToast } from '@/composables/useToast'

const CACHE_KEY = 'digcomp_offline_data'
const PENDING_ACTIONS_KEY = 'digcomp_pending_actions'

export interface PendingAction {
  id: string
  type: 'status_change' | 'resource_add' | 'resource_remove' | 'course_link' | 'comment_add'
  payload: any
  timestamp: number
}

const isOnline = ref(navigator.onLine)
const pendingActions = ref<PendingAction[]>([])
const lastSyncTime = ref<number | null>(null)

// Load pending actions from localStorage
const loadPendingActions = () => {
  try {
    const stored = localStorage.getItem(PENDING_ACTIONS_KEY)
    if (stored) {
      pendingActions.value = JSON.parse(stored)
    }
  } catch (e) {
    console.warn('Failed to load pending actions:', e)
  }
}

// Save pending actions to localStorage
const savePendingActions = () => {
  localStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(pendingActions.value))
}

export function useOfflineMode() {
  const { info, success, error: showError } = useToast()

  const hasPendingActions = computed(() => pendingActions.value.length > 0)

  const pendingCount = computed(() => pendingActions.value.length)

  // Cache data for offline use
  const cacheData = (data: any) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
      lastSyncTime.value = Date.now()
    } catch (e) {
      console.warn('Failed to cache data:', e)
    }
  }

  // Get cached data
  const getCachedData = () => {
    try {
      const stored = localStorage.getItem(CACHE_KEY)
      if (stored) {
        const { data, timestamp } = JSON.parse(stored)
        lastSyncTime.value = timestamp
        return data
      }
    } catch (e) {
      console.warn('Failed to get cached data:', e)
    }
    return null
  }

  // Add pending action for later sync
  const addPendingAction = (action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    const pendingAction: PendingAction = {
      ...action,
      id: `${action.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }
    pendingActions.value.push(pendingAction)
    savePendingActions()

    if (!isOnline.value) {
      info('Action enregistrée pour synchronisation ultérieure')
    }
  }

  // Clear a pending action after successful sync
  const clearPendingAction = (actionId: string) => {
    pendingActions.value = pendingActions.value.filter(a => a.id !== actionId)
    savePendingActions()
  }

  // Clear all pending actions
  const clearAllPendingActions = () => {
    pendingActions.value = []
    savePendingActions()
  }

  // Sync pending actions when back online
  const syncPendingActions = async (
    processAction: (action: PendingAction) => Promise<boolean>
  ) => {
    if (!isOnline.value || pendingActions.value.length === 0) return

    info('Synchronisation en cours...')

    let successCount = 0
    let errorCount = 0

    for (const action of [...pendingActions.value]) {
      try {
        const success = await processAction(action)
        if (success) {
          clearPendingAction(action.id)
          successCount++
        } else {
          errorCount++
        }
      } catch (e) {
        console.error('Failed to sync action:', action.id, e)
        errorCount++
      }
    }

    if (successCount > 0) {
      success(`${successCount} action(s) synchronisée(s)`)
    }
    if (errorCount > 0) {
      showError(`${errorCount} action(s) en erreur`)
    }
  }

  // Format last sync time
  const formatSyncTime = computed(() => {
    if (!lastSyncTime.value) return 'Jamais'

    const diff = Date.now() - lastSyncTime.value
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    return new Date(lastSyncTime.value).toLocaleDateString('fr-FR')
  })

  // Online/offline event handlers
  const handleOnline = () => {
    isOnline.value = true
    success('Connexion rétablie')
  }

  const handleOffline = () => {
    isOnline.value = false
    info('Mode hors-ligne activé')
  }

  onMounted(() => {
    loadPendingActions()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    isOnline,
    hasPendingActions,
    pendingCount,
    pendingActions,
    lastSyncTime,
    formatSyncTime,
    cacheData,
    getCachedData,
    addPendingAction,
    clearPendingAction,
    clearAllPendingActions,
    syncPendingActions
  }
}
