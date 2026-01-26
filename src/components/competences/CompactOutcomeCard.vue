<template>
  <div
    class="p-3 bg-white dark:bg-gray-800 border rounded-lg transition cursor-pointer hover:shadow-md"
    :class="[
      selected ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800' : 'border-gray-200 dark:border-gray-700',
      isPinned ? 'border-l-4 border-l-yellow-500' : ''
    ]"
    @click="$emit('toggle-select')"
  >
    <!-- Header -->
    <div class="flex items-start justify-between mb-2">
      <span class="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ outcome.id }}</span>
      <div class="flex items-center gap-1">
        <button
          @click.stop="authStore.togglePin(outcome.id)"
          class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <i class="ph text-sm" :class="isPinned ? 'ph-fill ph-push-pin text-yellow-500' : 'ph ph-push-pin text-gray-400'"></i>
        </button>
      </div>
    </div>

    <!-- Description (truncated) -->
    <p class="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
      {{ outcome.description }}
    </p>

    <!-- Level badge -->
    <span class="inline-block px-1.5 py-0.5 text-xs rounded" :class="levelClass">
      {{ outcome.level }}
    </span>

    <!-- Year Status -->
    <div v-if="outcome.mappings" class="flex gap-1 mt-2">
      <div
        v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])"
        :key="year"
        class="flex-1 h-1.5 rounded-full"
        :class="getStatusColor(outcome.mappings[year]?.status || 'none')"
        :title="`${year}: ${outcome.mappings[year]?.status || 'none'}`"
      ></div>
    </div>

    <!-- Quick indicators -->
    <div class="flex items-center gap-2 mt-2 text-gray-400">
      <i v-if="hasResources" class="ph ph-file-text text-xs" title="Ressources"></i>
      <i v-if="hasCourseLink" class="ph ph-link text-xs" title="Lien cours"></i>
      <i v-if="outcome.comments?.length" class="ph ph-chat-circle text-xs" title="Commentaires"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { LearningOutcome, YearLevel } from '@/types'

interface Props {
  outcome: LearningOutcome
  selected?: boolean
}

const props = defineProps<Props>()
defineEmits<{ 'toggle-select': [] }>()

const authStore = useAuthStore()

const isPinned = computed(() => authStore.isPinned(props.outcome.id))

const levelClass = computed(() => {
  const classes: Record<string, string> = {
    'Basic': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'Advanced': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'Highly advanced': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[props.outcome.level]
})

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'none': 'bg-gray-200 dark:bg-gray-700',
    'draft': 'bg-yellow-400',
    'review': 'bg-blue-400',
    'validated': 'bg-green-500',
    'obsolete': 'bg-red-400'
  }
  return colors[status] || colors.none
}

const hasResources = computed(() => {
  if (!props.outcome.mappings) return false
  return ['L1', 'L2', 'L3'].some(year =>
    (props.outcome.mappings?.[year as YearLevel]?.resources?.length || 0) > 0
  )
})

const hasCourseLink = computed(() => {
  if (!props.outcome.mappings) return false
  return ['L1', 'L2', 'L3'].some(year =>
    !!props.outcome.mappings?.[year as YearLevel]?.courseLink
  )
})
</script>
