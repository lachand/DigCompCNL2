<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Back Button -->
    <div v-if="currentGame" class="mb-6">
      <button
        @click="backToMenu"
        class="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <i class="ph ph-arrow-left"></i>
        <span>Retour au menu</span>
      </button>
    </div>

    <!-- Games Menu -->
    <GamesMenu v-if="!currentGame" @select="selectGame" />
    
    <!-- Active Game -->
    <RapidWordGame 
      v-if="currentGame === 'RapidWordGame'" 
      @back-to-menu="backToMenu" 
    />
    <DodgeClickGame 
      v-if="currentGame === 'DodgeClickGame'" 
      @back-to-menu="backToMenu" 
    />
    <FlashMathGame 
      v-if="currentGame === 'FlashMathGame'" 
      @back-to-menu="backToMenu" 
    />
    <GlobalLeaderboard
      v-if="currentGame === 'GlobalLeaderboard'"
      @back-to-menu="backToMenu"
    />
    <GameAchievements
      v-if="currentGame === 'GameAchievements'"
      @back-to-menu="backToMenu"
    />
    <ExtendedGamificationView
      v-if="currentGame === 'ExtendedGamificationShop'"
      :showBackButton="true"
      @back-to-menu="backToMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GamesMenu from '@/components/games/GamesMenu.vue'
import RapidWordGame from '@/components/games/RapidWordGame.vue'
import DodgeClickGame from '@/components/games/DodgeClickGame.vue'
import FlashMathGame from '@/components/games/FlashMathGame.vue'
import GlobalLeaderboard from '@/components/games/GlobalLeaderboard.vue'
import GameAchievements from '@/components/games/GameAchievements.vue'
import ExtendedGamificationView from '@/components/gamification/ExtendedGamificationView.vue'

const currentGame = ref<string | null>(null)

const selectGame = (game: string) => {
  // Tous les jeux sont maintenant disponibles
  if (['RapidWordGame', 'DodgeClickGame', 'FlashMathGame', 'GlobalLeaderboard', 'GameAchievements', 'ExtendedGamificationShop'].includes(game)) {
    currentGame.value = game
  }
}

const backToMenu = () => {
  currentGame.value = null
}
</script>
