// Système de délais optimisés pour réduire les lectures Firestore
import { ref } from 'vue'

// Configuration des délais (en millisecondes)
export const OPTIMIZED_DELAYS = {
  // Chat - quasi temps réel (léger délai)
  CHAT_MESSAGES: 2000, // 2s au lieu de temps réel
  
  // Données utilisateur importantes - délai modéré
  USER_NOTIFICATIONS: 10000, // 10s
  USER_STATS: 15000, // 15s
  USER_INVENTORY: 20000, // 20s
  USER_QUESTS: 25000, // 25s
  
  // Gamification et compétences
  GAMIFICATION: 30000, // 30s pour les systèmes de gamification
  COMPETENCES: 15000, // 15s pour les données de compétences
  
  // Listes et utilisateurs  
  USER_LIST: 60000, // 1 minute pour les listes d'utilisateurs
  USERS_LIST: 120000, // 2min pour la liste complète des utilisateurs
  EXTERNAL_MEMBERS: 600000, // 10min pour les membres externes
  
  // Données partagées - délais plus longs
  LEADERBOARD: 30000, // 30s
  NEWS: 0, // Chargement unique au démarrage (pas de polling)
  ACTIVITY_LOGS: 45000, // 45s
  
  // Données statiques - très longs délais
  SHOP_ITEMS: 300000, // 5min
  CHALLENGES: 180000, // 3min
  
  // Données d'audit - délais très longs
  AUDIT_LOGS: 900000, // 15min
  SNAPSHOTS: 1200000, // 20min
  LOCKS: 600000, // 10min
  
  // Cache - délai court mais pas temps réel
  AI_CACHE: 5000, // 5s
}

// Fonction pour créer un listener avec délai
export const createDelayedListener = (
  callback: () => void,
  delay: number,
  immediate: boolean = true
) => {
  let timeoutId: NodeJS.Timeout | null = null
  let isActive = true
  
  const scheduleNext = () => {
    if (!isActive) return
    timeoutId = setTimeout(() => {
      if (isActive) {
        callback()
        scheduleNext() // Reprogrammer le prochain
      }
    }, delay)
  }
  
  // Exécuter immédiatement si demandé
  if (immediate) {
    callback()
  }
  
  // Démarrer le cycle
  scheduleNext()
  
  // Retourner fonction de nettoyage
  return () => {
    isActive = false
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }
}

// Helper pour obtenir le délai selon le type
export const getOptimizedDelay = (type: keyof typeof OPTIMIZED_DELAYS): number => {
  return OPTIMIZED_DELAYS[type] || 30000 // Défaut 30s
}

// Statistiques des optimisations
export const optimizationStats = ref({
  delayedCalls: 0,
  savedReads: 0,
  activeListeners: 0
})

// Fonction pour logger les optimisations
export const logOptimization = (type: string, delay: number | string) => {
  optimizationStats.value.delayedCalls++
  
  if (typeof delay === 'string') {
    console.log(`🎯 OPTIMIZED: ${type} - ${delay}`)
    optimizationStats.value.savedReads += 90 // Chargement unique économise ~90%
    return
  }
  
  if (delay === 0) {
    console.log(`🎯 OPTIMIZED: ${type} - Chargement unique au démarrage (Lectures économisées: ~90%)`)
    optimizationStats.value.savedReads += 90
    return
  }
  
  // Estimer les lectures économisées (basé sur la différence avec le temps réel)
  const timeRealEquivalent = 1000 // 1s pour temps réel
  const savingFactor = delay / timeRealEquivalent
  optimizationStats.value.savedReads += Math.floor(savingFactor * 100) // Estimation
  
  console.log(`🎯 OPTIMIZED: ${type} - Délai ${delay/1000}s (Lectures économisées: ~${Math.floor(savingFactor * 100)}%)`)
}