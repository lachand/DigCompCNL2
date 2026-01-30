<template>
  <div class="game-achievements p-6 space-y-6">
    <!-- Back Button -->
    <div class="mb-6">
      <button
        @click="$emit('back-to-menu')"
        class="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <i class="ph ph-arrow-left"></i>
        <span>Retour au menu</span>
      </button>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Succès des Mini-Jeux
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          Débloquez des succès pour gagner des points et des récompenses
        </p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold">
          {{ totalPointsEarned }} points gagnés
        </div>
        <div class="text-sm text-gray-500">
          {{ unlockedAchievements.length }}/{{ achievements.length }} débloqués
        </div>
      </div>
    </div>

    <!-- Progress Overview -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div 
        v-for="(gameAchievements, gameKey) in achievementsByGame" 
        :key="gameKey"
        class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ getGameDisplayName(gameKey) }}
          </h3>
          <Icon :name="getGameIcon(gameKey)" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
          {{ gameAchievements.filter(a => a.unlocked).length }}/{{ gameAchievements.length }}
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(gameAchievements.filter(a => a.unlocked).length / gameAchievements.length) * 100}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
          activeTab === tab.id
            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        ]"
      >
        {{ tab.name }}
      </button>
    </div>

    <!-- Achievements Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="achievement in filteredAchievements" 
        :key="achievement.id"
        :class="[
          'relative border rounded-lg p-4 transition-all hover:shadow-md',
          achievement.unlocked 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
          getRarityClasses(achievement.rarity)
        ]"
      >
        <!-- Rarity Badge -->
        <div 
          :class="[
            'absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full',
            getRarityBadgeClasses(achievement.rarity)
          ]"
        >
          {{ getRarityLabel(achievement.rarity) }}
        </div>

        <!-- Achievement Content -->
        <div class="flex items-start space-x-3">
          <div 
            :class="[
              'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
              achievement.unlocked 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
            ]"
          >
            <Icon 
              :name="achievement.unlocked ? 'trophy' : 'lock-closed'" 
              class="w-6 h-6"
            />
          </div>
          
          <div class="flex-1 min-w-0">
            <h3 
              :class="[
                'font-semibold',
                achievement.unlocked 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-gray-900 dark:text-white'
              ]"
            >
              {{ achievement.name }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ achievement.description }}
            </p>
            
            <!-- Rewards -->
            <div class="flex items-center space-x-3 mt-2">
              <span class="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                +{{ achievement.rewards.points }} points
              </span>
              <span v-if="achievement.rewards.badge" class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                Badge
              </span>
              <span v-if="achievement.rewards.item" class="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                Objet
              </span>
            </div>
            
            <!-- Unlock Time -->
            <div v-if="achievement.unlocked && achievement.unlockedAt" class="text-xs text-gray-500 mt-1">
              Débloqué le {{ formatDate(achievement.unlockedAt) }}
            </div>
          </div>
        </div>

        <!-- Progress Bar (for locked achievements) -->
        <div v-if="!achievement.unlocked && getAchievementProgress(achievement) !== null" class="mt-3">
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progression</span>
            <span>{{ getAchievementProgress(achievement)?.current }}/{{ getAchievementProgress(achievement)?.target }}</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${Math.min((getAchievementProgress(achievement)?.current || 0) / (getAchievementProgress(achievement)?.target || 1) * 100, 100)}%` }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Summary -->
    <div v-if="userGameStats" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Statistiques Globales</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Parties jouées</span>
            <span class="font-medium">{{ userGameStats.global.totalGames }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Score total</span>
            <span class="font-medium">{{ userGameStats.global.totalScore }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Série actuelle</span>
            <span class="font-medium">{{ userGameStats.global.streak }} jours</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Meilleurs Scores</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Rapid Word</span>
            <span class="font-medium">{{ userGameStats.rapidWord.bestScore }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Dodge & Click</span>
            <span class="font-medium">{{ userGameStats.dodgeClick.bestScore }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Flash Math</span>
            <span class="font-medium">{{ userGameStats.flashMath.bestScore }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4">Temps de Jeu</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Parties RW</span>
            <span class="font-medium">{{ userGameStats.rapidWord.gamesPlayed }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Parties D&C</span>
            <span class="font-medium">{{ userGameStats.dodgeClick.gamesPlayed }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Parties FM</span>
            <span class="font-medium">{{ userGameStats.flashMath.gamesPlayed }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGameAchievements, type GameAchievement } from '@/composables/useGameAchievements'

// Define emits
defineEmits(['back-to-menu'])

const {
  achievements,
  userGameStats,
  unlockedAchievements,
  lockedAchievements,
  totalPointsEarned,
  achievementsByGame,
  init
} = useGameAchievements()

const activeTab = ref('all')

const tabs = [
  { id: 'all', name: 'Tous' },
  { id: 'unlocked', name: 'Débloqués' },
  { id: 'locked', name: 'Verrouillés' },
  { id: 'rapidWord', name: 'Rapid Word' },
  { id: 'dodgeClick', name: 'Dodge & Click' },
  { id: 'flashMath', name: 'Flash Math' },
  { id: 'global', name: 'Global' }
]

const filteredAchievements = computed(() => {
  switch (activeTab.value) {
    case 'unlocked':
      return unlockedAchievements.value
    case 'locked':
      return lockedAchievements.value
    case 'rapidWord':
    case 'dodgeClick':
    case 'flashMath':
    case 'global':
      return achievementsByGame.value[activeTab.value as keyof typeof achievementsByGame.value] || []
    default:
      return achievements.value
  }
})

const getGameDisplayName = (gameKey: string): string => {
  const names: Record<string, string> = {
    rapidWord: 'Rapid Word',
    dodgeClick: 'Dodge & Click',
    flashMath: 'Flash Math',
    global: 'Global'
  }
  return names[gameKey] || gameKey
}

const getGameIcon = (gameKey: string): string => {
  const icons: Record<string, string> = {
    rapidWord: 'keyboard',
    dodgeClick: 'cursor-arrow-rays',
    flashMath: 'calculator',
    global: 'globe-alt'
  }
  return icons[gameKey] || 'star'
}

const getRarityClasses = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return 'ring-2 ring-orange-400 dark:ring-orange-500'
    case 'epic': return 'ring-2 ring-purple-400 dark:ring-purple-500'
    case 'rare': return 'ring-2 ring-blue-400 dark:ring-blue-500'
    case 'uncommon': return 'ring-1 ring-green-400 dark:ring-green-500'
    default: return ''
  }
}

const getRarityBadgeClasses = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
    case 'epic': return 'bg-gradient-to-r from-purple-400 to-pink-500 text-white'
    case 'rare': return 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white'
    case 'uncommon': return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
    default: return 'bg-gray-400 text-white'
  }
}

const getRarityLabel = (rarity: string): string => {
  const labels: Record<string, string> = {
    legendary: 'LÉGENDAIRE',
    epic: 'ÉPIQUE',
    rare: 'RARE',
    uncommon: 'PEU COMMUN',
    common: 'COMMUN'
  }
  return labels[rarity] || 'COMMUN'
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getAchievementProgress = (achievement: GameAchievement): { current: number; target: number } | null => {
  if (!userGameStats.value || achievement.unlocked) return null
  
  const { condition } = achievement
  
  try {
    switch (achievement.game) {
      case 'rapidWord':
        const rwStats = userGameStats.value.rapidWord
        switch (condition.type) {
          case 'games_played':
            return { current: rwStats.gamesPlayed, target: condition.target }
          case 'score':
            return { current: rwStats.bestScore, target: condition.target }
        }
        break
        
      case 'dodgeClick':
        const dcStats = userGameStats.value.dodgeClick
        switch (condition.type) {
          case 'games_played':
            return { current: dcStats.gamesPlayed, target: condition.target }
          case 'score':
            return { current: dcStats.bestScore, target: condition.target }
          case 'accuracy':
            return { current: Math.round(dcStats.averageAccuracy * 100), target: Math.round(condition.target * 100) }
        }
        break
        
      case 'flashMath':
        const fmStats = userGameStats.value.flashMath
        switch (condition.type) {
          case 'games_played':
            return { current: fmStats.gamesPlayed, target: condition.target }
          case 'score':
            return { current: fmStats.bestScore, target: condition.target }
        }
        break
        
      case 'global':
        const globalStats = userGameStats.value.global
        switch (condition.type) {
          case 'games_played':
            return { current: globalStats.totalGames, target: condition.target }
          case 'score':
            return { current: globalStats.totalScore, target: condition.target }
          case 'streak':
            return { current: globalStats.longestStreak, target: condition.target }
        }
        break
    }
  } catch (error) {
    console.warn('Error getting achievement progress:', error)
  }
  
  return null
}

onMounted(() => {
  init()
})
</script>