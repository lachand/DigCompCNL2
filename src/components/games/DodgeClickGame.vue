<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Game Header -->
    <div class="theme-surface rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <i class="ph ph-target text-xl text-green-600 dark:text-green-400"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Dodge & Click</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">Clique sur les cibles vertes, évite les rouges !</p>
        </div>
      </div>

      <!-- Game Stats -->
      <div v-if="gameStats.gamesPlayed > 0" class="grid grid-cols-3 gap-4 mb-6">
        <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ gameStats.gamesPlayed }}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">Parties</p>
        </div>
        <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ gameStats.bestScore }}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">Meilleur score</p>
        </div>
        <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ gameStats.averageScore }}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">Score moyen</p>
        </div>
      </div>

      <!-- Game Area -->
      <div class="text-center">
        <div v-if="!started" class="space-y-4">
          <div class="py-8">
            <i class="ph ph-crosshair text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Prêt à tester tes réflexes ? Clique sur les cibles vertes et évite les rouges !
            </p>
            <div class="text-sm text-gray-500 dark:text-gray-500 space-y-1">
              <p>🎯 Cible verte : jusqu'à 10 points (selon rapidité)</p>
              <p>💥 Cible rouge : -5 points (fin de partie si tu cliques)</p>
              <p>⏱️ 30 secondes pour faire le meilleur score</p>
            </div>
          </div>
          <button
            @click="startGame"
            class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            <i class="ph ph-play mr-2"></i>
            Commencer le jeu
          </button>
        </div>

        <div v-else-if="!finished" class="space-y-4">
          <!-- Game UI -->
          <div class="flex justify-between items-center mb-4">
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              Score: <span class="text-green-600 dark:text-green-400">{{ score }}</span>
            </div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              Temps: <span class="text-blue-600 dark:text-blue-400">{{ timeLeft }}s</span>
            </div>
          </div>

          <!-- Game Arena -->
          <div 
            ref="gameArena"
            class="relative w-full h-96 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden cursor-crosshair"
            @click="handleMissClick"
          >
            <!-- Moving targets -->
            <div
              v-for="target in targets"
              :key="target.id"
              class="absolute w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg cursor-pointer transition-transform hover:scale-110"
              :class="target.type === 'good' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'"
              :style="{ left: target.x + 'px', top: target.y + 'px' }"
              @click.stop="clickTarget(target)"
            >
              <i v-if="target.type === 'good'" class="ph ph-check"></i>
              <i v-else class="ph ph-x"></i>
            </div>

            <!-- Click effects -->
            <div
              v-for="effect in clickEffects"
              :key="effect.id"
              class="absolute pointer-events-none text-2xl font-bold animate-ping"
              :class="effect.type === 'good' ? 'text-green-500' : 'text-red-500'"
              :style="{ left: effect.x + 'px', top: effect.y + 'px' }"
            >
              {{ effect.text }}
            </div>
          </div>
        </div>

        <div v-else class="space-y-6">
          <!-- Result Display -->
          <div class="py-8">
            <div class="animate-bounce mb-4">
              <i :class="score > 50 ? 'ph ph-trophy text-6xl text-yellow-500' : 'ph ph-medal text-6xl text-gray-500'"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {{ score > 50 ? 'Excellent !' : score > 20 ? 'Bien joué !' : 'Continue à t\'entraîner !' }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">Tu as marqué</p>
          </div>

          <div class="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div class="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
              {{ score }} points
            </div>
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div>Cibles réussies: <span class="font-bold text-green-600">{{ goodClicks }}</span></div>
              <div>Cibles ratées: <span class="font-bold text-red-600">{{ missedClicks }}</span></div>
              <div>Précision: <span class="font-bold">{{ accuracy }}%</span></div>
              <div v-if="isNewRecord" class="text-green-600 dark:text-green-400 font-bold">
                🏆 Nouveau record personnel !
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 justify-center">
            <button
              @click="startGame"
              class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              <i class="ph ph-arrow-clockwise mr-2"></i>
              Rejouer
            </button>
            <button
              @click="$emit('back-to-menu')"
              class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
            >
              <i class="ph ph-house mr-2"></i>
              Menu
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tips -->
    <div class="theme-surface rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
        <i class="ph ph-lightbulb text-yellow-500"></i>
        Conseils
      </h4>
      <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
        <p>• Les cibles bougent de plus en plus vite</p>
        <p>• Un clic sur une cible rouge termine immédiatement la partie</p>
        <p>• Plus tu cliques vite sur une cible, plus tu gagnes de points !</p>
        <p>• Score max: 10 pts par cible, -1 pt par seconde écoulée</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameAchievements } from '@/composables/useGameAchievements'

const { updateGameStats: updateAchievementStats } = useGameAchievements()

interface Target {
  id: number
  x: number
  y: number
  type: 'good' | 'bad'
  speedX: number
  speedY: number
  spawnTime: number // Track when target was created
}

interface ClickEffect {
  id: number
  x: number
  y: number
  type: 'good' | 'bad'
  text: string
}

// Game state
const started = ref(false)
const finished = ref(false)
const score = ref(0)
const timeLeft = ref(30)
const targets = ref<Target[]>([])
const clickEffects = ref<ClickEffect[]>([])
const goodClicks = ref(0)
const missedClicks = ref(0)
const isNewRecord = ref(false)
const gameArena = ref<HTMLElement>()

// Game stats
const gameStats = ref({
  gamesPlayed: 0,
  bestScore: 0,
  averageScore: 0,
  totalScore: 0
})

// Game timers
let gameTimer: number | null = null
let spawnTimer: number | null = null
let moveTimer: number | null = null
let effectCleanupTimer: number | null = null

// Computed
const accuracy = computed(() => {
  const total = goodClicks.value + missedClicks.value
  return total > 0 ? Math.round((goodClicks.value / total) * 100) : 0
})

// Load stats
onMounted(() => {
  const savedStats = localStorage.getItem('dodgeClickGameStats')
  if (savedStats) {
    gameStats.value = JSON.parse(savedStats)
  }
})

// Save stats
const saveStats = () => {
  localStorage.setItem('dodgeClickGameStats', JSON.stringify(gameStats.value))
}

// Start game
const startGame = () => {
  started.value = true
  finished.value = false
  score.value = 0
  timeLeft.value = 30
  targets.value = []
  clickEffects.value = []
  goodClicks.value = 0
  missedClicks.value = 0
  isNewRecord.value = false

  // Start game timer
  gameTimer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      endGame()
    }
  }, 1000)

  // Start spawning targets
  spawnTimer = setInterval(spawnTarget, 1500)
  
  // Start moving targets
  moveTimer = setInterval(moveTargets, 50)
  
  // Clean up effects periodically
  effectCleanupTimer = setInterval(cleanupEffects, 1000)
}

// Spawn a new target
const spawnTarget = () => {
  if (!gameArena.value) return
  
  const arenaRect = gameArena.value.getBoundingClientRect()
  const target: Target = {
    id: Date.now() + Math.random(),
    x: Math.random() * (arenaRect.width - 50),
    y: Math.random() * (arenaRect.height - 50),
    type: Math.random() > 0.3 ? 'good' : 'bad', // 70% good, 30% bad
    speedX: (Math.random() - 0.5) * 4,
    speedY: (Math.random() - 0.5) * 4,
    spawnTime: Date.now() // Track when target was created
  }
  
  targets.value.push(target)
  
  // Remove target after some time if not clicked
  setTimeout(() => {
    const index = targets.value.findIndex(t => t.id === target.id)
    if (index > -1) {
      if (target.type === 'good') {
        missedClicks.value++
      }
      targets.value.splice(index, 1)
    }
  }, 3000)
}

// Move targets
const moveTargets = () => {
  if (!gameArena.value) return
  
  const arenaRect = gameArena.value.getBoundingClientRect()
  
  targets.value.forEach(target => {
    target.x += target.speedX
    target.y += target.speedY
    
    // Bounce off walls
    if (target.x <= 0 || target.x >= arenaRect.width - 50) {
      target.speedX *= -1
    }
    if (target.y <= 0 || target.y >= arenaRect.height - 50) {
      target.speedY *= -1
    }
    
    // Keep in bounds
    target.x = Math.max(0, Math.min(target.x, arenaRect.width - 50))
    target.y = Math.max(0, Math.min(target.y, arenaRect.height - 50))
  })
}

// Handle target click
const clickTarget = (target: Target) => {
  const targetIndex = targets.value.findIndex(t => t.id === target.id)
  if (targetIndex === -1) return
  
  if (target.type === 'good') {
    // Calculate time-based score: max 10 points, -1 per second since spawn
    const timeSinceSpawn = Date.now() - target.spawnTime
    const secondsElapsed = Math.floor(timeSinceSpawn / 1000)
    const timeBasedScore = Math.max(1, 10 - secondsElapsed) // Minimum 1 point
    
    score.value += timeBasedScore
    goodClicks.value++
    addClickEffect(target.x, target.y, 'good', `+${timeBasedScore}`)
  } else {
    // Bad target clicked - end game immediately
    addClickEffect(target.x, target.y, 'bad', 'GAME OVER')
    setTimeout(() => endGame(), 500)
    return
  }
  
  targets.value.splice(targetIndex, 1)
}

// Handle miss click (clicking empty area)
const handleMissClick = () => {
  // No penalty for miss clicks, just visual feedback
}

// Add click effect
const addClickEffect = (x: number, y: number, type: 'good' | 'bad', text: string) => {
  const effect: ClickEffect = {
    id: Date.now() + Math.random(),
    x,
    y,
    type,
    text
  }
  
  clickEffects.value.push(effect)
  
  // Remove effect after animation
  setTimeout(() => {
    const index = clickEffects.value.findIndex(e => e.id === effect.id)
    if (index > -1) {
      clickEffects.value.splice(index, 1)
    }
  }, 1000)
}

// Clean up old effects
const cleanupEffects = () => {
  clickEffects.value = clickEffects.value.filter(effect => 
    Date.now() - effect.id < 1000
  )
}

// End game
const endGame = () => {
  finished.value = true
  started.value = false
  
  // Clear timers
  if (gameTimer) clearInterval(gameTimer)
  if (spawnTimer) clearInterval(spawnTimer)
  if (moveTimer) clearInterval(moveTimer)
  if (effectCleanupTimer) clearInterval(effectCleanupTimer)
  
  // Update stats
  updateGameStats(score.value)
}

// Update game statistics
const updateGameStats = (finalScore: number) => {
  gameStats.value.gamesPlayed++
  gameStats.value.totalScore += finalScore
  
  if (finalScore > gameStats.value.bestScore) {
    gameStats.value.bestScore = finalScore
    isNewRecord.value = true
  }
  
  gameStats.value.averageScore = Math.round(
    gameStats.value.totalScore / gameStats.value.gamesPlayed
  )
  
  saveStats()
  
  // Update achievements and earn points
  const totalClicks = goodClicks.value + missedClicks.value
  const accuracyRate = totalClicks > 0 ? goodClicks.value / totalClicks : 0
  
  const achievementStats = {
    gamesPlayed: gameStats.value.gamesPlayed,
    totalScore: gameStats.value.totalScore,
    bestScore: gameStats.value.bestScore,
    averageAccuracy: accuracyRate
  }
  
  const newAchievements = updateAchievementStats('dodgeClick', achievementStats)
  
  // Log achievements for debugging
  if (newAchievements.length > 0) {
    console.log('🏆 Nouveaux achievements débloqués:', newAchievements)
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (gameTimer) clearInterval(gameTimer)
  if (spawnTimer) clearInterval(spawnTimer)
  if (moveTimer) clearInterval(moveTimer)
  if (effectCleanupTimer) clearInterval(effectCleanupTimer)
})

defineEmits(['back-to-menu'])
</script>
