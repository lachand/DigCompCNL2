<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
      <h1 class="text-3xl font-bold mb-2">Vue d'ensemble</h1>
      <p class="text-indigo-100">Visualisez toutes les compétences DigComp 3.0 sur les trois années</p>
    </div>

    <!-- Global Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 dark:text-white">Progression globale</h3>
          <i class="ph ph-chart-line text-2xl text-indigo-600 dark:text-indigo-400"></i>
        </div>
        <div class="space-y-3">
          <div v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])" :key="year">
            <div class="flex items-center justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">{{ year }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ getYearCoverage(year) }}%</span>
            </div>
            <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="yearColor(year)"
                :style="{ width: getYearCoverage(year) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 dark:text-white">Par niveau de difficulté</h3>
          <i class="ph ph-star text-2xl text-yellow-600 dark:text-yellow-400"></i>
        </div>
        <div class="space-y-2">
          <div v-for="level in levelStats" :key="level.name" class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">{{ level.name }}</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ level.count }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 dark:text-white">Ressources</h3>
          <i class="ph ph-books text-2xl text-green-600 dark:text-green-400"></i>
        </div>
        <div class="space-y-3">
          <div>
            <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ totalResources }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Ressources totales</p>
          </div>
          <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400">Moyenne par compétence</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ avgResourcesPerOutcome }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Matrix View -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white">Matrice de couverture</h3>
        <div class="flex items-center gap-2 text-xs">
          <span class="flex items-center gap-1">
            <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">Non traité</span>
          </span>
          <span class="flex items-center gap-1">
            <div class="w-4 h-4 bg-yellow-300 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">Brouillon</span>
          </span>
          <span class="flex items-center gap-1">
            <div class="w-4 h-4 bg-blue-400 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">En révision</span>
          </span>
          <span class="flex items-center gap-1">
            <div class="w-4 h-4 bg-green-500 rounded"></div>
            <span class="text-gray-600 dark:text-gray-400">Validé</span>
          </span>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Compétence</th>
              <th class="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">L1</th>
              <th class="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">L2</th>
              <th class="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">L3</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="domain in competencesStore.digCompData.domains" :key="domain.id">
              <tr class="bg-gray-50 dark:bg-gray-700/50">
                <td colspan="4" class="py-2 px-4 font-semibold text-sm text-gray-900 dark:text-white">
                  {{ domain.name }}
                </td>
              </tr>
              <template v-for="competence in domain.competences" :key="competence.id">
                <tr v-for="outcome in competence.outcomes" :key="outcome.id" class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="py-2 px-4">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-sm text-gray-900 dark:text-white">{{ outcome.id }}</span>
                      <span class="text-xs px-2 py-0.5 rounded" :class="getLevelClass(outcome.level)">
                        {{ outcome.level.substring(0, 1) }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-600 dark:text-gray-400 truncate max-w-md">{{ outcome.description }}</p>
                  </td>
                  <td class="py-2 px-4 text-center">
                    <button
                      @click="cycleStatus(outcome.id, 'L1')"
                      class="inline-block w-8 h-8 rounded cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
                      :class="getStatusColor(outcome.mappings.L1.status)"
                      :title="`${outcome.mappings.L1.status} - Cliquez pour changer`"
                    ></button>
                  </td>
                  <td class="py-2 px-4 text-center">
                    <button
                      @click="cycleStatus(outcome.id, 'L2')"
                      class="inline-block w-8 h-8 rounded cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
                      :class="getStatusColor(outcome.mappings.L2.status)"
                      :title="`${outcome.mappings.L2.status} - Cliquez pour changer`"
                    ></button>
                  </td>
                  <td class="py-2 px-4 text-center">
                    <button
                      @click="cycleStatus(outcome.id, 'L3')"
                      class="inline-block w-8 h-8 rounded cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
                      :class="getStatusColor(outcome.mappings.L3.status)"
                      :title="`${outcome.mappings.L3.status} - Cliquez pour changer`"
                    ></button>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Heatmap by Domain -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="domain in competencesStore.digCompData.domains"
        :key="domain.id"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
      >
        <h4 class="font-semibold text-gray-900 dark:text-white mb-4">{{ domain.name }}</h4>
        <div class="space-y-2">
          <div v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])" :key="year">
            <div class="flex items-center justify-between text-sm mb-1">
              <span class="text-gray-600 dark:text-gray-400">{{ year }}</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ getDomainYearCoverage(domain.id, year) }}%</span>
            </div>
            <div class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="yearColor(year)"
                :style="{ width: getDomainYearCoverage(domain.id, year) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import type { YearLevel, StatusType, LevelType } from '@/types'

const competencesStore = useCompetencesStore()

// Status cycle order
const STATUS_CYCLE: StatusType[] = ['none', 'draft', 'review', 'validated', 'obsolete']

const cycleStatus = async (outcomeId: string, year: YearLevel) => {
  const outcome = competencesStore.allOutcomes.find(o => o.id === outcomeId)
  if (!outcome) return

  const currentStatus = outcome.mappings[year].status
  const currentIndex = STATUS_CYCLE.indexOf(currentStatus)
  const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length
  const nextStatus = STATUS_CYCLE[nextIndex]

  await competencesStore.updateMappingField(outcomeId, year, 'status', nextStatus)
}

const getYearCoverage = (year: YearLevel) => {
  const allOutcomes = competencesStore.allOutcomes
  const validated = allOutcomes.filter(o => o.mappings[year].status === 'validated').length
  return Math.round((validated / allOutcomes.length) * 100)
}

const getDomainYearCoverage = (domainId: string, year: YearLevel) => {
  const domain = competencesStore.digCompData.domains.find(d => d.id === domainId)
  if (!domain) return 0

  const outcomes = domain.competences.flatMap(c => c.outcomes)
  const validated = outcomes.filter(o => o.mappings[year].status === 'validated').length
  return Math.round((validated / outcomes.length) * 100)
}

const levelStats = computed(() => {
  const allOutcomes = competencesStore.allOutcomes
  const levels: LevelType[] = ['Basic', 'Intermediate', 'Advanced', 'Highly advanced']

  return levels.map(level => ({
    name: level,
    count: allOutcomes.filter(o => o.level === level).length
  }))
})

const totalResources = computed(() => {
  return competencesStore.allOutcomes.reduce((sum, o) => {
    return sum +
      (o.mappings.L1.resources?.length || 0) +
      (o.mappings.L2.resources?.length || 0) +
      (o.mappings.L3.resources?.length || 0)
  }, 0)
})

const avgResourcesPerOutcome = computed(() => {
  const total = competencesStore.allOutcomes.length * 3 // 3 years
  return (totalResources.value / total).toFixed(1)
})

const yearColor = (year: YearLevel) => {
  const colors = {
    L1: 'bg-blue-500',
    L2: 'bg-purple-500',
    L3: 'bg-pink-500'
  }
  return colors[year]
}

const getStatusColor = (status: StatusType) => {
  const colors = {
    none: 'bg-gray-200 dark:bg-gray-700',
    draft: 'bg-yellow-300',
    review: 'bg-blue-400',
    validated: 'bg-green-500',
    obsolete: 'bg-red-400'
  }
  return colors[status]
}

const getLevelClass = (level: LevelType) => {
  const classes = {
    'Basic': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'Advanced': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'Highly advanced': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[level]
}
</script>
