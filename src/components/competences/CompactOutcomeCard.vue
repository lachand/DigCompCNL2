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
      {{ translateLevel(outcome.level) }}
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
      <span
        v-if="deadlineStatus"
        class="flex items-center gap-0.5"
        :class="deadlineStatus === 'overdue' ? 'text-red-500' : deadlineStatus === 'soon' ? 'text-orange-500' : 'text-gray-400'"
        :title="deadlineTitle"
      >
        <i class="ph text-xs" :class="deadlineStatus === 'overdue' ? 'ph-alarm' : 'ph-calendar'"></i>
      </span>
      <span v-if="lockedBy" class="ml-auto flex items-center gap-1 text-red-500" :title="`En edition par ${lockedBy}`">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <i class="ph ph-lock-key text-xs"></i>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompetencesStore } from '@/stores/competences'
import { translateLevel } from '@/utils/helpers'
import type { LearningOutcome, YearLevel } from '@/types'

interface Props {
  outcome: LearningOutcome
  selected?: boolean
}

const props = defineProps<Props>()
defineEmits<{ 'toggle-select': [] }>()

const authStore = useAuthStore()
const competencesStore = useCompetencesStore()

const isPinned = computed(() => authStore.isPinned(props.outcome.id))
const lockedBy = computed(() => competencesStore.getLockedBy(props.outcome.id))

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

const deadlineStatus = computed<'overdue' | 'soon' | 'normal' | null>(() => {
  if (!props.outcome.mappings) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  let closest: number | null = null

  for (const year of ['L1', 'L2', 'L3'] as YearLevel[]) {
    const dl = props.outcome.mappings[year]?.deadline
    if (dl) {
      if (closest === null || dl.date < closest) closest = dl.date
    }
  }

  if (closest === null) return null
  const days = Math.ceil((closest - now.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'overdue'
  if (days <= 3) return 'soon'
  return 'normal'
})

const deadlineTitle = computed(() => {
  if (!props.outcome.mappings) return ''
  const parts: string[] = []
  for (const year of ['L1', 'L2', 'L3'] as YearLevel[]) {
    const dl = props.outcome.mappings[year]?.deadline
    if (dl) {
      parts.push(`${year}: ${dl.label} (${new Date(dl.date).toLocaleDateString('fr-FR')})`)
    }
  }
  return parts.join(' | ')
})
</script>
