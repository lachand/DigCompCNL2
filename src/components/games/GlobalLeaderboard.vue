<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full mb-4">
        <i class="ph ph-trophy text-3xl text-white"></i>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Classement Global</h1>
      <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Découvre tes meilleurs scores et compare-toi aux autres joueurs
      </p>
    </div>

    <!-- Game Selector -->
    <div class="theme-surface rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex flex-wrap gap-3 justify-center">
        <button
          v-for="game in availableGames"
          :key="game.key"
          @click="selectedGame = game.key"
          class="px-4 py-2 rounded-lg border transition-colors flex items-center gap-2"
          :class="selectedGame === game.key 
            ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-300'
            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'"
        >
          <i :class="game.icon"></i>
          <span>{{ game.name }}</span>
        </button>
      </div>
    </div>

    <!-- Personal Stats -->
    <div class="theme-surface rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <i class="ph ph-user text-indigo-500"></i>
        Tes statistiques - {{ currentGameInfo.name }}
      </h3>
      
      <div v-if="personalStats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ personalStats.gamesPlayed }}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">Parties jouées</p>
        </div>
        <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ personalStats.bestScore }}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">Meilleur score</p>
        </div>
        <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ personalStats.averageScore }}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">Score moyen</p>
        </div>
        <div class="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400"># {{ personalRank }}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">Rang global</p>
        </div>
      </div>
      
      <div v-else class="text-center py-6 text-gray-500 dark:text-gray-400">
        <i class="ph ph-game-controller text-3xl mb-2"></i>
        <p class="text-sm">Aucune partie jouée pour ce jeu</p>
      </div>
    </div>

    <!-- Global Leaderboard -->
    <div class="theme-surface rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <i class="ph ph-ranking text-yellow-500"></i>
        Classement {{ currentGameInfo.name }}
      </h3>
      
      <div v-if="globalLeaderboard.length > 0" class="space-y-3">
        <div
          v-for="(entry, index) in globalLeaderboard"
          :key="entry.playerId"
          class="flex items-center gap-4 p-4 rounded-lg transition"
          :class="[
            entry.isCurrentUser ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800' : 'bg-gray-50 dark:bg-gray-800',
            index < 3 ? 'ring-2 ring-yellow-400 ring-opacity-20' : ''
          ]"
        >
          <!-- Rank -->
          <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            :class="[
              index === 0 ? 'bg-yellow-500 text-white' :
              index === 1 ? 'bg-gray-400 text-white' :
              index === 2 ? 'bg-orange-600 text-white' :
              'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            ]"
          >
            <i v-if="index === 0" class="ph ph-crown"></i>
            <i v-else-if="index === 1" class="ph ph-medal"></i>
            <i v-else-if="index === 2" class="ph ph-medal"></i>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- Player Info -->
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ entry.playerName }}
              </span>
              <span v-if="entry.isCurrentUser" class="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded">
                Toi
              </span>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ entry.gamesPlayed }} parties • Moy. {{ entry.averageScore }}
            </div>
          </div>

          <!-- Score -->
          <div class="text-right">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ entry.bestScore }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-500">
              {{ formatDate(entry.lastPlayed) }}
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
        <i class="ph ph-trophy text-4xl mb-3"></i>
        <p class="text-sm">Aucun score enregistré pour ce jeu</p>
        <p class="text-xs mt-1">Sois le premier à jouer !</p>
      </div>
    </div>

    <!-- Achievement System Preview -->
    <div class="theme-surface rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <i class="ph ph-star text-purple-500"></i>
        Succès globaux (bientôt)
      </h3>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="achievement in upcomingAchievements" :key="achievement.id" 
          class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-60">
          <i :class="`ph ${achievement.icon} text-2xl text-gray-400 mb-2`"></i>
          <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ achievement.name }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">{{ achievement.description }}</div>
        </div>
      </div>
    </div>

    <!-- Back Button -->
    <div class="text-center">
      <button
        @click="$emit('back-to-menu')"
        class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
      >
        <i class="ph ph-arrow-left mr-2"></i>
        Retour au menu
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface GameInfo {
  key: string
  name: string
  icon: string
  storageKey: string
}

interface PlayerStats {
  gamesPlayed: number
  bestScore: number
  averageScore: number
  totalScore: number
}

interface LeaderboardEntry {
  playerId: string
  playerName: string
  bestScore: number
  averageScore: number
  gamesPlayed: number
  lastPlayed: number
  isCurrentUser: boolean
}

// Available games
const availableGames: GameInfo[] = [
  {
    key: 'rapidWord',
    name: 'Mot Rapide',
    icon: 'ph ph-keyboard',
    storageKey: 'rapidWordGameStats'
  },
  {
    key: 'dodgeClick',
    name: 'Dodge & Click',
    icon: 'ph ph-target',
    storageKey: 'dodgeClickGameStats'
  },
  {
    key: 'flashMath',
    name: 'Flash Math',
    icon: 'ph ph-calculator',
    storageKey: 'flashMathGameStats'
  }
]

// Upcoming achievements
const upcomingAchievements = [
  { id: 1, name: 'Première victoire', description: 'Gagner sa première partie', icon: 'ph-trophy' },
  { id: 2, name: 'Série gagnante', description: '10 parties consécutives', icon: 'ph-fire' },
  { id: 3, name: 'Maître du temps', description: 'Score parfait en moins de 5s', icon: 'ph-lightning' },
  { id: 4, name: 'Polyvalent', description: 'Jouer à tous les jeux', icon: 'ph-star' }
]

// State
const selectedGame = ref('rapidWord')
const globalLeaderboard = ref<LeaderboardEntry[]>([])

// Computed
const currentGameInfo = computed(() => 
  availableGames.find(game => game.key === selectedGame.value)!
)

const personalStats = computed(() => {
  const stats = localStorage.getItem(currentGameInfo.value.storageKey)
  return stats ? JSON.parse(stats) : null
})

const personalRank = computed(() => {
  if (!personalStats.value) return '-'
  const userEntry = globalLeaderboard.value.find(entry => entry.isCurrentUser)
  return userEntry ? globalLeaderboard.value.indexOf(userEntry) + 1 : '-'
})

// Methods
const loadGlobalLeaderboard = () => {
  // Simulate global leaderboard data (in real app, this would come from a server)
  const mockPlayers = [
    'Alice', 'Bob', 'Charlie', 'Diana', 'Eva', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'
  ]
  
  const currentUserId = 'current-user'
  const currentUserName = 'Toi'
  
  const entries: LeaderboardEntry[] = []
  
  // Add current user if they have stats
  if (personalStats.value) {
    entries.push({
      playerId: currentUserId,
      playerName: currentUserName,
      bestScore: personalStats.value.bestScore,
      averageScore: personalStats.value.averageScore,
      gamesPlayed: personalStats.value.gamesPlayed,
      lastPlayed: Date.now(),
      isCurrentUser: true
    })
  }
  
  // Add mock players with random scores based on game type
  mockPlayers.forEach((name, index) => {
    if (Math.random() > 0.3) { // 70% chance each player has played
      let bestScore: number
      let averageScore: number
      
      // Different score ranges based on game
      switch (selectedGame.value) {
        case 'rapidWord':
          bestScore = Math.floor(Math.random() * 80) + 20 // 20-100 points (based on speed)
          averageScore = Math.round(bestScore * (0.8 + Math.random() * 0.2))
          break
        case 'dodgeClick':
          bestScore = Math.floor(Math.random() * 200) + 10 // 10-210 points
          averageScore = Math.round(bestScore * (0.6 + Math.random() * 0.3))
          break
        case 'flashMath':
          bestScore = Math.floor(Math.random() * 300) + 20 // 20-320 points
          averageScore = Math.round(bestScore * (0.7 + Math.random() * 0.25))
          break
        default:
          bestScore = Math.floor(Math.random() * 100)
          averageScore = Math.round(bestScore * 0.8)
      }
      
      entries.push({
        playerId: `player-${index}`,
        playerName: name,
        bestScore,
        averageScore,
        gamesPlayed: Math.floor(Math.random() * 50) + 1,
        lastPlayed: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Last 30 days
        isCurrentUser: false
      })
    }
  })
  
  // Sort by best score (descending)
  entries.sort((a, b) => b.bestScore - a.bestScore)
  
  globalLeaderboard.value = entries.slice(0, 20) // Top 20
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Aujourd\'hui'
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// Watch for game changes
watch(selectedGame, loadGlobalLeaderboard)

// Load initial data
onMounted(() => {
  loadGlobalLeaderboard()
})

defineEmits(['back-to-menu'])
</script>