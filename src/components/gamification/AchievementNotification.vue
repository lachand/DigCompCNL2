<template>
  <div v-if="newAchievements.length > 0" class="fixed bottom-8 right-8 z-50 max-w-sm">
    <transition-group name="achievement" tag="div" class="space-y-2">
      <div
        v-for="achievement in newAchievements"
        :key="achievement.id"
        class="theme-surface border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 shadow-2xl animate-bounce"
        :class="rarityClasses[achievement.rarity]"
      >
        <div class="flex items-start gap-3">
          <div class="text-2xl">{{ rarityEmoji[achievement.rarity] }}</div>
          <div class="flex-1">
            <h3 class="font-bold text-lg">🏆 {{ achievement.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ achievement.description }}</p>
            <div class="mt-2 text-xs text-gray-500 dark:text-gray-500">
              {{ formatDate(achievement.unlockedAt) }}
            </div>
          </div>
          <button
            @click="dismiss(achievement.id)"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <i class="ph ph-x text-lg"></i>
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAchievements } from '@/composables/useAchievements'
import { formatDate } from '@/utils/helpers'
import type { Achievement } from '@/types'

const { newAchievements, clearNewAchievements } = useAchievements()

const displayedAchievements = ref<Achievement[]>([])

const rarityEmoji: Record<string, string> = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  legendary: '⭐'
}

const rarityClasses: Record<string, string> = {
  common: 'border-gray-400',
  uncommon: 'border-green-500',
  rare: 'border-blue-500',
  legendary: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
}

watch(newAchievements, (newAchs) => {
  newAchs.forEach(ach => {
    displayedAchievements.value.push(ach)
    // Auto-remove after 5 seconds
    setTimeout(() => {
      dismiss(ach.id)
    }, 5000)
  })
  clearNewAchievements()
}, { deep: true })

const dismiss = (achievementId: string) => {
  displayedAchievements.value = displayedAchievements.value.filter(a => a.id !== achievementId)
}
</script>

<style scoped>
.achievement-enter-active,
.achievement-leave-active {
  transition: all 0.3s ease;
}

.achievement-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.achievement-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.8);
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>
