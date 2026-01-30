<template>
  <div class="space-y-6">
    <!-- User's Level & Stats -->
    <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-3xl font-bold">Niveau {{ userStats?.level || 1 }}</h2>
          <p class="text-indigo-100">{{ userName }}</p>
        </div>
        <div class="text-5xl">⭐</div>
      </div>

      <!-- Level Progress Bar -->
      <div class="mb-4">
        <div class="flex justify-between mb-1">
          <span class="text-sm">Progression</span>
          <span class="text-sm">{{ currentPoints }} / {{ userStats?.nextLevelPoints }} pts</span>
        </div>
        <div class="w-full theme-bg/20 rounded-full h-3">
          <div
            class="theme-bg rounded-full h-3 transition-all duration-300"
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div class="text-2xl font-bold">{{ userStats?.points || 0 }}</div>
          <div class="text-indigo-100">Points</div>
        </div>
        <div>
          <div class="text-2xl font-bold">{{ userStats?.currentStreak || 0 }}</div>
          <div class="text-indigo-100">Streak</div>
        </div>
        <div>
          <div class="text-2xl font-bold">{{ userStats?.badges.length || 0 }}</div>
          <div class="text-indigo-100">Badges</div>
        </div>
      </div>
    </div>

    <!-- Achievements -->
    <div>
      <h3 class="text-lg font-bold mb-3">🏆 Achievements</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="achievement in achievements"
          :key="achievement.id"
          class="p-3 border rounded-lg"
          :class="rarityClasses[achievement.rarity]"
        >
          <div class="flex items-start gap-2">
            <div class="text-2xl flex-shrink-0">{{ rarityEmoji[achievement.rarity] }}</div>
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold">{{ achievement.name }}</h4>
              <p class="text-xs text-gray-600 dark:text-gray-400">{{ achievement.description }}</p>
              <div v-if="achievement.unlockedAt" class="text-xs text-gray-500 mt-1">
                Déverrouillé: {{ formatDate(achievement.unlockedAt) }}
              </div>
              <div v-else class="text-xs text-gray-500 mt-1">
                <div v-if="showProgress(achievement.id)">
                  Progress: {{ getProgress(achievement.id).current }} / {{ getProgress(achievement.id).target }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Locked achievements preview -->
        <div
          v-if="lockedCount > 0"
          class="p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center text-gray-500"
        >
          <p class="text-sm">+ {{ lockedCount }} achievements à déverrouiller</p>
        </div>
      </div>
    </div>

    <!-- Top Users (Mini Leaderboard) -->
    <div>
      <h3 class="text-lg font-bold mb-3">🥇 Top 5 Joueurs</h3>
      <div class="space-y-2">
        <div
          v-for="(user, index) in topUsers"
          :key="user.userId"
          class="flex items-center gap-3 p-3 theme-surface rounded-lg"
        >
          <div class="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
            {{ index + 1 }}
          </div>
          <div class="flex-1">
            <div class="font-medium">{{ user.userId.split('@')[0] }}</div>
            <div class="text-sm text-gray-600 dark:text-gray-400">Niveau {{ user.level || 1 }}</div>
          </div>
          <div class="text-right">
            <div class="font-bold">{{ user.points }} pts</div>
            <div class="text-xs text-orange-500">{{ user.badges?.length || 0 }} badges</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGamification } from '@/composables/useGamification'
import { useAchievements, ACHIEVEMENTS_LIBRARY } from '@/composables/useAchievements'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/helpers'
import type { UserStats } from '@/types'

const { userStats, leaderboard } = useGamification()
const { unlockedAchievements, getAchievementProgress } = useAchievements()
const authStore = useAuthStore()

const userName = computed(() => authStore.userData?.email?.split('@')[0] || 'Unknown')

const currentPoints = computed(() => userStats.value?.points || 0)

const progressPercentage = computed(() => {
  if (!userStats.value) return 0
  const current = userStats.value.points % 100
  return (current / 100) * 100
})

const achievements = computed(() => {
  // Show unlocked achievements first, then show progress for next ones
  const unlocked = unlockedAchievements.value
  const locked = ACHIEVEMENTS_LIBRARY.filter(a => !unlocked.some(u => u.id === a.id))
  return [...unlocked, ...locked.slice(0, 3)]
})

const lockedCount = computed(() => {
  return ACHIEVEMENTS_LIBRARY.length - unlockedAchievements.value.length
})

const topUsers = computed(() => {
  return (leaderboard.value as UserStats[]).slice(0, 5)
})

const rarityEmoji: Record<string, string> = {
  common: '⚪',
  uncommon: '🟢',
  rare: '🔵',
  legendary: '⭐'
}

const rarityClasses: Record<string, string> = {
  common: 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600',
  uncommon: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
  rare: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
  legendary: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
}

const showProgress = (achievementId: string): boolean => {
  return !unlockedAchievements.value.some(a => a.id === achievementId)
}

const getProgress = (achievementId: string) => {
  if (!userStats.value) return { current: 0, target: 0 }
  return getAchievementProgress(achievementId, userStats.value)
}
</script>
