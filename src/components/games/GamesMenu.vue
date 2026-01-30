<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full mb-4">
        <i class="ph ph-game-controller text-3xl text-white"></i>
      </div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mini-jeux</h1>
      <p class="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Défie-toi avec nos mini-jeux amusants ! Améliore ta vitesse, ta précision et tes réflexes tout en t'amusant.
      </p>
    </div>

    <!-- Games Grid -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- Rapid Word Game -->
      <div 
        @click="$emit('select', 'RapidWordGame')"
        class="theme-surface border border-gray-200 dark:border-gray-700 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all group"
      >
        <div class="text-center">
          <div class="w-16 h-16 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
            <i class="ph ph-keyboard text-2xl text-indigo-600 dark:text-indigo-400"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Mot Rapide</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Tape une séquence de 10 mots consécutifs le plus vite possible !
          </p>
          <div class="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <div class="flex items-center gap-1">
              <i class="ph ph-timer"></i>
              <span>Vitesse</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="ph ph-trophy"></i>
              <span>Score</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Dodge & Click Game -->
      <div 
        @click="$emit('select', 'DodgeClickGame')"
        class="theme-surface border border-gray-200 dark:border-gray-700 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all group"
      >
        <div class="text-center">
          <div class="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
            <i class="ph ph-target text-2xl text-green-600 dark:text-green-400"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Dodge & Click</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Clique sur les bonnes cibles tout en évitant les pièges !
          </p>
          <div class="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <div class="flex items-center gap-1">
              <i class="ph ph-lightning"></i>
              <span>Réflexes</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="ph ph-eye"></i>
              <span>Précision</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Flash Math Game -->
      <div 
        @click="$emit('select', 'FlashMathGame')"
        class="theme-surface border border-gray-200 dark:border-gray-700 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all group"
      >
        <div class="text-center">
          <div class="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
            <i class="ph ph-calculator text-2xl text-purple-600 dark:text-purple-400"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Flash Math</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Résous des calculs simples le plus rapidement possible !
          </p>
          <div class="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <div class="flex items-center gap-1">
              <i class="ph ph-brain"></i>
              <span>Mental</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="ph ph-clock"></i>
              <span>Chrono</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Achievements -->
      <div 
        @click="$emit('select', 'GameAchievements')"
        class="theme-surface border border-gray-200 dark:border-gray-700 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all group"
      >
        <div class="text-center">
          <div class="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/50 transition-colors">
            <i class="ph ph-medal text-2xl text-yellow-600 dark:text-yellow-400"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Succès des Jeux</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Débloquez des succès et gagnez des points pour la boutique !
          </p>
          <div class="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <div class="flex items-center gap-1">
              <i class="ph ph-star"></i>
              <span>{{ unlockedCount }}/{{ totalCount }}</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="ph ph-coins"></i>
              <span>{{ totalPointsFromAchievements }}pts</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Shop Link -->
      <div 
        @click="$emit('select', 'ExtendedGamificationShop')"
        class="theme-surface border border-gray-200 dark:border-gray-700 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all group"
      >
        <div class="text-center">
          <div class="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
            <i class="ph ph-shopping-cart text-2xl text-blue-600 dark:text-blue-400"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Boutique</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Utilisez vos points pour acheter des améliorations !
          </p>
          <div class="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <div class="flex items-center gap-1">
              <i class="ph ph-coins"></i>
              <span>{{ userPoints }}pts</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="ph ph-gift"></i>
              <span>Objets</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Leaderboard Section -->
    <div 
      @click="$emit('select', 'GlobalLeaderboard')"
      class="theme-surface border border-gray-200 dark:border-gray-700 rounded-xl p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all"
    >
      <div class="text-center">
        <i class="ph ph-trophy text-4xl text-yellow-500 mb-3"></i>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Voir le Classement Global</h3>
        <p class="text-gray-600 dark:text-gray-400 text-sm">
          Compare tes scores avec les autres joueurs et découvre ton classement !
        </p>
        <div class="mt-4 inline-flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 font-medium">
          <i class="ph ph-chart-bar"></i>
          <span>Voir les stats</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useGameAchievements } from '@/composables/useGameAchievements'
import { useExtendedGamificationStore } from '@/stores/extendedGamification'

defineEmits(['select'])

const { achievements, unlockedAchievements, totalPointsEarned, init } = useGameAchievements()
const extendedGamificationStore = useExtendedGamificationStore()

const unlockedCount = computed(() => unlockedAchievements.value.length)
const totalCount = computed(() => achievements.value.length)
const totalPointsFromAchievements = computed(() => totalPointsEarned.value)
const userPoints = computed(() => extendedGamificationStore.points)

onMounted(() => {
  // Initialiser les composables
  init()
  extendedGamificationStore.init()
})
</script>
