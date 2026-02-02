import { ref } from 'vue'

// Configuration des intervalles de polling optimisés (en foreground)
const POLLING_INTERVALS = {
  // Chat - 15 secondes
  messages: 15000,

  // Notifications - 30 secondes
  notifications: 30000,

  // Compétences - 30 secondes
  competences: 30000,

  // Gamification - 1 minute
  user_stats: 60000,
  leaderboard: 60000,

  // AI Cache - 2 minutes
  ai_cache: 120000,

  // Review requests - 30 secondes
  review_requests: 30000,

  // Default - 30 secondes
  default: 30000
} as const

// Multiplicateur pour les intervalles quand l'onglet est en arrière-plan
const BACKGROUND_MULTIPLIER: Record<string, number> = {
  messages: 4,        // 15s -> 60s en arrière-plan
  notifications: 3,   // 30s -> 90s
  competences: 3,     // 30s -> 90s
  user_stats: 2,      // 60s -> 120s
  leaderboard: 3,     // 60s -> 180s
  ai_cache: 2,        // 120s -> 240s
  review_requests: 3, // 30s -> 90s
  default: 3
}

// État de visibilité global
const isTabVisible = ref(typeof document !== 'undefined' ? !document.hidden : true)

// Interface pour les polling actifs
interface ActivePolling<T> {
  intervalId: ReturnType<typeof setInterval> | null
  lastData: T | null
  queryFn: () => Promise<T>
  callback: (data: T) => void
  baseInterval: number
  key: string
  fetchWithCache: () => Promise<void>
}

// Cache et état des polling actifs
const activePollings = new Map<string, ActivePolling<unknown>>()
const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

// Initialiser le listener de visibilité une seule fois
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const wasVisible = isTabVisible.value
    isTabVisible.value = !document.hidden

    console.log(`📱 Tab visibility: ${isTabVisible.value ? 'VISIBLE' : 'HIDDEN'}`)

    // Quand l'onglet redevient visible
    if (!wasVisible && isTabVisible.value) {
      // Fetch immédiat pour toutes les données + réajuster les intervalles
      activePollings.forEach((polling) => {
        // Fetch immédiat
        polling.fetchWithCache()
        // Réajuster l'intervalle
        restartPollingWithInterval(polling.key, polling.baseInterval)
      })
    }
    // Quand l'onglet passe en arrière-plan
    else if (wasVisible && !isTabVisible.value) {
      // Ralentir tous les pollings
      activePollings.forEach((polling) => {
        const multiplier = BACKGROUND_MULTIPLIER[polling.key] || BACKGROUND_MULTIPLIER.default
        const backgroundInterval = polling.baseInterval * multiplier
        restartPollingWithInterval(polling.key, backgroundInterval)
      })
    }
  })
}

// Fonction pour redémarrer un polling avec un nouvel intervalle
function restartPollingWithInterval(key: string, interval: number) {
  const polling = activePollings.get(key)
  if (!polling) return

  // Arrêter l'intervalle actuel
  if (polling.intervalId) {
    clearInterval(polling.intervalId)
  }

  // Démarrer avec le nouvel intervalle
  polling.intervalId = setInterval(polling.fetchWithCache, interval)
}

// Interface pour les callbacks
type QueryFunction<T> = () => Promise<T>
type CallbackFunction<T> = (data: T) => void

export function useFirebaseOptimizer() {

  /**
   * Démarre un polling optimisé pour une requête Firebase
   * L'intervalle s'adapte automatiquement selon la visibilité de l'onglet
   */
  const startPolling = <T>(
    key: string,
    queryFn: QueryFunction<T>,
    callback: CallbackFunction<T>,
    customInterval?: number
  ): (() => void) => {

    // Nettoyer le polling existant si présent
    stopPolling(key)

    // Déterminer l'intervalle de base
    const baseInterval = customInterval || POLLING_INTERVALS[key as keyof typeof POLLING_INTERVALS] || POLLING_INTERVALS.default

    // Fonction de fetch avec cache
    const fetchWithCache = async () => {
      try {
        // Vérifier le cache
        const cached = cache.get(key)
        const now = Date.now()

        if (cached && (now - cached.timestamp) < cached.ttl) {
          // Utiliser les données en cache
          callback(cached.data as T)
          return
        }

        // Exécuter la requête
        const data = await queryFn()

        // Mettre en cache
        cache.set(key, {
          data,
          timestamp: now,
          ttl: baseInterval * 0.5 // Cache valide pour la moitié de l'intervalle
        })

        // Appeler le callback
        callback(data)

      } catch (error) {
        console.error(`Error in polling for ${key}:`, error)
      }
    }

    // Première exécution immédiate
    fetchWithCache()

    // Déterminer l'intervalle initial selon la visibilité
    const multiplier = isTabVisible.value ? 1 : (BACKGROUND_MULTIPLIER[key] || BACKGROUND_MULTIPLIER.default)
    const initialInterval = baseInterval * multiplier

    // Configurer le polling
    const intervalId = setInterval(fetchWithCache, initialInterval)

    // Stocker dans les polling actifs
    activePollings.set(key, {
      intervalId,
      lastData: null,
      queryFn,
      callback: callback as CallbackFunction<unknown>,
      baseInterval,
      key,
      fetchWithCache
    })

    console.log(`🔄 Polling started: ${key} (${initialInterval / 1000}s ${isTabVisible.value ? 'foreground' : 'background'})`)

    // Retourner une fonction de cleanup
    return () => stopPolling(key)
  }

  /**
   * Arrête le polling pour une clé donnée
   */
  const stopPolling = (key: string) => {
    const active = activePollings.get(key)
    if (active) {
      if (active.intervalId) {
        clearInterval(active.intervalId)
      }
      activePollings.delete(key)
      console.log(`⏹️ Polling stopped: ${key}`)
    }
  }

  /**
   * Arrête tous les pollings actifs
   */
  const stopAllPolling = () => {
    for (const [key] of activePollings) {
      stopPolling(key)
    }
  }

  /**
   * Nettoie le cache
   */
  const clearCache = (key?: string) => {
    if (key) {
      cache.delete(key)
    } else {
      cache.clear()
    }
  }

  /**
   * Obtient les statistiques des pollings actifs
   */
  const getPollingStats = () => {
    return {
      activeCount: activePollings.size,
      cacheSize: cache.size,
      activeKeys: Array.from(activePollings.keys()),
      intervals: POLLING_INTERVALS,
      isTabVisible: isTabVisible.value
    }
  }

  /**
   * Fonction de debouncing pour les écritures
   */
  const debounceWrite = (() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    return (key: string, fn: () => Promise<void>, delay: number = 1000) => {
      // Annuler le timer précédent
      const existingTimer = timers.get(key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Configurer le nouveau timer
      const timer = setTimeout(async () => {
        try {
          await fn()
          timers.delete(key)
        } catch (error) {
          console.error(`Error in debounced write for ${key}:`, error)
          timers.delete(key)
        }
      }, delay)

      timers.set(key, timer)
    }
  })()

  /**
   * Batching d'opérations d'écriture
   */
  const batchWrite = (() => {
    const batches = new Map<string, { operations: (() => Promise<void>)[]; timer: ReturnType<typeof setTimeout> }>()

    return (batchKey: string, operation: () => Promise<void>, delay: number = 2000) => {
      let batch = batches.get(batchKey)

      if (!batch) {
        // Créer un nouveau batch
        batch = {
          operations: [],
          timer: setTimeout(async () => {
            const currentBatch = batches.get(batchKey)
            if (currentBatch) {
              // Exécuter toutes les opérations du batch
              try {
                await Promise.all(currentBatch.operations.map(op => op()))
              } catch (error) {
                console.error(`Error in batch write for ${batchKey}:`, error)
              } finally {
                batches.delete(batchKey)
              }
            }
          }, delay)
        }
        batches.set(batchKey, batch)
      } else {
        // Reset du timer
        clearTimeout(batch.timer)
        batch.timer = setTimeout(async () => {
          const currentBatch = batches.get(batchKey)
          if (currentBatch) {
            try {
              await Promise.all(currentBatch.operations.map(op => op()))
            } catch (error) {
              console.error(`Error in batch write for ${batchKey}:`, error)
            } finally {
              batches.delete(batchKey)
            }
          }
        }, delay)
      }

      // Ajouter l'opération au batch
      batch.operations.push(operation)
    }
  })()

  return {
    startPolling,
    stopPolling,
    stopAllPolling,
    clearCache,
    getPollingStats,
    debounceWrite,
    batchWrite,
    isTabVisible,
    POLLING_INTERVALS,
    BACKGROUND_MULTIPLIER
  }
}

// Export pour utilisation directe des constantes
export { POLLING_INTERVALS, BACKGROUND_MULTIPLIER, isTabVisible }
