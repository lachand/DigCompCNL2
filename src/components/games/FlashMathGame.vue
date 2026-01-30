<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Game Header -->
    <div class="theme-surface rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <i class="ph ph-calculator text-xl text-purple-600 dark:text-purple-400"></i>
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Flash Math</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">Résous des calculs simples le plus rapidement possible</p>
        </div>
      </div>

      <!-- Game Stats -->
      <div v-if="gameStats.gamesPlayed > 0" class="grid grid-cols-3 gap-4 mb-6">
        <div class="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ gameStats.gamesPlayed }}</p>
          <p class="text-xs text-gray-600 dark:text-gray-400">Parties</p>
        </div>
        <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ gameStats.bestScore }}</p>
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
            <i class="ph ph-brain text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Prêt à faire chauffer tes neurones ? Résous un maximum de calculs en 60 secondes !
            </p>
            <div class="text-sm text-gray-500 dark:text-gray-500 space-y-1">
              <p>➕ Additions et soustractions simples</p>
              <p>✖️ Multiplications et divisions</p>
              <p>⏱️ 1 minute pour faire le meilleur score</p>
              <p>🎯 Bonne réponse : jusqu'à 10 points (selon rapidité)</p>
            </div>
          </div>
          
          <!-- Difficulty Selection -->
          <div class="mb-6">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Choisis ta difficulté :</p>
            <div class="flex gap-3 justify-center">
              <button
                v-for="level in difficultyLevels"
                :key="level.key"
                @click="selectedDifficulty = level.key"
                class="px-4 py-2 rounded-lg border transition-colors"
                :class="selectedDifficulty === level.key 
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'"
              >
                <div class="text-sm font-medium">{{ level.name }}</div>
                <div class="text-xs text-gray-500">{{ level.description }}</div>
              </button>
            </div>
          </div>
          
          <button
            @click="startGame"
            class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            <i class="ph ph-play mr-2"></i>
            Commencer le jeu
          </button>
        </div>

        <div v-else-if="!finished" class="space-y-6">
          <!-- Game UI -->
          <div class="flex justify-between items-center">
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              Score: <span class="text-purple-600 dark:text-purple-400">{{ score }}</span>
            </div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              Temps: <span class="text-blue-600 dark:text-blue-400">{{ timeLeft }}s</span>
            </div>
          </div>

          <!-- Current Problem -->
          <div class="py-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
            <div class="text-4xl font-mono font-bold text-purple-600 dark:text-purple-400 mb-6">
              {{ currentProblem.question }}
            </div>
            
            <!-- Answer Input -->
            <div class="space-y-4">
              <input
                v-model="userAnswer"
                @keydown.enter="submitAnswer"
                @input="checkAnswer"
                ref="answerInput"
                type="number"
                class="w-32 px-4 py-3 text-xl font-mono text-center border-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                :class="[
                  answerFeedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                  answerFeedback === 'wrong' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  'border-gray-300 dark:border-gray-600 theme-surface'
                ]"
                placeholder="?"
                autocomplete="off"
              />
              
              <!-- Feedback -->
              <div v-if="answerFeedback" class="text-lg font-bold">
                <span v-if="answerFeedback === 'correct'" class="text-green-600 dark:text-green-400">✓ Correct !</span>
                <span v-else class="text-red-600 dark:text-red-400">✗ {{ currentProblem.answer }}</span>
              </div>
              
              <button
                @click="submitAnswer"
                class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                :disabled="!userAnswer"
              >
                Valider
              </button>
            </div>
          </div>

          <!-- Progress -->
          <div class="space-y-2">
            <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Problème {{ currentProblemIndex + 1 }}</span>
              <span>{{ correctAnswers }}/{{ totalAnswers }} corrects</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                class="bg-purple-600 h-2 rounded-full transition-all duration-300"
                :style="{ width: `${(correctAnswers / Math.max(totalAnswers, 1)) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-6">
          <!-- Result Display -->
          <div class="py-8">
            <div class="animate-bounce mb-4">
              <i :class="score > 100 ? 'ph ph-trophy text-6xl text-yellow-500' : 'ph ph-medal text-6xl text-gray-500'"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {{ score > 100 ? 'Génie des maths !' : score > 50 ? 'Bien joué !' : 'Continue à t\'entraîner !' }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">Tu as marqué</p>
          </div>

          <div class="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <div class="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {{ score }} points
            </div>
            <div class="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div>Problèmes résolus: <span class="font-bold text-green-600">{{ correctAnswers }}</span></div>
              <div>Erreurs: <span class="font-bold text-red-600">{{ totalAnswers - correctAnswers }}</span></div>
              <div>Précision: <span class="font-bold">{{ accuracy }}%</span></div>
              <div>Vitesse: <span class="font-bold">{{ problemsPerMinute }} prob/min</span></div>
              <div v-if="isNewRecord" class="text-purple-600 dark:text-purple-400 font-bold">
                🏆 Nouveau record personnel !
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 justify-center">
            <button
              @click="startGame"
              class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
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
        <p>• Utilise le pavé numérique pour plus de rapidité</p>
        <p>• Appuie sur Entrée pour valider rapidement</p>
        <p>• Plus tu réponds vite, plus tu gagnes de points !</p>
        <p>• Score max: 10 pts, -1 pt par seconde écoulée</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useGameAchievements } from '@/composables/useGameAchievements'

const { updateGameStats: updateAchievementStats } = useGameAchievements()

interface MathProblem {
  question: string
  answer: number
  operation: string
}

interface DifficultyLevel {
  key: string
  name: string
  description: string
  range: [number, number]
  operations: string[]
}

// Game state
const started = ref(false)
const finished = ref(false)
const score = ref(0)
const timeLeft = ref(60)
const currentProblem = ref<MathProblem>({ question: '', answer: 0, operation: '' })
const userAnswer = ref('')
const answerFeedback = ref<'correct' | 'wrong' | null>(null)
const correctAnswers = ref(0)
const totalAnswers = ref(0)
const currentProblemIndex = ref(0)
const isNewRecord = ref(false)
const answerInput = ref<HTMLInputElement>()
const selectedDifficulty = ref('easy')
const problemStartTime = ref(0)

// Difficulty levels
const difficultyLevels: DifficultyLevel[] = [
  {
    key: 'easy',
    name: 'Facile',
    description: '1-10, +/-',
    range: [1, 10],
    operations: ['+', '-']
  },
  {
    key: 'medium',
    name: 'Moyen',
    description: '1-20, +/-/×',
    range: [1, 20],
    operations: ['+', '-', '×']
  },
  {
    key: 'hard',
    name: 'Difficile',
    description: '1-50, tous',
    range: [1, 50],
    operations: ['+', '-', '×', '÷']
  }
]

// Game stats
const gameStats = ref({
  gamesPlayed: 0,
  bestScore: 0,
  averageScore: 0,
  totalScore: 0
})

// Game timer
let gameTimer: number | null = null
let feedbackTimer: number | null = null

// Computed properties
const accuracy = computed(() => {
  return totalAnswers.value > 0 ? Math.round((correctAnswers.value / totalAnswers.value) * 100) : 0
})

const problemsPerMinute = computed(() => {
  const timeElapsed = 60 - timeLeft.value
  return timeElapsed > 0 ? Math.round((correctAnswers.value / timeElapsed) * 60) : 0
})

// Load stats
onMounted(() => {
  const savedStats = localStorage.getItem('flashMathGameStats')
  if (savedStats) {
    gameStats.value = JSON.parse(savedStats)
  }
})

// Save stats
const saveStats = () => {
  localStorage.setItem('flashMathGameStats', JSON.stringify(gameStats.value))
}

// Generate math problem based on difficulty
const generateProblem = (): MathProblem => {
  const difficulty = difficultyLevels.find(d => d.key === selectedDifficulty.value)!
  const [min, max] = difficulty.range
  const operations = difficulty.operations
  
  const operation = operations[Math.floor(Math.random() * operations.length)]
  let num1 = Math.floor(Math.random() * (max - min + 1)) + min
  let num2 = Math.floor(Math.random() * (max - min + 1)) + min
  
  let question: string
  let answer: number
  
  switch (operation) {
    case '+':
      question = `${num1} + ${num2}`
      answer = num1 + num2
      break
    case '-':
      // Ensure positive result
      if (num1 < num2) [num1, num2] = [num2, num1]
      question = `${num1} - ${num2}`
      answer = num1 - num2
      break
    case '×':
      // Keep numbers smaller for multiplication
      num1 = Math.min(num1, 12)
      num2 = Math.min(num2, 12)
      question = `${num1} × ${num2}`
      answer = num1 * num2
      break
    case '÷':
      // Ensure clean division
      const divisors = [2, 3, 4, 5, 6, 7, 8, 9, 10]
      num2 = divisors[Math.floor(Math.random() * divisors.length)]
      const quotient = Math.floor(Math.random() * 10) + 1
      num1 = num2 * quotient
      question = `${num1} ÷ ${num2}`
      answer = quotient
      break
    default:
      question = `${num1} + ${num2}`
      answer = num1 + num2
  }
  
  return { question, answer, operation }
}

// Start game
const startGame = () => {
  started.value = true
  finished.value = false
  score.value = 0
  timeLeft.value = 60
  correctAnswers.value = 0
  totalAnswers.value = 0
  currentProblemIndex.value = 0
  isNewRecord.value = false
  answerFeedback.value = null
  
  // Generate first problem
  currentProblem.value = generateProblem()
  problemStartTime.value = Date.now() // Track start time for first problem
  
  // Start game timer
  gameTimer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      endGame()
    }
  }, 1000)
  
  // Focus input
  nextTick(() => {
    answerInput.value?.focus()
  })
}

// Check answer as user types
const checkAnswer = () => {
  // Clear previous feedback
  answerFeedback.value = null
  if (feedbackTimer) {
    clearTimeout(feedbackTimer)
  }
}

// Submit answer
const submitAnswer = () => {
  if (!userAnswer.value) return
  
  const answer = parseInt(userAnswer.value)
  const isCorrect = answer === currentProblem.value.answer
  
  totalAnswers.value++
  
  if (isCorrect) {
    correctAnswers.value++
    // Calculate time-based score: max 10 points, -1 per second
    const responseTime = Date.now() - problemStartTime.value
    const secondsElapsed = Math.floor(responseTime / 1000)
    const timeBasedScore = Math.max(1, 10 - secondsElapsed) // Minimum 1 point
    score.value += timeBasedScore
    answerFeedback.value = 'correct'
  } else {
    score.value = Math.max(0, score.value - 5)
    answerFeedback.value = 'wrong'
  }
  
  // Show feedback briefly, then next problem
  feedbackTimer = setTimeout(() => {
    nextProblem()
  }, 800)
}

// Move to next problem
const nextProblem = () => {
  currentProblemIndex.value++
  currentProblem.value = generateProblem()
  problemStartTime.value = Date.now() // Track when problem starts
  userAnswer.value = ''
  answerFeedback.value = null
  
  // Focus input again
  nextTick(() => {
    answerInput.value?.focus()
  })
}

// End game
const endGame = () => {
  finished.value = true
  started.value = false
  
  // Clear timers
  if (gameTimer) clearInterval(gameTimer)
  if (feedbackTimer) clearTimeout(feedbackTimer)
  
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
  const avgTime = totalAnswers.value > 0 ? 60 / totalAnswers.value : 0 // average time per problem
  
  const achievementStats = {
    gamesPlayed: gameStats.value.gamesPlayed,
    totalScore: gameStats.value.totalScore,
    bestScore: gameStats.value.bestScore,
    averageTime: avgTime
  }
  
  const newAchievements = updateAchievementStats('flashMath', achievementStats)
  
  // Log achievements for debugging
  if (newAchievements.length > 0) {
    console.log('🏆 Nouveaux achievements débloqués:', newAchievements)
  }
}

// Cleanup on unmount
onUnmounted(() => {
  if (gameTimer) clearInterval(gameTimer)
  if (feedbackTimer) clearTimeout(feedbackTimer)
})

defineEmits(['back-to-menu'])
</script>
