<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Comparaison L1/L2/L3</h1>
        <p class="text-gray-600 dark:text-gray-400">Comparer les statuts et contenus par année</p>
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-3">
        <select
          v-model="selectedDomain"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Tous les domaines</option>
          <option v-for="domain in domains" :key="domain.id" :value="domain.id">
            {{ domain.id }}. {{ domain.name }}
          </option>
        </select>

        <select
          v-model="showMode"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">Tous les LOs</option>
          <option value="different">Statuts différents</option>
          <option value="incomplete">Incomplets</option>
        </select>
      </div>
    </div>

    <!-- Comparison Table -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                ID
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Description
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                L1
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                L2
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                L3
              </th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="outcome in filteredOutcomes"
              :key="outcome.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
              :class="hasDifferentStatuses(outcome) ? 'bg-amber-50 dark:bg-amber-900/10' : ''"
            >
              <!-- ID -->
              <td class="px-4 py-3">
                <span class="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {{ outcome.id }}
                </span>
              </td>

              <!-- Description -->
              <td class="px-4 py-3">
                <p class="text-sm text-gray-900 dark:text-white line-clamp-2">
                  {{ outcome.description }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs px-1.5 py-0.5 rounded" :class="getLevelClass(outcome.level)">
                    {{ outcome.level }}
                  </span>
                </div>
              </td>

              <!-- L1 -->
              <td class="px-4 py-3">
                <ComparisonCell
                  :mapping="outcome.mappings.L1"
                  year="L1"
                  :outcome-id="outcome.id"
                  @update-status="(status) => updateStatus(outcome.id, 'L1', status)"
                />
              </td>

              <!-- L2 -->
              <td class="px-4 py-3">
                <ComparisonCell
                  :mapping="outcome.mappings.L2"
                  year="L2"
                  :outcome-id="outcome.id"
                  @update-status="(status) => updateStatus(outcome.id, 'L2', status)"
                />
              </td>

              <!-- L3 -->
              <td class="px-4 py-3">
                <ComparisonCell
                  :mapping="outcome.mappings.L3"
                  year="L3"
                  :outcome-id="outcome.id"
                  @update-status="(status) => updateStatus(outcome.id, 'L3', status)"
                />
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    @click="copyToAll(outcome)"
                    class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition"
                    title="Copier L1 vers L2/L3"
                  >
                    <i class="ph ph-copy-simple"></i>
                  </button>
                  <button
                    @click="selectedOutcome = outcome"
                    class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition"
                    title="Voir détails"
                  >
                    <i class="ph ph-eye"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-if="filteredOutcomes.length === 0" class="text-center py-12">
        <i class="ph ph-columns text-5xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <p class="text-gray-600 dark:text-gray-400">Aucun résultat</p>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Statuts identiques</h3>
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ sameStatusCount }}</p>
        <p class="text-xs text-gray-500">sur {{ filteredOutcomes.length }} LOs</p>
      </div>

      <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Statuts différents</h3>
        <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ differentStatusCount }}</p>
        <p class="text-xs text-gray-500">nécessitent attention</p>
      </div>

      <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Totalement validés</h3>
        <p class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ allValidatedCount }}</p>
        <p class="text-xs text-gray-500">L1 + L2 + L3 validés</p>
      </div>
    </div>

    <!-- Detail Modal -->
    <Modal
      v-if="selectedOutcome"
      :model-value="!!selectedOutcome"
      :title="selectedOutcome.id"
      size="xl"
      @update:model-value="selectedOutcome = null"
    >
      <div class="space-y-4">
        <p class="text-gray-700 dark:text-gray-300">{{ selectedOutcome.description }}</p>

        <div class="grid grid-cols-3 gap-4">
          <div v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])" :key="year" class="space-y-2">
            <h4 class="font-medium text-gray-900 dark:text-white">{{ year }}</h4>

            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500">Statut:</span>
                <span class="px-2 py-0.5 rounded text-xs" :class="getStatusClass(selectedOutcome.mappings[year].status)">
                  {{ selectedOutcome.mappings[year].status }}
                </span>
              </div>

              <div v-if="selectedOutcome.mappings[year].courseLink">
                <span class="text-xs text-gray-500">Cours:</span>
                <a
                  :href="selectedOutcome.mappings[year].courseLink"
                  target="_blank"
                  class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline block truncate"
                >
                  {{ selectedOutcome.mappings[year].courseLink }}
                </a>
              </div>

              <div v-if="selectedOutcome.mappings[year].resources?.length">
                <span class="text-xs text-gray-500">Ressources: {{ selectedOutcome.mappings[year].resources?.length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'
import ComparisonCell from '@/components/comparison/ComparisonCell.vue'
import type { LearningOutcome, YearLevel, StatusType } from '@/types'

const competencesStore = useCompetencesStore()
const { success } = useToast()

const selectedDomain = ref('')
const showMode = ref<'all' | 'different' | 'incomplete'>('all')
const selectedOutcome = ref<LearningOutcome | null>(null)

const domains = computed(() => competencesStore.digCompData.domains)

const filteredOutcomes = computed(() => {
  let outcomes = competencesStore.allOutcomes

  // Filter by domain
  if (selectedDomain.value) {
    const domain = domains.value.find(d => d.id === selectedDomain.value)
    if (domain) {
      outcomes = domain.competences.flatMap(c => c.outcomes)
    }
  }

  // Filter by mode
  switch (showMode.value) {
    case 'different':
      outcomes = outcomes.filter(o => hasDifferentStatuses(o))
      break
    case 'incomplete':
      outcomes = outcomes.filter(o =>
        o.mappings.L1.status !== 'validated' ||
        o.mappings.L2.status !== 'validated' ||
        o.mappings.L3.status !== 'validated'
      )
      break
  }

  return outcomes
})

const hasDifferentStatuses = (outcome: LearningOutcome) => {
  const statuses = [
    outcome.mappings.L1.status,
    outcome.mappings.L2.status,
    outcome.mappings.L3.status
  ]
  return new Set(statuses).size > 1
}

const sameStatusCount = computed(() =>
  filteredOutcomes.value.filter(o => !hasDifferentStatuses(o)).length
)

const differentStatusCount = computed(() =>
  filteredOutcomes.value.filter(o => hasDifferentStatuses(o)).length
)

const allValidatedCount = computed(() =>
  filteredOutcomes.value.filter(o =>
    o.mappings.L1.status === 'validated' &&
    o.mappings.L2.status === 'validated' &&
    o.mappings.L3.status === 'validated'
  ).length
)

const getLevelClass = (level: string) => {
  const classes: Record<string, string> = {
    'Basic': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'Advanced': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'Highly advanced': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[level] || 'bg-gray-100 text-gray-800'
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'none': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    'draft': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    'review': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'validated': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'obsolete': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[status] || classes.none
}

const updateStatus = async (outcomeId: string, year: YearLevel, status: StatusType) => {
  await competencesStore.updateStatus(outcomeId, year, status)
}

const copyToAll = async (outcome: LearningOutcome) => {
  const sourceMapping = outcome.mappings.L1

  // Copy status
  await competencesStore.updateStatus(outcome.id, 'L2', sourceMapping.status)
  await competencesStore.updateStatus(outcome.id, 'L3', sourceMapping.status)

  // Copy course link if exists
  if (sourceMapping.courseLink) {
    await competencesStore.updateCourseLink(outcome.id, 'L2', sourceMapping.courseLink)
    await competencesStore.updateCourseLink(outcome.id, 'L3', sourceMapping.courseLink)
  }

  success('Contenu L1 copié vers L2 et L3')
}
</script>
