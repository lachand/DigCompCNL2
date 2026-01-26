<template>
  <div class="flex flex-col items-center gap-1">
    <!-- Status Badge -->
    <select
      :value="mapping.status"
      @change="$emit('update-status', ($event.target as HTMLSelectElement).value)"
      class="w-full text-xs px-2 py-1 rounded border-0 text-center cursor-pointer"
      :class="statusClass"
    >
      <option value="none">Non traité</option>
      <option value="draft">Brouillon</option>
      <option value="review">En révision</option>
      <option value="validated">Validé</option>
      <option value="obsolete">Obsolète</option>
    </select>

    <!-- Indicators -->
    <div class="flex items-center gap-1 text-gray-400">
      <i
        v-if="mapping.courseLink"
        class="ph ph-link text-xs"
        :class="mapping.courseLink ? 'text-indigo-500' : ''"
        title="Lien cours"
      ></i>
      <i
        v-if="mapping.resources?.length"
        class="ph ph-file-text text-xs"
        :class="mapping.resources?.length ? 'text-green-500' : ''"
        :title="`${mapping.resources?.length} ressource(s)`"
      ></i>
      <span v-if="!mapping.courseLink && !mapping.resources?.length" class="text-xs text-gray-300">-</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { YearMapping } from '@/types'

interface Props {
  mapping: YearMapping
  year: string
  outcomeId: string
}

const props = defineProps<Props>()
defineEmits<{ 'update-status': [status: string] }>()

const statusClass = computed(() => {
  const classes: Record<string, string> = {
    'none': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    'draft': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    'review': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'validated': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'obsolete': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }
  return classes[props.mapping.status] || classes.none
})
</script>
