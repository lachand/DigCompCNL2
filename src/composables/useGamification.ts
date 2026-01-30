import { ref, computed, watch } from 'vue'
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  Unsubscribe
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useExtendedGamificationStore } from '@/stores/extendedGamification'
import { useAuthStore } from '@/stores/auth'
import { useToast } from './useToast'

// Badge definitions
export const BADGE_DEFINITIONS: Badge[] = [
  { id: 'premier-pas', name: 'Premier pas', description: 'Premier changement de statut', icon: 'ph-flag' },
  { id: 'commentateur', name: 'Commentateur', description: '10 commentaires postés', icon: 'ph-chat-circle-text' },
  { id: 'bibliothecaire', name: 'Bibliothécaire', description: '20 ressources ajoutées', icon: 'ph-books' },
  { id: 'reviewer', name: 'Reviewer', description: '5 reviews effectuées', icon: 'ph-eye' },
  { id: 'validateur', name: 'Validateur', description: '10 LO validés', icon: 'ph-seal-check' },
  { id: 'marathonien', name: 'Marathonien', description: 'Streak de 7 jours', icon: 'ph-fire' },
  { id: 'collaborateur', name: 'Collaborateur', description: '5 assignations', icon: 'ph-users-three' },
  { id: 'erudit', name: 'Érudit', description: '50 actions totales', icon: 'ph-brain' },
  { id: 'legende', name: 'Légende', description: '100 points accumulés', icon: 'ph-trophy' },
  { id: 'assidu', name: 'Assidu', description: 'Streak de 30 jours', icon: 'ph-medal' }
]

const POINTS: Record<string, number> = {
  statusChange: 1,
  validation: 5,
  review: 3,
  comment: 1,
  resource: 2
}

// Module-level state (singleton)
const userStats = ref<UserStats | null>(null)
const leaderboard = ref<UserStats[]>([])
const loading = ref(false)

let statsUnsubscribe: Unsubscribe | null = null
let leaderboardUnsubscribe: Unsubscribe | null = null
let initialized = false

export function useGamification() {
  const { success } = useToast()

  const earnedBadges = computed<Badge[]>(() => {
    if (!userStats.value) return []
    return BADGE_DEFINITIONS.filter(b => userStats.value!.badges.includes(b.id)).map(b => ({
      ...b,
      earnedAt: Date.now()
    }))
  })

  const nextBadge = computed<{ badge: Badge; progress: number; target: number } | null>(() => {
    if (!userStats.value) return null
    const stats = userStats.value

    // Find the first badge not yet earned and show progress
    for (const badge of BADGE_DEFINITIONS) {
      if (stats.badges.includes(badge.id)) continue

      switch (badge.id) {
        case 'premier-pas':
          return { badge, progress: stats.actionCounts.statusChanges, target: 1 }
        case 'commentateur':
          return { badge, progress: stats.actionCounts.comments, target: 10 }
        case 'bibliothecaire':
          return { badge, progress: stats.actionCounts.resources, target: 20 }
        case 'reviewer':
          return { badge, progress: stats.actionCounts.reviews, target: 5 }
        case 'validateur':
          return { badge, progress: stats.actionCounts.validations, target: 10 }
        case 'marathonien':
          return { badge, progress: stats.currentStreak, target: 7 }
        case 'collaborateur':
          return { badge, progress: 0, target: 5 }
        case 'erudit': {
          const total = Object.values(stats.actionCounts).reduce((a, b) => a + b, 0)
          return { badge, progress: total, target: 50 }
        }
        case 'legende':
          return { badge, progress: stats.points, target: 100 }
        case 'assidu':
          return { badge, progress: stats.longestStreak, target: 30 }
      }
    }
    return null
  })

  const startListeners = (email: string) => {
    // Cleanup previous listeners
    if (statsUnsubscribe) statsUnsubscribe()
    if (leaderboardUnsubscribe) leaderboardUnsubscribe()

    loading.value = true
    const statsRef = doc(db, 'user_stats', email)

    statsUnsubscribe = onSnapshot(statsRef, (snap) => {
      if (snap.exists()) {
        userStats.value = { id: snap.id, ...snap.data() } as UserStats
      } else {
        // Create default stats
        const defaultStats: Omit<UserStats, 'id'> = {
          userId: email,
          points: 0,
          badges: [],
          level: 1,
          nextLevelPoints: 100,
          achievements: [],
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: '',
          actionCounts: {
            statusChanges: 0,
            reviews: 0,
            validations: 0,
            comments: 0,
            resources: 0,
            messagesPosted: 0,
            messagesEdited: 0
          }
        }
        setDoc(statsRef, defaultStats)
        userStats.value = { id: email, ...defaultStats }
      }
      loading.value = false
    })

    // Load leaderboard
    const leaderboardQuery = query(
      collection(db, 'user_stats'),
      orderBy('points', 'desc'),
      limit(10)
    )

    leaderboardUnsubscribe = onSnapshot(leaderboardQuery, (snapshot) => {
      leaderboard.value = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as UserStats))
    })
  }

  const loadStats = () => {
    if (initialized) return
    initialized = true

    const authStore = useAuthStore()

    // If email already available, start immediately
    if (authStore.currentUser?.email) {
      startListeners(authStore.currentUser.email)
      return
    }

    // Otherwise, watch for auth to become ready
    const stopWatch = watch(
      () => authStore.currentUser?.email,
      (email) => {
        if (email) {
          startListeners(email)
          stopWatch()
        }
      }
    )
  }

  const recordAction = async (type: 'statusChange' | 'validation' | 'review' | 'comment' | 'resource') => {
    const authStore = useAuthStore()
    const extendedGamification = useExtendedGamificationStore()
    const email = authStore.currentUser?.email
    if (!email || !userStats.value) return

    const stats = { ...userStats.value }
    const today = new Date().toISOString().split('T')[0]

    // Update points
    stats.points += POINTS[type]

    // Update action counts
    const countKey: Record<string, keyof UserStats['actionCounts']> = {
      statusChange: 'statusChanges',
      validation: 'validations',
      review: 'reviews',
      comment: 'comments',
      resource: 'resources'
    }
    stats.actionCounts[countKey[type]]++

    // Update extended gamification quests
    await extendedGamification.updateQuestProgress(type)

    // Update streak
    if (stats.lastActivityDate !== today) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      if (stats.lastActivityDate === yesterdayStr) {
        stats.currentStreak++
      } else if (stats.lastActivityDate !== today) {
        stats.currentStreak = 1
      }

      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak
      }

      stats.lastActivityDate = today
    }

    // Check for new badges
    const newBadges = checkNewBadges(stats)

    stats.badges = [...new Set([...stats.badges, ...newBadges])]

    // Save to Firestore
    const { id, ...statsData } = stats
    await setDoc(doc(db, 'user_stats', email), statsData)

    // Toast for new badges
    for (const badgeId of newBadges) {
      const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId)
      if (badge) {
        success(`Badge débloqué : ${badge.name} !`)
      }
    }
  }

  const checkNewBadges = (stats: UserStats): string[] => {
    const newBadges: string[] = []
    const existing = new Set(stats.badges)

    if (!existing.has('premier-pas') && stats.actionCounts.statusChanges >= 1) {
      newBadges.push('premier-pas')
    }
    if (!existing.has('commentateur') && stats.actionCounts.comments >= 10) {
      newBadges.push('commentateur')
    }
    if (!existing.has('bibliothecaire') && stats.actionCounts.resources >= 20) {
      newBadges.push('bibliothecaire')
    }
    if (!existing.has('reviewer') && stats.actionCounts.reviews >= 5) {
      newBadges.push('reviewer')
    }
    if (!existing.has('validateur') && stats.actionCounts.validations >= 10) {
      newBadges.push('validateur')
    }
    if (!existing.has('marathonien') && stats.currentStreak >= 7) {
      newBadges.push('marathonien')
    }
    if (!existing.has('erudit')) {
      const total = Object.values(stats.actionCounts).reduce((a, b) => a + b, 0)
      if (total >= 50) newBadges.push('erudit')
    }
    if (!existing.has('legende') && stats.points >= 100) {
      newBadges.push('legende')
    }
    if (!existing.has('assidu') && stats.longestStreak >= 30) {
      newBadges.push('assidu')
    }

    return newBadges
  }

  const cleanup = () => {
    if (statsUnsubscribe) {
      statsUnsubscribe()
      statsUnsubscribe = null
    }
    if (leaderboardUnsubscribe) {
      leaderboardUnsubscribe()
      leaderboardUnsubscribe = null
    }
    initialized = false
  }

  return {
    userStats,
    leaderboard,
    loading,
    earnedBadges,
    nextBadge,
    loadStats,
    recordAction,
    cleanup,
    BADGE_DEFINITIONS
  }
}
