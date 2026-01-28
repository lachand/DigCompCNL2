import { ref } from 'vue'
import { useToast } from './useToast'
import type { Achievement } from '@/types'

export const ACHIEVEMENTS_LIBRARY: Achievement[] = [
  // Chat achievements
  {
    id: 'chat-first-message',
    name: 'Premier message',
    description: 'Envoyer son premier message dans le chat',
    unlockedAt: 0,
    rarity: 'common'
  },
  {
    id: 'chat-100-messages',
    name: 'Bavard',
    description: 'Envoyer 100 messages',
    unlockedAt: 0,
    rarity: 'uncommon'
  },
  {
    id: 'chat-editor',
    name: 'Correcteur',
    description: 'Éditer un message 10 fois',
    unlockedAt: 0,
    rarity: 'rare'
  },
  // Gamification achievements
  {
    id: 'level-5',
    name: 'Apprenti',
    description: 'Atteindre le niveau 5',
    unlockedAt: 0,
    rarity: 'uncommon'
  },
  {
    id: 'level-10',
    name: 'Maitre',
    description: 'Atteindre le niveau 10',
    unlockedAt: 0,
    rarity: 'rare'
  },
  {
    id: 'level-20',
    name: 'Légende',
    description: 'Atteindre le niveau 20',
    unlockedAt: 0,
    rarity: 'legendary'
  },
  // Activity achievements
  {
    id: 'streak-7',
    name: 'Régulier',
    description: 'Maintenir une activité pendant 7 jours',
    unlockedAt: 0,
    rarity: 'uncommon'
  },
  {
    id: 'streak-30',
    name: 'Infatigable',
    description: 'Maintenir une activité pendant 30 jours',
    unlockedAt: 0,
    rarity: 'rare'
  },
  {
    id: 'streak-100',
    name: 'Immortel',
    description: 'Maintenir une activité pendant 100 jours',
    unlockedAt: 0,
    rarity: 'legendary'
  },
  // Learning outcomes
  {
    id: 'lo-10-validated',
    name: 'Validateur',
    description: 'Valider 10 Learning Outcomes',
    unlockedAt: 0,
    rarity: 'uncommon'
  },
  {
    id: 'lo-50-validated',
    name: 'Architecte',
    description: 'Valider 50 Learning Outcomes',
    unlockedAt: 0,
    rarity: 'rare'
  },
  // Social achievements
  {
    id: 'mentions-10',
    name: 'Sociable',
    description: 'Être mentionné 10 fois',
    unlockedAt: 0,
    rarity: 'uncommon'
  },
  {
    id: 'reviews-perfect',
    name: 'Critique avisée',
    description: 'Effectuer 5 reviews avec commentaires',
    unlockedAt: 0,
    rarity: 'rare'
  },
  {
    id: 'collaborator',
    name: 'Collaborateur',
    description: 'Assigner des LOs à 5 utilisateurs différents',
    unlockedAt: 0,
    rarity: 'uncommon'
  }
]

export function useAchievements() {
  const unlockedAchievements = ref<Achievement[]>([])
  const newAchievements = ref<Achievement[]>([])
  const { success } = useToast()

  // Calculate user level based on points
  const calculateLevel = (points: number): { level: number; nextLevelPoints: number } => {
    const pointsPerLevel = 100
    const level = Math.floor(points / pointsPerLevel) + 1
    const nextLevelPoints = level * pointsPerLevel

    return {
      level: Math.min(level, 20), // Max level 20
      nextLevelPoints
    }
  }

  // Check and unlock achievements
  const checkAchievements = (stats: any): Achievement[] => {
    const newlyUnlocked: Achievement[] = []

    // Chat achievements
    if (stats.actionCounts?.messagesPosted === 1) {
      const ach = unlockAchievement('chat-first-message')
      if (ach) newlyUnlocked.push(ach)
    }

    if (stats.actionCounts?.messagesPosted === 100) {
      const ach = unlockAchievement('chat-100-messages')
      if (ach) newlyUnlocked.push(ach)
    }

    if (stats.actionCounts?.messagesEdited === 10) {
      const ach = unlockAchievement('chat-editor')
      if (ach) newlyUnlocked.push(ach)
    }

    // Level achievements
    const { level } = calculateLevel(stats.points)
    if (level === 5) {
      const ach = unlockAchievement('level-5')
      if (ach) newlyUnlocked.push(ach)
    }
    if (level === 10) {
      const ach = unlockAchievement('level-10')
      if (ach) newlyUnlocked.push(ach)
    }
    if (level === 20) {
      const ach = unlockAchievement('level-20')
      if (ach) newlyUnlocked.push(ach)
    }

    // Streak achievements
    if (stats.currentStreak === 7) {
      const ach = unlockAchievement('streak-7')
      if (ach) newlyUnlocked.push(ach)
    }
    if (stats.currentStreak === 30) {
      const ach = unlockAchievement('streak-30')
      if (ach) newlyUnlocked.push(ach)
    }
    if (stats.currentStreak === 100) {
      const ach = unlockAchievement('streak-100')
      if (ach) newlyUnlocked.push(ach)
    }

    // LO achievements
    if (stats.actionCounts?.validations === 10) {
      const ach = unlockAchievement('lo-10-validated')
      if (ach) newlyUnlocked.push(ach)
    }
    if (stats.actionCounts?.validations === 50) {
      const ach = unlockAchievement('lo-50-validated')
      if (ach) newlyUnlocked.push(ach)
    }

    // Social achievements
    if (stats.actionCounts?.reviews === 5) {
      const ach = unlockAchievement('reviews-perfect')
      if (ach) newlyUnlocked.push(ach)
    }

    return newlyUnlocked
  }

  const unlockAchievement = (achievementId: string): Achievement | null => {
    const existing = unlockedAchievements.value.find(a => a.id === achievementId)
    if (existing) return null

    const achievement = ACHIEVEMENTS_LIBRARY.find(a => a.id === achievementId)
    if (achievement) {
      const unlocked: Achievement = {
        ...achievement,
        unlockedAt: Date.now()
      }
      unlockedAchievements.value.push(unlocked)
      newAchievements.value.push(unlocked)

      // Notify
      const rarityEmoji: Record<string, string> = {
        common: '⚪',
        uncommon: '🟢',
        rare: '🔵',
        legendary: '🟡'
      }
      success(`${rarityEmoji[achievement.rarity]} Achievement unlocked: ${achievement.name}`)

      return unlocked
    }

    return null
  }

  const getAchievementProgress = (achievementId: string, stats: any): { current: number; target: number } => {
    switch (achievementId) {
      case 'chat-100-messages':
        return { current: stats.actionCounts?.messagesPosted || 0, target: 100 }
      case 'chat-editor':
        return { current: stats.actionCounts?.messagesEdited || 0, target: 10 }
      case 'level-5':
        return { current: calculateLevel(stats.points).level, target: 5 }
      case 'level-10':
        return { current: calculateLevel(stats.points).level, target: 10 }
      case 'level-20':
        return { current: calculateLevel(stats.points).level, target: 20 }
      case 'streak-7':
        return { current: stats.currentStreak, target: 7 }
      case 'streak-30':
        return { current: stats.currentStreak, target: 30 }
      case 'streak-100':
        return { current: stats.currentStreak, target: 100 }
      case 'lo-10-validated':
        return { current: stats.actionCounts?.validations || 0, target: 10 }
      case 'lo-50-validated':
        return { current: stats.actionCounts?.validations || 0, target: 50 }
      case 'reviews-perfect':
        return { current: stats.actionCounts?.reviews || 0, target: 5 }
      default:
        return { current: 0, target: 0 }
    }
  }

  const clearNewAchievements = () => {
    newAchievements.value = []
  }

  return {
    unlockedAchievements,
    newAchievements,
    calculateLevel,
    checkAchievements,
    unlockAchievement,
    getAchievementProgress,
    clearNewAchievements
  }
}
