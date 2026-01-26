<template>
  <div class="space-y-6">
    <!-- Filters & Actions -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Rechercher..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        <!-- Status Filter -->
        <select
          v-model="filters.status"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Tous les statuts</option>
          <option value="none">Non traité</option>
          <option value="draft">Brouillon</option>
          <option value="review">En révision</option>
          <option value="validated">Validé</option>
          <option value="obsolete">Obsolète</option>
        </select>

        <!-- Level Filter -->
        <select
          v-model="filters.level"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Tous les niveaux</option>
          <option value="Basic">Basic</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Highly advanced">Highly advanced</option>
        </select>

        <!-- Domain Filter -->
        <select
          v-model="filters.domain"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Tous les domaines</option>
          <option v-for="domain in competencesStore.digCompData.domains" :key="domain.id" :value="domain.id">
            {{ domain.name }}
          </option>
        </select>

        <!-- Show Pinned Only -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="filters.pinnedOnly"
            type="checkbox"
            class="w-4 h-4 text-indigo-600 rounded"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">Épinglés uniquement</span>
        </label>

        <!-- Clear Filters -->
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <i class="ph ph-x-circle mr-1"></i>
          Effacer
        </button>
      </div>
    </div>

    <!-- Results Count -->
    <div class="flex items-center justify-between">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ filteredOutcomes.length }} résultat(s)
      </p>
    </div>

    <!-- Outcomes List -->
    <div class="space-y-4">
      <!-- Pinned Outcomes -->
      <div v-if="pinnedOutcomes.length > 0 && !filters.pinnedOnly">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <i class="ph-fill ph-push-pin text-yellow-500"></i>
          Épinglés
        </h3>
        <div class="space-y-4">
          <OutcomeCard
            v-for="outcome in pinnedOutcomes"
            :key="outcome.id"
            :outcome="outcome"
          />
        </div>
        <div class="my-6 border-t border-gray-200 dark:border-gray-700"></div>
      </div>

      <!-- Regular Outcomes -->
      <div v-for="domain in filteredDomains" :key="domain.id" class="space-y-4">
        <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <i class="ph ph-folder"></i>
          {{ domain.name }}
        </h3>

        <div v-for="competence in domain.competences" :key="competence.id" class="ml-4 space-y-3">
          <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {{ competence.name }}
          </h4>

          <div class="space-y-3">
            <OutcomeCard
              v-for="outcome in getFilteredOutcomes(competence.outcomes)"
              :key="outcome.id"
              :outcome="outcome"
            />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredOutcomes.length === 0" class="text-center py-12">
        <i class="ph ph-magnifying-glass-minus text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <p class="text-gray-600 dark:text-gray-400">Aucune compétence trouvée</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import { useAuthStore } from '@/stores/auth'
import OutcomeCard from '@/components/competences/OutcomeCard.vue'
import type { LearningOutcome, YearLevel } from '@/types'

interface Props {
  year: YearLevel
}

const props = defineProps<Props>()

const competencesStore = useCompetencesStore()
const authStore = useAuthStore()

const filters = ref({
  search: '',
  status: '',
  level: '',
  domain: '',
  pinnedOnly: false
})

const hasActiveFilters = computed(() => {
  return filters.value.search ||
    filters.value.status ||
    filters.value.level ||
    filters.value.domain ||
    filters.value.pinnedOnly
})

const filteredOutcomes = computed(() => {
  let outcomes = competencesStore.allOutcomes

  // Search
  if (filters.value.search) {
    const query = filters.value.search.toLowerCase()
    outcomes = outcomes.filter(o =>
      o.id.toLowerCase().includes(query) ||
      o.description.toLowerCase().includes(query)
    )
  }

  // Status
  if (filters.value.status) {
    outcomes = outcomes.filter(o => o.mappings[props.year].status === filters.value.status)
  }

  // Level
  if (filters.value.level) {
    outcomes = outcomes.filter(o => o.level === filters.value.level)
  }

  // Pinned only
  if (filters.value.pinnedOnly) {
    outcomes = outcomes.filter(o => authStore.isPinned(o.id))
  }

  return outcomes
})

const pinnedOutcomes = computed(() => {
  return filteredOutcomes.value.filter(o => authStore.isPinned(o.id))
})

const filteredDomains = computed(() => {
  let domains = competencesStore.digCompData.domains

  // Domain filter
  if (filters.value.domain) {
    domains = domains.filter(d => d.id === filters.value.domain)
  }

  // Filter domains that have outcomes
  return domains.map(domain => ({
    ...domain,
    competences: domain.competences.map(comp => ({
      ...comp,
      outcomes: getFilteredOutcomes(comp.outcomes)
    })).filter(comp => comp.outcomes.length > 0)
  })).filter(domain => domain.competences.length > 0)
})

const getFilteredOutcomes = (outcomes: LearningOutcome[]) => {
  return outcomes.filter(o =>
    filteredOutcomes.value.includes(o) &&
    !authStore.isPinned(o.id)
  )
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    level: '',
    domain: '',
    pinnedOnly: false
  }
}
</script>
