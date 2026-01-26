<template>
  <div class="space-y-6">
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Total compétences"
        :value="kpis.totalOutcomes"
        icon="ph-graduation-cap"
        variant="primary"
      />
      <KPICard
        title="Couverture L1"
        :value="kpis.coverageL1 + '%'"
        :subtitle="`${kpis.validatedL1} / ${kpis.totalOutcomes}`"
        icon="ph-chart-pie"
        variant="success"
        :progress="kpis.coverageL1"
      />
      <KPICard
        title="Couverture L2"
        :value="kpis.coverageL2 + '%'"
        :subtitle="`${kpis.validatedL2} / ${kpis.totalOutcomes}`"
        icon="ph-chart-pie"
        variant="warning"
        :progress="kpis.coverageL2"
      />
      <KPICard
        title="Couverture L3"
        :value="kpis.coverageL3 + '%'"
        :subtitle="`${kpis.validatedL3} / ${kpis.totalOutcomes}`"
        icon="ph-chart-pie"
        variant="danger"
        :progress="kpis.coverageL3"
      />
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Status Distribution -->
      <ProgressChart
        title="Distribution par statut"
        type="doughnut"
        :data="statusChartData"
      />

      <!-- Yearly Comparison -->
      <ProgressChart
        title="Comparaison annuelle"
        type="bar"
        :data="yearlyComparisonData"
      />
    </div>

    <!-- Domain Coverage -->
    <ProgressChart
      title="Couverture par domaine"
      type="bar"
      :data="domainCoverageData"
    />

    <!-- Sunburst -->
    <SunburstChart
      title="Vue d'ensemble hiérarchique"
      :data="competencesStore.digCompData"
    />

    <!-- Activity Feed -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Aperçu rapide</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Ressources totales</p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ kpis.totalResources }}</p>
            </div>
            <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Commentaires</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ kpis.totalComments }}</p>
            </div>
            <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Assignations</p>
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ kpis.totalAssignments }}</p>
            </div>
            <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Tags utilisés</p>
              <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ kpis.uniqueTags }}</p>
            </div>
          </div>
        </div>
      </div>

      <ActivityFeed />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import KPICard from '@/components/dashboard/KPICard.vue'
import ProgressChart from '@/components/dashboard/ProgressChart.vue'
import SunburstChart from '@/components/dashboard/SunburstChart.vue'
import ActivityFeed from '@/components/history/ActivityFeed.vue'
import type { YearLevel } from '@/types'

const competencesStore = useCompetencesStore()

const kpis = computed(() => {
  const allOutcomes = competencesStore.allOutcomes

  const getValidatedCount = (year: YearLevel) => {
    return allOutcomes.filter(o => o.mappings[year].status === 'validated').length
  }

  const totalResources = allOutcomes.reduce((sum, o) => {
    return sum +
      (o.mappings.L1.resources?.length || 0) +
      (o.mappings.L2.resources?.length || 0) +
      (o.mappings.L3.resources?.length || 0)
  }, 0)

  const totalComments = allOutcomes.reduce((sum, o) => sum + (o.comments?.length || 0), 0)
  const totalAssignments = allOutcomes.reduce((sum, o) => sum + (o.assignees?.length || 0), 0)
  const uniqueTags = new Set(allOutcomes.flatMap(o => o.tags || [])).size

  const validatedL1 = getValidatedCount('L1')
  const validatedL2 = getValidatedCount('L2')
  const validatedL3 = getValidatedCount('L3')

  return {
    totalOutcomes: allOutcomes.length,
    validatedL1,
    validatedL2,
    validatedL3,
    coverageL1: Math.round((validatedL1 / allOutcomes.length) * 100),
    coverageL2: Math.round((validatedL2 / allOutcomes.length) * 100),
    coverageL3: Math.round((validatedL3 / allOutcomes.length) * 100),
    totalResources,
    totalComments,
    totalAssignments,
    uniqueTags
  }
})

const statusChartData = computed(() => {
  const allOutcomes = competencesStore.allOutcomes
  const statusCounts: Record<string, number> = {
    none: 0,
    draft: 0,
    review: 0,
    validated: 0,
    obsolete: 0
  }

  allOutcomes.forEach(o => {
    ;(['L1', 'L2', 'L3'] as YearLevel[]).forEach(year => {
      statusCounts[o.mappings[year].status]++
    })
  })

  return {
    labels: ['Non traité', 'Brouillon', 'En révision', 'Validé', 'Obsolète'],
    datasets: [{
      label: 'Nombre',
      data: Object.values(statusCounts),
      backgroundColor: ['#9ca3af', '#facc15', '#3b82f6', '#22c55e', '#ef4444']
    }]
  }
})

const yearlyComparisonData = computed(() => {
  const allOutcomes = competencesStore.allOutcomes

  const getData = (year: YearLevel) => {
    return {
      none: allOutcomes.filter(o => o.mappings[year].status === 'none').length,
      draft: allOutcomes.filter(o => o.mappings[year].status === 'draft').length,
      review: allOutcomes.filter(o => o.mappings[year].status === 'review').length,
      validated: allOutcomes.filter(o => o.mappings[year].status === 'validated').length,
      obsolete: allOutcomes.filter(o => o.mappings[year].status === 'obsolete').length
    }
  }

  const l1 = getData('L1')
  const l2 = getData('L2')
  const l3 = getData('L3')

  return {
    labels: ['Non traité', 'Brouillon', 'En révision', 'Validé', 'Obsolète'],
    datasets: [
      { label: 'L1', data: Object.values(l1), backgroundColor: '#3b82f6' },
      { label: 'L2', data: Object.values(l2), backgroundColor: '#8b5cf6' },
      { label: 'L3', data: Object.values(l3), backgroundColor: '#ec4899' }
    ]
  }
})

const domainCoverageData = computed(() => {
  const domains = competencesStore.digCompData.domains

  const labels = domains.map(d => d.name)
  const l1Data: number[] = []
  const l2Data: number[] = []
  const l3Data: number[] = []

  domains.forEach(domain => {
    const outcomes = domain.competences.flatMap(c => c.outcomes)
    const total = outcomes.length

    l1Data.push(Math.round((outcomes.filter(o => o.mappings.L1.status === 'validated').length / total) * 100))
    l2Data.push(Math.round((outcomes.filter(o => o.mappings.L2.status === 'validated').length / total) * 100))
    l3Data.push(Math.round((outcomes.filter(o => o.mappings.L3.status === 'validated').length / total) * 100))
  })

  return {
    labels,
    datasets: [
      { label: 'L1', data: l1Data, backgroundColor: '#3b82f6' },
      { label: 'L2', data: l2Data, backgroundColor: '#8b5cf6' },
      { label: 'L3', data: l3Data, backgroundColor: '#ec4899' }
    ]
  }
})
</script>
