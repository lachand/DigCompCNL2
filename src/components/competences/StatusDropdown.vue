<template>
  <div class="relative">
    <button
      @click="isOpen = !isOpen"
      class="px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
      :class="statusClass"
    >
      <i class="ph" :class="statusIcon"></i>
      <span>{{ statusLabel }}</span>
      <i class="ph ph-caret-down text-xs"></i>
    </button>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      v-click-away="() => isOpen = false"
      class="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10"
    >
      <button
        v-for="option in statusOptions"
        :key="option.value"
        @click="selectStatus(option.value)"
        class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-3 first:rounded-t-lg last:rounded-b-lg"
        :class="status === option.value ? 'bg-gray-50 dark:bg-gray-700' : ''"
      >
        <i class="ph" :class="option.icon"></i>
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import type { StatusType, YearLevel } from '@/types'

interface Props {
  status: StatusType
  outcomeId: string
  year: YearLevel
}

const props = defineProps<Props>()

const competencesStore = useCompetencesStore()

const isOpen = ref(false)

const statusOptions = [
  { value: 'none' as StatusType, label: 'Non traité', icon: 'ph-circle' },
  { value: 'draft' as StatusType, label: 'Brouillon', icon: 'ph-pencil-simple' },
  { value: 'review' as StatusType, label: 'En révision', icon: 'ph-magnifying-glass' },
  { value: 'validated' as StatusType, label: 'Validé', icon: 'ph-check-circle' },
  { value: 'obsolete' as StatusType, label: 'Obsolète', icon: 'ph-x-circle' }
]

const statusLabel = computed(() => {
  return statusOptions.find(opt => opt.value === props.status)?.label || 'Aucun'
})

const statusIcon = computed(() => {
  return statusOptions.find(opt => opt.value === props.status)?.icon || 'ph-circle'
})

const statusClass = computed(() => {
  const classes = {
    none: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    validated: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    obsolete: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[props.status]
})

const selectStatus = async (newStatus: StatusType) => {
  await competencesStore.updateStatus(props.outcomeId, props.year, newStatus)
  isOpen.value = false
}
</script>
