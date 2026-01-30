<template>
  <div class="theme-surface rounded-lg border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <i class="ph ph-chart-line-up text-indigo-500"></i>
      Mes statistiques
    </h3>

    <div v-if="!userStats" class="text-center py-6 text-gray-500 dark:text-gray-400">
      <i class="ph ph-spinner animate-spin text-3xl mb-2"></i>
      <p class="text-sm">Chargement...</p>
    </div>

    <div v-else class="space-y-4">
      <!-- Key metrics -->
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ userStats.points }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Points</p>
        </div>
        <div class="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <p class="text-2xl font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
            <i class="ph ph-fire text-lg"></i>
            {{ userStats.currentStreak }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Streak</p>
        </div>
        <div class="text-center p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ earnedBadges.length }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">Badges</p>
        </div>
      </div>

      <!-- Next badge progress -->
      <div v-if="nextBadge" class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div class="flex items-center gap-2 mb-2">
          <i class="ph text-lg text-gray-400" :class="nextBadge.badge.icon"></i>
          <div class="flex-1">
            <p class="text-xs font-medium text-gray-900 dark:text-white">{{ nextBadge.badge.name }}</p>
            <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ nextBadge.badge.description }}</p>
          </div>
          <span class="text-xs text-gray-500">{{ nextBadge.progress }}/{{ nextBadge.target }}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
          <div
            class="bg-indigo-500 h-1.5 rounded-full transition-all"
            :style="{ width: Math.min((nextBadge.progress / nextBadge.target) * 100, 100) + '%' }"
          ></div>
        </div>
      </div>

      <!-- Badges grid -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Badges</h4>
        <div class="grid grid-cols-5 gap-2">
          <BadgeCard
            v-for="badge in BADGE_DEFINITIONS"
            :key="badge.id"
            :badge="badge"
            :earned="userStats.badges.includes(badge.id)"
          />
        </div>
      </div>

      <!-- Action breakdown -->
      <div>
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activite</h4>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span class="text-gray-600 dark:text-gray-400">Changements de statut</span>
            <span class="font-bold text-gray-900 dark:text-white">{{ userStats.actionCounts.statusChanges }}</span>
          </div>
          <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span class="text-gray-600 dark:text-gray-400">Validations</span>
            <span class="font-bold text-gray-900 dark:text-white">{{ userStats.actionCounts.validations }}</span>
          </div>
          <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span class="text-gray-600 dark:text-gray-400">Reviews</span>
            <span class="font-bold text-gray-900 dark:text-white">{{ userStats.actionCounts.reviews }}</span>
          </div>
          <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <span class="text-gray-600 dark:text-gray-400">Commentaires</span>
            <span class="font-bold text-gray-900 dark:text-white">{{ userStats.actionCounts.comments }}</span>
          </div>
          <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded col-span-2">
            <span class="text-gray-600 dark:text-gray-400">Ressources ajoutees</span>
            <span class="font-bold text-gray-900 dark:text-white">{{ userStats.actionCounts.resources }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGamification } from '@/composables/useGamification'
import BadgeCard from './BadgeCard.vue'

const { userStats, earnedBadges, nextBadge, BADGE_DEFINITIONS } = useGamification()
</script>
