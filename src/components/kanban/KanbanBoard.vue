<template>
  <div class="flex gap-4 overflow-x-auto pb-4">
    <div
      v-for="column in columns"
      :key="column.status"
      class="flex-shrink-0 w-80"
    >
      <!-- Column Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <i class="ph" :class="column.icon"></i>
            {{ column.title }}
          </h3>
          <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm rounded-full">
            {{ getColumnOutcomes(column.status).length }}
          </span>
        </div>
        <div class="h-1 rounded-full" :class="column.color"></div>
      </div>

      <!-- Droppable Area -->
      <div
        @drop="onDrop($event, column.status)"
        @dragover.prevent
        @dragenter="onDragEnter($event, column.status)"
        @dragleave="onDragLeave"
        class="min-h-[200px] p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg transition-colors"
        :class="dragOverColumn === column.status ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500' : ''"
      >
        <div class="space-y-3">
          <KanbanCard
            v-for="outcome in getColumnOutcomes(column.status)"
            :key="outcome.id"
            :outcome="outcome"
            :year="year"
            @drag-start="onDragStart($event, outcome)"
          />

          <div v-if="getColumnOutcomes(column.status).length === 0" class="text-center py-8 text-gray-400 dark:text-gray-600">
            <i class="ph ph-empty text-3xl mb-2"></i>
            <p class="text-sm">Aucune carte</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import KanbanCard from './KanbanCard.vue'
import type { YearLevel, StatusType, LearningOutcome } from '@/types'

interface Props {
  year: YearLevel
}

const props = defineProps<Props>()

const competencesStore = useCompetencesStore()

const dragOverColumn = ref<StatusType | null>(null)
const draggedOutcome = ref<LearningOutcome | null>(null)

const columns = [
  { status: 'none' as StatusType, title: 'Non traité', icon: 'ph-circle', color: 'bg-gray-400' },
  { status: 'draft' as StatusType, title: 'Brouillon', icon: 'ph-pencil-simple', color: 'bg-yellow-400' },
  { status: 'review' as StatusType, title: 'En révision', icon: 'ph-magnifying-glass', color: 'bg-blue-400' },
  { status: 'validated' as StatusType, title: 'Validé', icon: 'ph-check-circle', color: 'bg-green-400' },
  { status: 'obsolete' as StatusType, title: 'Obsolète', icon: 'ph-x-circle', color: 'bg-red-400' }
]

const getColumnOutcomes = (status: StatusType) => {
  return competencesStore.allOutcomes.filter(
    outcome => outcome.mappings[props.year].status === status
  )
}

const onDragStart = (e: DragEvent, outcome: LearningOutcome) => {
  draggedOutcome.value = outcome
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

const onDragEnter = (e: DragEvent, status: StatusType) => {
  dragOverColumn.value = status
}

const onDragLeave = (e: DragEvent) => {
  dragOverColumn.value = null
}

const onDrop = async (e: DragEvent, newStatus: StatusType) => {
  e.preventDefault()
  dragOverColumn.value = null

  if (!draggedOutcome.value) return

  const outcome = draggedOutcome.value
  const oldStatus = outcome.mappings[props.year].status

  if (oldStatus === newStatus) return

  await competencesStore.updateStatus(outcome.id, props.year, newStatus)
  draggedOutcome.value = null
}
</script>
