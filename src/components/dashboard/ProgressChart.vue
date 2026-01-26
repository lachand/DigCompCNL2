<template>
  <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">{{ title }}</h3>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface Props {
  title: string
  type?: 'bar' | 'line' | 'doughnut' | 'pie'
  data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string
      borderWidth?: number
    }>
  }
}

const props = withDefaults(defineProps<Props>(), {
  type: 'bar'
})

const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const createChart = () => {
  if (!chartCanvas.value) return

  if (chart) {
    chart.destroy()
  }

  const isDark = document.documentElement.classList.contains('dark')
  const textColor = isDark ? '#e5e7eb' : '#374151'
  const gridColor = isDark ? '#374151' : '#e5e7eb'

  chart = new Chart(chartCanvas.value, {
    type: props.type,
    data: props.data,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: props.type === 'bar' || props.type === 'line' ? {
        y: {
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor
          }
        }
      } : undefined
    }
  })
}

onMounted(() => {
  createChart()

  // Watch for dark mode changes
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
