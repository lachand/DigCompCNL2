<template>
  <Transition
    enter-active-class="transition-transform duration-300"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-300"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <div
      v-if="isOpen"
      class="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-40 flex flex-col"
    >
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <i class="ph ph-tree-structure"></i>
          Référentiel DigComp 3.0
        </h2>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <i class="ph ph-x"></i>
        </button>
      </div>

      <!-- Search -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher un LO..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
          />
          <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
        </div>
      </div>

      <!-- Tree View -->
      <div class="flex-1 overflow-y-auto p-4">
        <!-- Domains -->
        <div v-for="domain in filteredDomains" :key="domain.id" class="mb-4">
          <button
            @click="toggleDomain(domain.id)"
            class="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
          >
            <i
              class="ph text-gray-500 transition-transform"
              :class="expandedDomains.includes(domain.id) ? 'ph-caret-down' : 'ph-caret-right'"
            ></i>
            <span class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" :style="{ backgroundColor: domainColors[domain.id] }">
              {{ domain.id }}
            </span>
            <span class="flex-1 font-medium text-gray-900 dark:text-white text-sm">{{ domain.name }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ getDomainOutcomeCount(domain) }} LO</span>
          </button>

          <!-- Competences -->
          <div v-if="expandedDomains.includes(domain.id)" class="ml-6 mt-1 space-y-1">
            <div v-for="competence in domain.competences" :key="competence.id">
              <button
                @click="toggleCompetence(competence.id)"
                class="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-left"
              >
                <i
                  class="ph text-gray-400 transition-transform text-sm"
                  :class="expandedCompetences.includes(competence.id) ? 'ph-caret-down' : 'ph-caret-right'"
                ></i>
                <span class="font-mono text-xs text-indigo-600 dark:text-indigo-400">{{ competence.id }}</span>
                <span class="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{{ getCompetenceTitle(competence.id) }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ competence.outcomes.length }}</span>
              </button>

              <!-- Outcomes -->
              <div v-if="expandedCompetences.includes(competence.id)" class="ml-6 mt-1 space-y-1">
                <button
                  v-for="outcome in competence.outcomes"
                  :key="outcome.id"
                  @click="selectOutcome(outcome)"
                  class="w-full flex items-start gap-2 p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition text-left group"
                  :class="{ 'bg-indigo-50 dark:bg-indigo-900/20': selectedOutcome?.id === outcome.id }"
                >
                  <i class="ph ph-dot text-gray-400 mt-0.5"></i>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ outcome.id }}</span>
                      <span
                        class="px-1.5 py-0.5 text-xs rounded"
                        :class="levelClass(outcome.level)"
                      >
                        {{ levelShort(outcome.level) }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {{ outcome.description }}
                    </p>
                    <!-- Status indicators -->
                    <div class="flex gap-1 mt-1">
                      <span
                        v-for="year in (['L1', 'L2', 'L3'] as const)"
                        :key="year"
                        class="w-5 h-1.5 rounded-full"
                        :class="statusColor(outcome.mappings[year]?.status)"
                        :title="`${year}: ${outcome.mappings[year]?.status || 'none'}`"
                      ></span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- No results -->
        <div v-if="filteredDomains.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
          <i class="ph ph-magnifying-glass-minus text-4xl mb-2"></i>
          <p>Aucun résultat pour "{{ searchQuery }}"</p>
        </div>
      </div>

      <!-- Selected Outcome Detail -->
      <div v-if="selectedOutcome" class="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
        <div class="flex items-start justify-between mb-2">
          <div>
            <span class="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">{{ selectedOutcome.id }}</span>
            <span class="ml-2 px-2 py-0.5 text-xs rounded" :class="levelClass(selectedOutcome.level)">
              {{ selectedOutcome.level }}
            </span>
          </div>
          <button
            @click="selectedOutcome = null"
            class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <i class="ph ph-x text-sm"></i>
          </button>
        </div>
        <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">{{ selectedOutcome.description }}</p>

        <!-- Quick Actions -->
        <div class="flex gap-2">
          <button
            @click="navigateToOutcome"
            class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition flex items-center justify-center gap-1"
          >
            <i class="ph ph-arrow-right"></i>
            Voir détails
          </button>
          <button
            @click="copyOutcomeId"
            class="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition"
            title="Copier l'ID"
          >
            <i class="ph ph-copy"></i>
          </button>
        </div>
      </div>

      <!-- Stats Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{{ totalOutcomes }} Learning Outcomes</span>
          <span>{{ totalCompetences }} Compétences</span>
          <span>{{ totalDomains }} Domaines</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCompetencesStore } from '@/stores/competences'
import { useToast } from '@/composables/useToast'
import { OFFICIAL_TITLES } from '@/types'
import type { LearningOutcome, Domain } from '@/types'

interface Props {
  isOpen: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const competencesStore = useCompetencesStore()
const { success } = useToast()

const searchQuery = ref('')
const expandedDomains = ref<string[]>([])
const expandedCompetences = ref<string[]>([])
const selectedOutcome = ref<LearningOutcome | null>(null)

const domainColors: Record<string, string> = {
  '1': '#3b82f6', // blue
  '2': '#22c55e', // green
  '3': '#f59e0b', // amber
  '4': '#ef4444', // red
  '5': '#8b5cf6'  // purple
}

const filteredDomains = computed(() => {
  if (!searchQuery.value) {
    return competencesStore.digCompData.domains
  }

  const query = searchQuery.value.toLowerCase()
  return competencesStore.digCompData.domains
    .map(domain => ({
      ...domain,
      competences: domain.competences
        .map(comp => ({
          ...comp,
          outcomes: comp.outcomes.filter(o =>
            o.id.toLowerCase().includes(query) ||
            o.description.toLowerCase().includes(query)
          )
        }))
        .filter(comp => comp.outcomes.length > 0)
    }))
    .filter(domain => domain.competences.length > 0)
})

const totalDomains = computed(() => competencesStore.digCompData.domains.length)
const totalCompetences = computed(() =>
  competencesStore.digCompData.domains.reduce((sum, d) => sum + d.competences.length, 0)
)
const totalOutcomes = computed(() => competencesStore.allOutcomes.length)

const getDomainOutcomeCount = (domain: Domain) =>
  domain.competences.reduce((sum, c) => sum + c.outcomes.length, 0)

const getCompetenceTitle = (id: string) => OFFICIAL_TITLES[id] || id

const toggleDomain = (id: string) => {
  const index = expandedDomains.value.indexOf(id)
  if (index === -1) {
    expandedDomains.value.push(id)
  } else {
    expandedDomains.value.splice(index, 1)
  }
}

const toggleCompetence = (id: string) => {
  const index = expandedCompetences.value.indexOf(id)
  if (index === -1) {
    expandedCompetences.value.push(id)
  } else {
    expandedCompetences.value.splice(index, 1)
  }
}

const selectOutcome = (outcome: LearningOutcome) => {
  selectedOutcome.value = outcome
}

const levelClass = (level: string) => {
  const classes: Record<string, string> = {
    'Basic': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'Advanced': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'Highly advanced': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[level] || 'bg-gray-100 text-gray-800'
}

const levelShort = (level: string) => {
  const shorts: Record<string, string> = {
    'Basic': 'B',
    'Intermediate': 'I',
    'Advanced': 'A',
    'Highly advanced': 'H'
  }
  return shorts[level] || '?'
}

const statusColor = (status: string | undefined) => {
  const colors: Record<string, string> = {
    'none': 'bg-gray-200 dark:bg-gray-600',
    'draft': 'bg-yellow-400',
    'review': 'bg-blue-400',
    'validated': 'bg-green-400',
    'obsolete': 'bg-red-400'
  }
  return colors[status || 'none']
}

const navigateToOutcome = () => {
  if (selectedOutcome.value) {
    // Navigate to L1 by default
    router.push('/l1')
    emit('close')
    // TODO: Scroll to specific outcome
  }
}

const copyOutcomeId = async () => {
  if (selectedOutcome.value) {
    await navigator.clipboard.writeText(selectedOutcome.value.id)
    success('ID copié dans le presse-papier')
  }
}
</script>
