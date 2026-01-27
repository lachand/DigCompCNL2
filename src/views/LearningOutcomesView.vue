<template>
  <div data-tour="outcomes-view" class="space-y-6">
    <!-- Global Progress Indicator (sticky) -->
    <div
      v-if="view.showGlobalProgress"
      class="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 -mx-6 -mt-6 px-6 py-3 mb-6"
    >
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progression globale
          </span>
          <div class="flex gap-2">
            <span
              v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])"
              :key="year"
              class="px-2 py-0.5 text-xs rounded"
              :class="filters.years.includes(year) ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'"
            >
              {{ year }}: {{ getYearProgress(year) }}%
            </span>
          </div>
        </div>
        <button
          @click="toggleGlobalProgress"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <i class="ph ph-x"></i>
        </button>
      </div>
      <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-green-500 via-blue-500 to-indigo-500 transition-all duration-500"
          :style="{ width: globalProgress + '%' }"
        ></div>
      </div>
    </div>

    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm">
      <router-link to="/outcomes" class="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
        Learning Outcomes
      </router-link>
      <template v-if="currentDomain">
        <i class="ph ph-caret-right text-gray-400"></i>
        <router-link
          :to="`/outcomes/${encodeURIComponent(currentDomain.id)}`"
          class="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          {{ currentDomain.name }}
        </router-link>
      </template>
      <template v-if="currentCompetence">
        <i class="ph ph-caret-right text-gray-400"></i>
        <span class="text-gray-900 dark:text-white font-medium">{{ currentCompetence.name }}</span>
      </template>
    </nav>

    <!-- Filters & Actions Bar -->
    <div data-tour="filters" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <div class="relative">
            <input
              v-model="filters.search"
              type="text"
              placeholder="Rechercher un LO..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        <!-- Year Filters -->
        <div class="flex gap-1">
          <button
            v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])"
            :key="year"
            @click="toggleYear(year)"
            class="px-3 py-2 text-sm rounded-lg transition"
            :class="filters.years.includes(year) ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'"
          >
            {{ year }}
          </button>
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

        <!-- Sort -->
        <select
          v-model="filters.sortBy"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="id">Trier par ID</option>
          <option value="status">Trier par statut</option>
          <option value="level">Trier par niveau</option>
          <option value="alphabetical">Trier A-Z</option>
        </select>

        <!-- View Mode Toggle -->
        <div class="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
          <button
            @click="setViewMode('detailed')"
            class="px-3 py-2 transition"
            :class="view.viewMode === 'detailed' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100'"
          >
            <i class="ph ph-list"></i>
          </button>
          <button
            @click="setViewMode('compact')"
            class="px-3 py-2 transition"
            :class="view.viewMode === 'compact' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100'"
          >
            <i class="ph ph-grid-four"></i>
          </button>
        </div>

        <!-- Batch Actions (when items selected) -->
        <div v-if="selectedOutcomes.length > 0" class="flex items-center gap-2">
          <span class="text-sm text-indigo-600 dark:text-indigo-400">
            {{ selectedOutcomes.length }} sélectionné(s)
          </span>
          <button
            @click="showBatchModal = true"
            class="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
          >
            <i class="ph ph-pencil-simple mr-1"></i>
            Actions groupées
          </button>
          <button
            @click="selectedOutcomes = []"
            class="px-2 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <i class="ph ph-x"></i>
          </button>
        </div>

        <!-- Clear Filters -->
        <button
          v-if="hasActiveFilters"
          @click="resetFilters"
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
        <span v-if="!currentDomain && !currentCompetence">sur {{ competencesStore.allOutcomes.length }} LOs</span>
      </p>

      <!-- Select All -->
      <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          :checked="allSelected"
          @change="toggleSelectAll"
          class="w-4 h-4 rounded text-indigo-600"
        />
        Tout sélectionner
      </label>
    </div>

    <!-- Overview Mode (no domain selected) -->
    <div v-if="!currentDomain && !currentCompetence" class="space-y-6">
      <!-- Domain Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <router-link
          v-for="domain in competencesStore.digCompData.domains"
          :key="domain.id"
          :to="`/outcomes/${encodeURIComponent(domain.id)}`"
          class="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition group"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold" :style="{ backgroundColor: getDomainColor(domain.id) }">
              {{ getDomainShortId(domain.id) }}
            </div>
            <i class="ph ph-arrow-right text-xl text-gray-400 group-hover:text-indigo-600 transition"></i>
          </div>

          <h3 class="font-bold text-gray-900 dark:text-white mb-2">{{ domain.name }}</h3>

          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ domain.competences.length }} compétences, {{ getDomainOutcomeCount(domain) }} LOs
          </p>

          <!-- Domain Progress -->
          <div v-if="view.showDomainStats" class="space-y-2">
            <div v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])" :key="year" class="flex items-center gap-2">
              <span class="text-xs text-gray-500 w-6">{{ year }}</span>
              <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="getProgressBarColor(getDomainYearProgress(domain, year))"
                  :style="{ width: getDomainYearProgress(domain, year) + '%' }"
                ></div>
              </div>
              <span class="text-xs text-gray-500 w-8 text-right">{{ getDomainYearProgress(domain, year) }}%</span>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Domain View (domain selected, no competence) -->
    <div v-else-if="currentDomain && !currentCompetence" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <router-link
          v-for="comp in currentDomain.competences"
          :key="comp.id"
          :to="`/outcomes/${encodeURIComponent(currentDomain.id)}/${encodeURIComponent(comp.id)}`"
          class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition"
        >
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-semibold text-gray-900 dark:text-white">{{ comp.id }}: {{ comp.name }}</h4>
            <span class="text-sm text-gray-500">{{ comp.outcomes.length }} LOs</span>
          </div>

          <!-- Competence Progress -->
          <div v-if="view.showDomainStats" class="space-y-1">
            <div v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])" :key="year" class="flex items-center gap-2">
              <span class="text-xs text-gray-500 w-6">{{ year }}</span>
              <div class="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="getProgressBarColor(getCompetenceYearProgress(comp, year))"
                  :style="{ width: getCompetenceYearProgress(comp, year) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Competence View (competence selected) - Show LOs -->
    <div v-else class="space-y-4">
      <!-- Pinned Outcomes -->
      <div v-if="pinnedOutcomes.length > 0">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <i class="ph-fill ph-push-pin text-yellow-500"></i>
          Épinglés
        </h3>
        <div :class="view.viewMode === 'compact' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-4'">
          <template v-if="view.viewMode === 'compact'">
            <CompactOutcomeCard
              v-for="outcome in pinnedOutcomes"
              :key="outcome.id"
              :outcome="outcome"
              :selected="selectedOutcomes.includes(outcome.id)"
              @toggle-select="toggleSelect(outcome.id)"
            />
          </template>
          <template v-else>
            <OutcomeCard
              v-for="outcome in pinnedOutcomes"
              :key="outcome.id"
              :outcome="outcome"
              :selected="selectedOutcomes.includes(outcome.id)"
              @toggle-select="toggleSelect(outcome.id)"
            />
          </template>
        </div>
        <div class="my-6 border-t border-gray-200 dark:border-gray-700"></div>
      </div>

      <!-- Regular Outcomes -->
      <div :class="view.viewMode === 'compact' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-4'">
        <template v-if="view.viewMode === 'compact'">
          <CompactOutcomeCard
            v-for="outcome in regularOutcomes"
            :key="outcome.id"
            :outcome="outcome"
            :selected="selectedOutcomes.includes(outcome.id)"
            @toggle-select="toggleSelect(outcome.id)"
          />
        </template>
        <template v-else>
          <OutcomeCard
            v-for="outcome in regularOutcomes"
            :key="outcome.id"
            :outcome="outcome"
            :selected="selectedOutcomes.includes(outcome.id)"
            @toggle-select="toggleSelect(outcome.id)"
          />
        </template>
      </div>

      <!-- Empty State -->
      <div v-if="filteredOutcomes.length === 0" class="text-center py-12">
        <i class="ph ph-magnifying-glass-minus text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <p class="text-gray-600 dark:text-gray-400">Aucun Learning Outcome trouvé</p>
      </div>
    </div>

    <!-- Batch Actions Modal -->
    <BatchActionsModal
      v-if="showBatchModal"
      :outcome-ids="selectedOutcomes"
      @close="showBatchModal = false"
      @done="handleBatchDone"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCompetencesStore } from '@/stores/competences'
import { useAuthStore } from '@/stores/auth'
import { useUserPreferences } from '@/composables/useUserPreferences'
import OutcomeCard from '@/components/competences/OutcomeCard.vue'
import CompactOutcomeCard from '@/components/competences/CompactOutcomeCard.vue'
import BatchActionsModal from '@/components/competences/BatchActionsModal.vue'
import type { YearLevel, Domain, Competence, LearningOutcome } from '@/types'

const route = useRoute()
const competencesStore = useCompetencesStore()
const authStore = useAuthStore()
const {
  filters,
  view,
  hasActiveFilters,
  resetFilters,
  setViewMode,
  toggleGlobalProgress
} = useUserPreferences()

const selectedOutcomes = ref<string[]>([])
const showBatchModal = ref(false)

// Current domain/competence from route (decoded from URL)
const currentDomain = computed((): Domain | null => {
  if (!route.params.domain) return null
  const decodedDomain = decodeURIComponent(String(route.params.domain))
  return competencesStore.digCompData.domains.find(d => d.id === decodedDomain) || null
})

const currentCompetence = computed((): Competence | null => {
  if (!route.params.competence || !currentDomain.value) return null
  const decodedCompetence = decodeURIComponent(String(route.params.competence))
  return currentDomain.value.competences.find(c => c.id === decodedCompetence) || null
})

// Get outcomes based on current view
const baseOutcomes = computed(() => {
  if (currentCompetence.value) {
    return currentCompetence.value.outcomes
  }
  if (currentDomain.value) {
    return currentDomain.value.competences.flatMap(c => c.outcomes)
  }
  return competencesStore.allOutcomes
})

// Helper to safely get status
const getStatus = (outcome: LearningOutcome, year: YearLevel): string => {
  return outcome.mappings?.[year]?.status || 'none'
}

// Helper to check if outcome has mappings structure
const hasMappings = (outcome: any): boolean => {
  return outcome?.mappings && typeof outcome.mappings === 'object'
}

// Apply filters
const filteredOutcomes = computed(() => {
  let outcomes = [...baseOutcomes.value]

  // Filter out null/undefined outcomes only (keep those without mappings)
  outcomes = outcomes.filter(o => o && o.id)

  // Search
  if (filters.value.search) {
    const query = filters.value.search.toLowerCase()
    outcomes = outcomes.filter(o =>
      o.id.toLowerCase().includes(query) ||
      (o.description || '').toLowerCase().includes(query)
    )
  }

  // Status filter (check any selected year) - only if outcome has mappings
  if (filters.value.status) {
    outcomes = outcomes.filter(o => {
      if (!hasMappings(o)) return filters.value.status === 'none'
      return filters.value.years.some(year => getStatus(o, year) === filters.value.status)
    })
  }

  // Level filter
  if (filters.value.level) {
    outcomes = outcomes.filter(o => o.level === filters.value.level)
  }

  // Pinned only
  if (filters.value.pinnedOnly) {
    outcomes = outcomes.filter(o => authStore.isPinned(o.id))
  }

  // Sort
  outcomes.sort((a, b) => {
    switch (filters.value.sortBy) {
      case 'status':
        const statusOrder: Record<string, number> = { none: 0, draft: 1, review: 2, validated: 3, obsolete: 4 }
        const aStatus = hasMappings(a) ? getStatus(a, filters.value.years[0] || 'L1') : 'none'
        const bStatus = hasMappings(b) ? getStatus(b, filters.value.years[0] || 'L1') : 'none'
        return (statusOrder[aStatus] || 0) - (statusOrder[bStatus] || 0)
      case 'level':
        const levelOrder: Record<string, number> = { Basic: 0, Intermediate: 1, Advanced: 2, 'Highly advanced': 3 }
        return (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0)
      case 'alphabetical':
        return (a.description || '').localeCompare(b.description || '')
      default:
        return a.id.localeCompare(b.id)
    }
  })

  if (filters.value.sortOrder === 'desc') {
    outcomes.reverse()
  }

  return outcomes
})

const pinnedOutcomes = computed(() => {
  return filteredOutcomes.value.filter(o => authStore.isPinned(o.id))
})

const regularOutcomes = computed(() => {
  return filteredOutcomes.value.filter(o => !authStore.isPinned(o.id))
})

// Progress calculations
const globalProgress = computed(() => {
  const allOutcomes = competencesStore.allOutcomes.filter(o => o && o.id)
  const outcomesWithMappings = allOutcomes.filter(hasMappings)
  const total = outcomesWithMappings.length * filters.value.years.length
  if (total === 0) return 0

  let validated = 0
  outcomesWithMappings.forEach(o => {
    filters.value.years.forEach(year => {
      if (getStatus(o, year) === 'validated') validated++
    })
  })

  return Math.round((validated / total) * 100)
})

const getYearProgress = (year: YearLevel) => {
  const allOutcomes = competencesStore.allOutcomes.filter(o => o && o.id)
  const outcomesWithMappings = allOutcomes.filter(hasMappings)
  if (outcomesWithMappings.length === 0) return 0

  const validated = outcomesWithMappings.filter(o => getStatus(o, year) === 'validated').length
  return Math.round((validated / outcomesWithMappings.length) * 100)
}

const getDomainOutcomeCount = (domain: Domain) => {
  return domain.competences.reduce((sum, c) => sum + (c.outcomes?.length || 0), 0)
}

const getDomainYearProgress = (domain: Domain, year: YearLevel) => {
  const outcomes = domain.competences.flatMap(c => c.outcomes || [])
  const outcomesWithMappings = outcomes.filter(hasMappings)
  if (outcomesWithMappings.length === 0) return 0

  const validated = outcomesWithMappings.filter(o => getStatus(o, year) === 'validated').length
  return Math.round((validated / outcomesWithMappings.length) * 100)
}

const getCompetenceYearProgress = (comp: Competence, year: YearLevel) => {
  const outcomesWithMappings = (comp.outcomes || []).filter(hasMappings)
  if (outcomesWithMappings.length === 0) return 0
  const validated = outcomesWithMappings.filter(o => getStatus(o, year) === 'validated').length
  return Math.round((validated / outcomesWithMappings.length) * 100)
}

const getDomainColor = (domainId: string) => {
  const colors: Record<string, string> = {
    '1': '#3b82f6', // Blue
    '2': '#10b981', // Emerald
    '3': '#f59e0b', // Amber
    '4': '#ef4444', // Red
    '5': '#8b5cf6'  // Purple
  }
  // Extract number from domain ID (e.g., "CompetenceArea/1" -> "1")
  const match = domainId.match(/\/(\d+)$/)
  const key = match ? match[1] : domainId
  return colors[key] || '#6b7280'
}

// Helper to get short domain display (e.g., "CompetenceArea/1" -> "1")
const getDomainShortId = (domainId: string) => {
  const match = domainId.match(/\/(\d+)$/)
  return match ? match[1] : domainId
}

const getProgressBarColor = (progress: number) => {
  if (progress >= 80) return 'bg-green-500'
  if (progress >= 50) return 'bg-blue-500'
  if (progress >= 25) return 'bg-yellow-500'
  return 'bg-gray-400'
}

// Year toggle
const toggleYear = (year: YearLevel) => {
  const index = filters.value.years.indexOf(year)
  if (index === -1) {
    filters.value.years.push(year)
  } else if (filters.value.years.length > 1) {
    filters.value.years.splice(index, 1)
  }
}

// Selection
const allSelected = computed(() => {
  return filteredOutcomes.value.length > 0 &&
    filteredOutcomes.value.every(o => selectedOutcomes.value.includes(o.id))
})

const toggleSelect = (outcomeId: string) => {
  const index = selectedOutcomes.value.indexOf(outcomeId)
  if (index === -1) {
    selectedOutcomes.value.push(outcomeId)
  } else {
    selectedOutcomes.value.splice(index, 1)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedOutcomes.value = []
  } else {
    selectedOutcomes.value = filteredOutcomes.value.map(o => o.id)
  }
}

const handleBatchDone = () => {
  showBatchModal.value = false
  selectedOutcomes.value = []
}

// Clear selection when route changes
watch(() => route.fullPath, () => {
  selectedOutcomes.value = []
})
</script>
