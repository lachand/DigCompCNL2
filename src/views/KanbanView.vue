<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Kanban Board</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">Glissez-déposez les cartes pour changer leur statut</p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Year Selector -->
          <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              v-for="yearOption in (['L1', 'L2', 'L3'] as YearLevel[])"
              :key="yearOption"
              @click="selectedYear = yearOption"
              class="px-4 py-2 rounded-lg transition"
              :class="selectedYear === yearOption ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-600'"
            >
              {{ yearOption }}
            </button>
          </div>

          <!-- Filters -->
          <select
            v-model="filterLevel"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Tous les niveaux</option>
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Highly advanced">Highly advanced</option>
          </select>

          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher..."
            class="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-5 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.status"
        class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ stat.label }}</span>
          <i class="ph" :class="stat.icon"></i>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.count }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ stat.percentage }}%</p>
      </div>
    </div>

    <!-- Kanban Board -->
    <KanbanBoard :year="selectedYear" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import KanbanBoard from '@/components/kanban/KanbanBoard.vue'
import type { YearLevel, StatusType } from '@/types'

const competencesStore = useCompetencesStore()

const selectedYear = ref<YearLevel>('L1')
const filterLevel = ref('')
const searchQuery = ref('')

const stats = computed(() => {
  const allOutcomes = competencesStore.allOutcomes
  const total = allOutcomes.length

  const getCount = (status: StatusType) => {
    return allOutcomes.filter(o => o.mappings[selectedYear.value].status === status).length
  }

  const statuses: Array<{ status: StatusType; label: string; icon: string }> = [
    { status: 'none', label: 'Non traité', icon: 'ph-circle' },
    { status: 'draft', label: 'Brouillon', icon: 'ph-pencil-simple' },
    { status: 'review', label: 'En révision', icon: 'ph-magnifying-glass' },
    { status: 'validated', label: 'Validé', icon: 'ph-check-circle' },
    { status: 'obsolete', label: 'Obsolète', icon: 'ph-x-circle' }
  ]

  return statuses.map(s => {
    const count = getCount(s.status)
    return {
      ...s,
      count,
      percentage: Math.round((count / total) * 100)
    }
  })
})
</script>
