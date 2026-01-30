// Composable pour les achievements des mini-jeux
import { ref, computed } from 'vue'
import { useToast } from './useToast'
import { useExtendedGamificationStore } from '@/stores/extendedGamification'

export interface GameAchievement {
  id: string
  name: string
  description: string
  game: 'rapidWord' | 'dodgeClick' | 'flashMath' | 'global'
  condition: {
    type: 'score' | 'games_played' | 'accuracy' | 'time' | 'streak'
    target: number
    comparison?: '>=' | '<=' | '==='
  }
  rewards: {
    points: number
    badge?: string
    item?: string
  }
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  unlocked: boolean
  unlockedAt?: number
}

// Définitions des achievements des mini-jeux
export const GAME_ACHIEVEMENTS: GameAchievement[] = [
  // Rapid Word Game
  {
    id: 'rapidword-first-game',
    name: 'Premier Typeur',
    description: 'Jouer votre première partie de Rapid Word',
    game: 'rapidWord',
    condition: { type: 'games_played', target: 1 },
    rewards: { points: 10 },
    rarity: 'common',
    unlocked: false
  },
  {
    id: 'rapidword-speedster',
    name: 'Dactylo Express',
    description: 'Obtenir un score de 80+ en Rapid Word',
    game: 'rapidWord',
    condition: { type: 'score', target: 80 },
    rewards: { points: 25, badge: 'speedster' },
    rarity: 'uncommon',
    unlocked: false
  },
  {
    id: 'rapidword-marathon',
    name: 'Marathon Typographique',
    description: 'Jouer 50 parties de Rapid Word',
    game: 'rapidWord',
    condition: { type: 'games_played', target: 50 },
    rewards: { points: 100, item: 'typing-badge' },
    rarity: 'rare',
    unlocked: false
  },
  {
    id: 'rapidword-perfectionist',
    name: 'Perfectionniste',
    description: 'Obtenir un score parfait de 100 en Rapid Word',
    game: 'rapidWord',
    condition: { type: 'score', target: 100 },
    rewards: { points: 50, badge: 'perfect-typer' },
    rarity: 'epic',
    unlocked: false
  },

  // Dodge & Click Game
  {
    id: 'dodgeclick-beginner',
    name: 'Chasseur de Cibles',
    description: 'Jouer votre première partie de Dodge & Click',
    game: 'dodgeClick',
    condition: { type: 'games_played', target: 1 },
    rewards: { points: 10 },
    rarity: 'common',
    unlocked: false
  },
  {
    id: 'dodgeclick-sharpshooter',
    name: 'Tireur d\'Élite',
    description: 'Atteindre 80% de précision en Dodge & Click',
    game: 'dodgeClick',
    condition: { type: 'accuracy', target: 0.8 },
    rewards: { points: 30, badge: 'sharpshooter' },
    rarity: 'uncommon',
    unlocked: false
  },
  {
    id: 'dodgeclick-sniper',
    name: 'Sniper',
    description: 'Obtenir un score de 60+ en Dodge & Click',
    game: 'dodgeClick',
    condition: { type: 'score', target: 60 },
    rewards: { points: 40 },
    rarity: 'rare',
    unlocked: false
  },
  {
    id: 'dodgeclick-legend',
    name: 'Légende du Click',
    description: 'Atteindre 95% de précision en Dodge & Click',
    game: 'dodgeClick',
    condition: { type: 'accuracy', target: 0.95 },
    rewards: { points: 75, badge: 'click-legend' },
    rarity: 'epic',
    unlocked: false
  },

  // Flash Math Game
  {
    id: 'flashmath-calculator',
    name: 'Calculatrice Humaine',
    description: 'Jouer votre première partie de Flash Math',
    game: 'flashMath',
    condition: { type: 'games_played', target: 1 },
    rewards: { points: 10 },
    rarity: 'common',
    unlocked: false
  },
  {
    id: 'flashmath-quick',
    name: 'Éclair Mental',
    description: 'Résoudre un problème en moins de 3 secondes',
    game: 'flashMath',
    condition: { type: 'time', target: 3, comparison: '<=' },
    rewards: { points: 20 },
    rarity: 'uncommon',
    unlocked: false
  },
  {
    id: 'flashmath-genius',
    name: 'Génie Mathématique',
    description: 'Obtenir un score de 85+ en Flash Math',
    game: 'flashMath',
    condition: { type: 'score', target: 85 },
    rewards: { points: 35, badge: 'math-genius' },
    rarity: 'rare',
    unlocked: false
  },
  {
    id: 'flashmath-einstein',
    name: 'Einstein Jr.',
    description: 'Obtenir un score parfait de 100 en Flash Math',
    game: 'flashMath',
    condition: { type: 'score', target: 100 },
    rewards: { points: 80, badge: 'einstein' },
    rarity: 'legendary',
    unlocked: false
  },

  // Achievements globaux
  {
    id: 'games-explorer',
    name: 'Explorateur de Jeux',
    description: 'Jouer à tous les mini-jeux au moins une fois',
    game: 'global',
    condition: { type: 'games_played', target: 3 }, // 3 jeux différents
    rewards: { points: 25, badge: 'game-explorer' },
    rarity: 'uncommon',
    unlocked: false
  },
  {
    id: 'games-addict',
    name: 'Accro aux Jeux',
    description: 'Jouer 100 parties au total',
    game: 'global',
    condition: { type: 'games_played', target: 100 },
    rewards: { points: 150, item: 'golden-controller' },
    rarity: 'epic',
    unlocked: false
  },
  {
    id: 'high-scorer',
    name: 'Maître du Score',
    description: 'Obtenir un score total de 2000+ points',
    game: 'global',
    condition: { type: 'score', target: 2000 },
    rewards: { points: 200, badge: 'high-scorer' },
    rarity: 'epic',
    unlocked: false
  },
  {
    id: 'triple-crown',
    name: 'Triple Couronne',
    description: 'Obtenir le meilleur score dans les 3 jeux',
    game: 'global',
    condition: { type: 'score', target: 240 }, // 80 + 80 + 80
    rewards: { points: 300, badge: 'triple-crown', item: 'champion-trophy' },
    rarity: 'legendary',
    unlocked: false
  },
  {
    id: 'consistency-king',
    name: 'Roi de la Régularité',
    description: 'Jouer pendant 7 jours consécutifs',
    game: 'global',
    condition: { type: 'streak', target: 7 },
    rewards: { points: 100, badge: 'consistent-player' },
    rarity: 'rare',
    unlocked: false
  }
]

export function useGameAchievements() {
  const { success } = useToast()
  const gamificationStore = useExtendedGamificationStore()
  
  const achievements = ref<GameAchievement[]>([...GAME_ACHIEVEMENTS])
  const userGameStats = ref<any>(null)

  // Charger les stats des jeux depuis localStorage
  const loadGameStats = () => {
    const saved = localStorage.getItem('game_statistics')
    if (saved) {
      userGameStats.value = JSON.parse(saved)
    } else {
      userGameStats.value = {
        rapidWord: { gamesPlayed: 0, totalScore: 0, bestScore: 0, averageTime: 0 },
        dodgeClick: { gamesPlayed: 0, totalScore: 0, bestScore: 0, averageAccuracy: 0 },
        flashMath: { gamesPlayed: 0, totalScore: 0, bestScore: 0, averageTime: 0 },
        global: { totalGames: 0, totalScore: 0, streak: 0, longestStreak: 0 }
      }
    }
  }

  // Sauvegarder les achievements
  const saveAchievements = () => {
    localStorage.setItem('game_achievements', JSON.stringify(achievements.value))
  }

  // Charger les achievements
  const loadAchievements = () => {
    const saved = localStorage.getItem('game_achievements')
    if (saved) {
      const savedAchievements = JSON.parse(saved)
      achievements.value = achievements.value.map(achievement => {
        const saved = savedAchievements.find((s: any) => s.id === achievement.id)
        return saved ? { ...achievement, ...saved } : achievement
      })
    }
  }

  // Vérifier les conditions d'achievement
  const checkAchievementCondition = (achievement: GameAchievement, stats: any): boolean => {
    const { condition } = achievement
    
    switch (achievement.game) {
      case 'rapidWord':
        const rwStats = stats.rapidWord
        switch (condition.type) {
          case 'games_played':
            return rwStats.gamesPlayed >= condition.target
          case 'score':
            return rwStats.bestScore >= condition.target
          default:
            return false
        }
        
      case 'dodgeClick':
        const dcStats = stats.dodgeClick
        switch (condition.type) {
          case 'games_played':
            return dcStats.gamesPlayed >= condition.target
          case 'score':
            return dcStats.bestScore >= condition.target
          case 'accuracy':
            return dcStats.averageAccuracy >= condition.target
          default:
            return false
        }
        
      case 'flashMath':
        const fmStats = stats.flashMath
        switch (condition.type) {
          case 'games_played':
            return fmStats.gamesPlayed >= condition.target
          case 'score':
            return fmStats.bestScore >= condition.target
          case 'time':
            return condition.comparison === '<=' 
              ? fmStats.averageTime <= condition.target
              : fmStats.averageTime >= condition.target
          default:
            return false
        }
        
      case 'global':
        const globalStats = stats.global
        switch (condition.type) {
          case 'games_played':
            // Pour "Explorateur de Jeux", vérifier qu'on a joué à tous les jeux
            if (achievement.id === 'games-explorer') {
              return stats.rapidWord.gamesPlayed > 0 && 
                     stats.dodgeClick.gamesPlayed > 0 && 
                     stats.flashMath.gamesPlayed > 0
            }
            return globalStats.totalGames >= condition.target
          case 'score':
            // Pour "Triple Couronne", vérifier les meilleurs scores
            if (achievement.id === 'triple-crown') {
              return (stats.rapidWord.bestScore + 
                     stats.dodgeClick.bestScore + 
                     stats.flashMath.bestScore) >= condition.target
            }
            return globalStats.totalScore >= condition.target
          case 'streak':
            return globalStats.longestStreak >= condition.target
          default:
            return false
        }
        
      default:
        return false
    }
  }

  // Vérifier et débloquer les achievements
  const checkAndUnlockAchievements = () => {
    if (!userGameStats.value) return []
    
    const newlyUnlocked: GameAchievement[] = []
    
    achievements.value.forEach(achievement => {
      if (!achievement.unlocked && checkAchievementCondition(achievement, userGameStats.value)) {
        achievement.unlocked = true
        achievement.unlockedAt = Date.now()
        newlyUnlocked.push(achievement)
      }
    })
    
    if (newlyUnlocked.length > 0) {
      saveAchievements()
      
      // Ajouter les points à la boutique
      newlyUnlocked.forEach(achievement => {
        gamificationStore.addPoints(achievement.rewards.points)
        
        // Notification toast
        success(`🏆 Achievement débloqué: ${achievement.name} (+${achievement.rewards.points} points)`)
      })
    }
    
    return newlyUnlocked
  }

  // Mettre à jour les stats et vérifier les achievements
  const updateGameStats = (game: 'rapidWord' | 'dodgeClick' | 'flashMath', newStats: any) => {
    if (!userGameStats.value) loadGameStats()
    
    // Mettre à jour les stats du jeu spécifique
    userGameStats.value[game] = { ...userGameStats.value[game], ...newStats }
    
    // Mettre à jour les stats globales
    const global = userGameStats.value.global
    global.totalGames = (userGameStats.value.rapidWord.gamesPlayed || 0) + 
                       (userGameStats.value.dodgeClick.gamesPlayed || 0) + 
                       (userGameStats.value.flashMath.gamesPlayed || 0)
    
    global.totalScore = (userGameStats.value.rapidWord.totalScore || 0) + 
                       (userGameStats.value.dodgeClick.totalScore || 0) + 
                       (userGameStats.value.flashMath.totalScore || 0)
    
    // Sauvegarder
    localStorage.setItem('game_statistics', JSON.stringify(userGameStats.value))
    
    // Vérifier les achievements
    const newAchievements = checkAndUnlockAchievements()
    
    return newAchievements
  }

  // Computed values
  const unlockedAchievements = computed(() => 
    achievements.value.filter(a => a.unlocked)
  )
  
  const lockedAchievements = computed(() => 
    achievements.value.filter(a => !a.unlocked)
  )
  
  const totalPointsEarned = computed(() => 
    unlockedAchievements.value.reduce((sum, a) => sum + a.rewards.points, 0)
  )
  
  const achievementsByGame = computed(() => {
    return {
      rapidWord: achievements.value.filter(a => a.game === 'rapidWord'),
      dodgeClick: achievements.value.filter(a => a.game === 'dodgeClick'),
      flashMath: achievements.value.filter(a => a.game === 'flashMath'),
      global: achievements.value.filter(a => a.game === 'global')
    }
  })

  // Initialiser
  const init = () => {
    loadGameStats()
    loadAchievements()
  }

  return {
    // State
    achievements,
    userGameStats,
    
    // Computed
    unlockedAchievements,
    lockedAchievements,
    totalPointsEarned,
    achievementsByGame,
    
    // Methods
    updateGameStats,
    checkAndUnlockAchievements,
    init
  }
}