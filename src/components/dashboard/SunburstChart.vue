<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ title }}</h3>
    <div ref="chartContainer" class="w-full" style="height: 500px;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import Plotly from 'plotly.js-dist-min'
import type { DigCompData } from '@/types'

interface Props {
  title: string
  data: DigCompData
}

const props = defineProps<Props>()

const chartContainer = ref<HTMLDivElement>()

const createChart = () => {
  if (!chartContainer.value || !props.data.domains || props.data.domains.length === 0) return

  const labels: string[] = []
  const parents: string[] = []
  const values: number[] = []
  const colors: string[] = []

  const domainColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']

  props.data.domains.forEach((domain, dIdx) => {
    labels.push(domain.name)
    parents.push('')

    // Calculate total outcomes in this domain
    const domainTotal = domain.competences.reduce((sum, comp) => sum + comp.outcomes.length, 0)
    values.push(domainTotal)
    colors.push(domainColors[dIdx % domainColors.length])

    domain.competences.forEach(comp => {
      labels.push(comp.name)
      parents.push(domain.name)
      values.push(comp.outcomes.length)
      colors.push(domainColors[dIdx % domainColors.length])

      comp.outcomes.forEach(outcome => {
        labels.push(outcome.id)
        parents.push(comp.name)
        values.push(1)
        colors.push(domainColors[dIdx % domainColors.length])
      })
    })
  })

  const isDark = document.documentElement.classList.contains('dark')

  const plotData: any = [{
    type: 'sunburst',
    labels,
    parents,
    values,
    marker: {
      colors
    },
    branchvalues: 'total',
    hovertemplate: '<b>%{label}</b><br>Éléments: %{value}<extra></extra>'
  }]

  const layout: any = {
    margin: { l: 0, r: 0, t: 0, b: 0 },
    paper_bgcolor: isDark ? '#1f2937' : '#ffffff',
    font: {
      color: isDark ? '#e5e7eb' : '#374151'
    }
  }

  Plotly.newPlot(chartContainer.value, plotData, layout, { responsive: true })
}

onMounted(() => {
  createChart()

  const observer = new MutationObserver(() => {
    createChart()
  })
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
})

watch(() => props.data, () => {
  createChart()
}, { deep: true })
</script>
