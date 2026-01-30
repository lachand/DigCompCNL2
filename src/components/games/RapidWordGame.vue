<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Game Header -->
    <div class="theme-surface rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <i class="ph ph-keyboard text-xl text-indigo-600 dark:text-indigo-400"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Jeu du mot le plus rapide</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">Tape une séquence de 10 mots le plus vite possible</p>
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
            <i class="ph ph-play-circle text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Prêt à tester ta vitesse de frappe ? Tape 10 mots consécutifs le plus vite possible !
            </p>
          </div>
          <button
            @click="startGame"
            class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
          >
            <i class="ph ph-play mr-2"></i>
            Commencer le jeu
          </button>
        </div>

        <div v-else-if="!finished" class="space-y-6">
          <!-- Current Word Display -->
          <div class="py-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Mot {{ currentWordIndex + 1 }}/10 :</p>
            <div class="text-4xl font-mono font-bold text-indigo-600 dark:text-indigo-400 mb-4">
              {{ currentWord }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-500">
              Caractères : {{ currentWord.length }}
            </div>
          </div>

          <!-- Input Field -->
          <div class="space-y-4">
            <input
              v-model="userInput"
              @input="checkInput"
              @keydown.enter="handleEnter"
              ref="gameInput"
              class="w-full px-4 py-3 text-lg font-mono text-center border-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              :class="[
                error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 theme-surface',
                userInput && !error ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''
              ]"
              :disabled="finished"
              placeholder="Commence à taper..."
              autocomplete="off"
              spellcheck="false"
            />
            
            <!-- Error Display -->
            <div v-if="error" class="flex items-center gap-2 text-red-600 dark:text-red-400">
              <i class="ph ph-warning-circle"></i>
              <span class="text-sm">{{ error }}</span>
            </div>

            <!-- Progress Indicator -->
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(userInput.length / currentWord.length) * 100}%` }"
              ></div>
            </div>
          </div>

          <!-- Timer -->
          <div class="text-lg font-mono text-gray-600 dark:text-gray-400">
            ⏱️ {{ elapsedTime }}s
          </div>
        </div>

        <div v-else class="space-y-6">
          <!-- Success Animation -->
          <div class="py-8">
            <div class="animate-bounce mb-4">
              <i class="ph ph-check-circle text-6xl text-green-500"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Excellent !</h3>
            <p class="text-gray-600 dark:text-gray-400">Tu as tapé le mot en</p>
          </div>

          <!-- Result Display -->
          <div class="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <div class="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
              {{ currentScore }} points
            </div>
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div>Temps total: <span class="font-bold">{{ timeTaken }}s</span></div>
              <div>Mots tapés: <span class="font-mono font-bold">10 mots</span></div>
              <div>Vitesse: <span class="font-bold">{{ wordsPerMinute }} mots/min</span></div>
              <div v-if="isNewRecord" class="text-green-600 dark:text-green-400 font-bold">
                🏆 Nouveau record personnel !
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 justify-center">
            <button
              @click="startGame"
              class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
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
        <p>• Utilise tous tes doigts pour une frappe plus rapide</p>
        <p>• Ne regarde pas le clavier, concentre-toi sur l'écran</p>
        <p>• Maintiens un rythme régulier sur les 10 mots</p>
        <p>• Score basé sur le temps total : plus rapide = plus de points</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useGameAchievements } from '@/composables/useGameAchievements'

const { updateGameStats: updateAchievementStats } = useGameAchievements()

// Mots liés aux compétences numériques et à l'éducation
const words = [
  'compétence', 'numérique', 'apprentissage', 'collaboration', 'créativité',
  'sécurité', 'communication', 'analyse', 'projet', 'innovation',
  'partage', 'mobilité', 'cloud', 'données', 'réseau', 'algorithme',
  'code', 'design', 'feedback', 'leaderboard', 'évaluation', 'formation',
  'digital', 'technologie', 'internet', 'application', 'plateforme',
  'interface', 'utilisateur', 'système', 'développement', 'programmation'
]

// Reactive state
const started = ref(false)
const finished = ref(false)
const currentWord = ref('')
const userInput = ref('')
const startTime = ref(0)
const endTime = ref(0)
const timeTaken = ref(0)
const completedWord = ref('')
const error = ref('')
const elapsedTime = ref(0)
const gameInput = ref<HTMLInputElement>()
const isNewRecord = ref(false)
const currentWordIndex = ref(0)
const wordsSequence = ref<string[]>([])
const wordTimes = ref<number[]>([])

// Game statistics
const gameStats = ref({
  gamesPlayed: 0,
  bestScore: 0,
  averageScore: 0,
  totalScore: 0
})

// Timer for elapsed time display
let elapsedTimer: number | null = null

// Computed properties
const wordsPerMinute = computed(() => {
  if (timeTaken.value > 0) {
    return Math.round((10 / (timeTaken.value / 60))) // 10 mots dans le temps total
  }
  return 0
})

const currentScore = computed(() => {
  // Score basé sur la vitesse: 100 - temps total en secondes
  return Math.max(0, Math.round(100 - timeTaken.value))
})

// Load stats from localStorage
onMounted(() => {
  const savedStats = localStorage.getItem('rapidWordGameStats')
  if (savedStats) {
    gameStats.value = JSON.parse(savedStats)
  }
})

// Save stats to localStorage
const saveStats = () => {
  localStorage.setItem('rapidWordGameStats', JSON.stringify(gameStats.value))
}

// Start game function
const startGame = () => {
  started.value = true
  finished.value = false
  userInput.value = ''
  error.value = ''
  elapsedTime.value = 0
  timeTaken.value = 0
  isNewRecord.value = false
  currentWordIndex.value = 0
  wordTimes.value = []
  
  // Generate sequence of 10 random words
  wordsSequence.value = []
  const shuffledWords = [...words].sort(() => Math.random() - 0.5)
  wordsSequence.value = shuffledWords.slice(0, 10)
  
  // Set first word
  currentWord.value = wordsSequence.value[0]
  completedWord.value = ''
  
  startTime.value = Date.now()
  
  // Start elapsed time timer
  elapsedTimer = setInterval(() => {
    elapsedTime.value = ((Date.now() - startTime.value) / 1000).toFixed(1)
  }, 100)
  
  // Focus input field
  nextTick(() => {
    gameInput.value?.focus()
  })
}

// Check input as user types
const checkInput = () => {
  const input = userInput.value.toLowerCase().trim()
  const target = currentWord.value.toLowerCase()
  
  if (input === target) {
    // Word completed successfully
    const wordTime = Date.now()
    wordTimes.value.push(wordTime)
    
    currentWordIndex.value++
    
    // Check if sequence completed
    if (currentWordIndex.value >= 10) {
      // All words completed
      endTime.value = Date.now()
      const timeInSeconds = (endTime.value - startTime.value) / 1000
      timeTaken.value = Number(timeInSeconds.toFixed(2))
      finished.value = true
      error.value = ''
      
      // Clear timer
      if (elapsedTimer) {
        clearInterval(elapsedTimer)
        elapsedTimer = null
      }
      
      // Update statistics
      updateGameStats(currentScore.value)
    } else {
      // Move to next word
      currentWord.value = wordsSequence.value[currentWordIndex.value]
      userInput.value = ''
      error.value = ''
      
      // Focus input again
      nextTick(() => {
        gameInput.value?.focus()
      })
    }
  } else if (!target.startsWith(input)) {
    // User made a mistake
    error.value = 'Erreur de frappe ! Vérifie ta saisie.'
  } else {
    // Correct so far, clear error
    error.value = ''
  }
}

// Handle Enter key press
const handleEnter = () => {
  // Logic is handled in checkInput already
  checkInput()
}

// Update game statistics
const updateGameStats = (finalScore: number) => {
  gameStats.value.gamesPlayed++
  gameStats.value.totalScore += finalScore
  
  // Check for new best score
  if (finalScore > gameStats.value.bestScore) {
    gameStats.value.bestScore = finalScore
    isNewRecord.value = true
  }
  
  // Calculate average score
  gameStats.value.averageScore = Number(
    (gameStats.value.totalScore / gameStats.value.gamesPlayed).toFixed(2)
  )
  
  // Save to localStorage
  saveStats()
  
  // Update achievements and earn points
  const achievementStats = {
    gamesPlayed: gameStats.value.gamesPlayed,
    totalScore: gameStats.value.totalScore,
    bestScore: gameStats.value.bestScore,
    averageTime: timeTaken.value
  }
  
  const newAchievements = updateAchievementStats('rapidWord', achievementStats)
  
  // Log achievements for debugging
  if (newAchievements.length > 0) {
    console.log('🏆 Nouveaux achievements débloqués:', newAchievements)
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (elapsedTimer) {
    clearInterval(elapsedTimer)
  }
})

// Emit events
defineEmits(['back-to-menu'])
</script>
