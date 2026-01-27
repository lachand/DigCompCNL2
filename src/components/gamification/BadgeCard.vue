<template>
  <div
    class="relative flex flex-col items-center p-3 rounded-xl border transition-all"
    :class="earned
      ? 'bg-white dark:bg-gray-800 border-yellow-300 dark:border-yellow-600 shadow-sm hover:shadow-md'
      : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'"
  >
    <!-- Icon -->
    <div
      class="w-12 h-12 rounded-full flex items-center justify-center mb-2"
      :class="earned
        ? 'bg-yellow-100 dark:bg-yellow-900/30'
        : 'bg-gray-200 dark:bg-gray-700'"
    >
      <i
        v-if="earned"
        class="ph text-2xl text-yellow-600 dark:text-yellow-400"
        :class="badge.icon"
      ></i>
      <i v-else class="ph ph-lock-simple text-xl text-gray-400 dark:text-gray-500"></i>
    </div>

    <!-- Name -->
    <p class="text-xs font-semibold text-center" :class="earned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'">
      {{ badge.name }}
    </p>

    <!-- Description -->
    <p class="text-[10px] text-center mt-0.5" :class="earned ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'">
      {{ badge.description }}
    </p>

    <!-- Progress bar for locked badges -->
    <div v-if="!earned && progress !== undefined && target" class="w-full mt-2">
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
        <div
          class="bg-indigo-500 h-1 rounded-full transition-all"
          :style="{ width: Math.min((progress / target) * 100, 100) + '%' }"
        ></div>
      </div>
      <p class="text-[9px] text-gray-400 text-center mt-0.5">{{ progress }}/{{ target }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Badge } from '@/types'

defineProps<{
  badge: Badge
  earned: boolean
  progress?: number
  target?: number
}>()
</script>
