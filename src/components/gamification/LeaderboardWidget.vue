<template>
  <div class="theme-surface rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <i class="ph ph-trophy text-yellow-500"></i>
      Classement
    </h3>

    <div v-if="leaderboard.length === 0" class="text-center py-6 text-gray-500 dark:text-gray-400">
      <i class="ph ph-users text-3xl mb-2"></i>
      <p class="text-sm">Aucune activite pour le moment</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(entry, index) in leaderboard.slice(0, 5)"
        :key="entry.userId"
        class="flex items-center gap-3 p-2 rounded-lg transition"
        :class="index < 3 ? 'bg-gray-50 dark:bg-gray-700' : ''"
      >
        <!-- Rank -->
        <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
          :class="rankClass(index)"
        >
          {{ index + 1 }}
        </div>

        <!-- Avatar -->
        <UserAvatar :email="entry.userId" :size="32" />

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ entry.userId.split('@')[0] }}
          </p>
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span v-if="entry.currentStreak > 0" class="flex items-center gap-0.5">
              <i class="ph ph-fire text-orange-500"></i>
              {{ entry.currentStreak }}j
            </span>
            <span>{{ entry.badges.length }} badges</span>
          </div>
        </div>

        <!-- Points -->
        <div class="text-right">
          <p class="text-sm font-bold" :class="index === 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'">
            {{ entry.points }}
          </p>
          <p class="text-[10px] text-gray-400">pts</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGamification } from '@/composables/useGamification'
import UserAvatar from '@/components/auth/UserAvatar.vue'

const { leaderboard } = useGamification()

function rankClass(index: number): string {
  const classes = [
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  ]
  return classes[index] || 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
}
</script>
