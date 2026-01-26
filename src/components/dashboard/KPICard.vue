<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">{{ title }}</p>
        <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ value }}</p>
        <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ subtitle }}</p>
      </div>
      <div
        class="w-12 h-12 rounded-lg flex items-center justify-center"
        :class="iconBgClass"
      >
        <i class="ph text-2xl" :class="[icon, iconColorClass]"></i>
      </div>
    </div>

    <!-- Progress Bar -->
    <div v-if="progress !== undefined" class="mt-4">
      <div class="flex items-center justify-between text-xs mb-1">
        <span class="text-gray-600 dark:text-gray-400">Progression</span>
        <span class="font-medium text-gray-900 dark:text-white">{{ Math.round(progress) }}%</span>
      </div>
      <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="progressColorClass"
          :style="{ width: progress + '%' }"
        ></div>
      </div>
    </div>

    <!-- Trend -->
    <div v-if="trend" class="mt-4 flex items-center gap-2 text-sm">
      <i
        class="ph"
        :class="trend.direction === 'up' ? 'ph-trend-up text-green-500' : 'ph-trend-down text-red-500'"
      ></i>
      <span :class="trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
        {{ trend.value }}
      </span>
      <span class="text-gray-500 dark:text-gray-400">{{ trend.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  progress?: number
  trend?: {
    direction: 'up' | 'down'
    value: string
    label: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const iconBgClass = computed(() => {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-700',
    primary: 'bg-indigo-100 dark:bg-indigo-900/20',
    success: 'bg-green-100 dark:bg-green-900/20',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20',
    danger: 'bg-red-100 dark:bg-red-900/20'
  }
  return variants[props.variant]
})

const iconColorClass = computed(() => {
  const variants = {
    default: 'text-gray-600 dark:text-gray-400',
    primary: 'text-indigo-600 dark:text-indigo-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400'
  }
  return variants[props.variant]
})

const progressColorClass = computed(() => {
  const variants = {
    default: 'bg-gray-500',
    primary: 'bg-indigo-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  }
  return variants[props.variant]
})
</script>
