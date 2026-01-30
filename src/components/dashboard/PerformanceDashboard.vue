<template>
  <div class="performance-dashboard p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
          Performance Dashboard
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          Analyse des performances et métriques de votre application
        </p>
      </div>
      <div class="flex items-center space-x-3">
        <button
          @click="reportPerformance"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Icon name="arrow-path" class="w-4 h-4 mr-2" />
          Actualiser
        </button>
      </div>
    </div>

    <!-- Performance Score -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Score Général
          </h3>
          <div 
            :class="[
              'text-2xl font-bold',
              performanceGrade === 'A' ? 'text-green-500' :
              performanceGrade === 'B' ? 'text-blue-500' :
              performanceGrade === 'C' ? 'text-yellow-500' :
              performanceGrade === 'D' ? 'text-orange-500' :
              'text-red-500'
            ]"
          >
            {{ performanceGrade }}
          </div>
        </div>
        <div class="flex items-center">
          <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
            <div 
              class="h-2 rounded-full transition-all duration-500"
              :class="performanceGrade === 'A' ? 'bg-green-500' :
                     performanceGrade === 'B' ? 'bg-blue-500' :
                     performanceGrade === 'C' ? 'bg-yellow-500' :
                     performanceGrade === 'D' ? 'bg-orange-500' :
                     'bg-red-500'"
              :style="{ width: `${performanceScore || 0}%` }"
            />
          </div>
          <span class="text-sm font-medium text-gray-600 dark:text-gray-400">
            {{ performanceScore || 0 }}/100
          </span>
        </div>
      </div>

      <!-- Core Web Vitals -->
      <div class="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Core Web Vitals
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- LCP -->
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ metrics.LCP ? `${metrics.LCP}ms` : 'N/A' }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Largest Contentful Paint
            </div>
            <div 
              :class="[
                'mt-2 text-xs font-medium',
                !metrics.LCP ? 'text-gray-400' :
                metrics.LCP <= 2500 ? 'text-green-500' :
                metrics.LCP <= 4000 ? 'text-yellow-500' :
                'text-red-500'
              ]"
            >
              {{ !metrics.LCP ? 'Mesure en cours...' :
                  metrics.LCP <= 2500 ? 'Excellent' :
                  metrics.LCP <= 4000 ? 'À améliorer' :
                  'Critique' }}
            </div>
          </div>

          <!-- FID -->
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ metrics.FID ? `${metrics.FID}ms` : 'N/A' }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              First Input Delay
            </div>
            <div 
              :class="[
                'mt-2 text-xs font-medium',
                !metrics.FID ? 'text-gray-400' :
                metrics.FID <= 100 ? 'text-green-500' :
                metrics.FID <= 300 ? 'text-yellow-500' :
                'text-red-500'
              ]"
            >
              {{ !metrics.FID ? 'Mesure en cours...' :
                  metrics.FID <= 100 ? 'Excellent' :
                  metrics.FID <= 300 ? 'À améliorer' :
                  'Critique' }}
            </div>
          </div>

          <!-- CLS -->
          <div class="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ metrics.CLS ? metrics.CLS.toFixed(3) : 'N/A' }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Cumulative Layout Shift
            </div>
            <div 
              :class="[
                'mt-2 text-xs font-medium',
                !metrics.CLS ? 'text-gray-400' :
                metrics.CLS <= 0.1 ? 'text-green-500' :
                metrics.CLS <= 0.25 ? 'text-yellow-500' :
                'text-red-500'
              ]"
            >
              {{ !metrics.CLS ? 'Mesure en cours...' :
                  metrics.CLS <= 0.1 ? 'Excellent' :
                  metrics.CLS <= 0.25 ? 'À améliorer' :
                  'Critique' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Resource Analysis -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Bundle Analysis -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Analyse du Bundle
        </h3>
        <div v-if="bundleAnalysis" class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">JavaScript</span>
            <div class="text-right">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ bundleAnalysis.javascript.totalSize }} KB
              </span>
              <span class="text-xs text-gray-500 ml-2">
                ({{ bundleAnalysis.javascript.count }} fichiers)
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">CSS</span>
            <div class="text-right">
              <span class="text-sm font-medium text-gray-900 dark:text-white">
                {{ bundleAnalysis.css.totalSize }} KB
              </span>
              <span class="text-xs text-gray-500 ml-2">
                ({{ bundleAnalysis.css.count }} fichiers)
              </span>
            </div>
          </div>
        </div>
        <LoadingSkeleton v-else height="80px" />
      </div>

      <!-- Memory Usage -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Utilisation Mémoire
        </h3>
        <div v-if="memoryUsage" class="space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Heap utilisé</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ memoryUsage.usedJSHeapSize }} MB
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Heap total</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ memoryUsage.totalJSHeapSize }} MB
            </span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600 dark:text-gray-400">Limite</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ memoryUsage.jsHeapSizeLimit }} MB
            </span>
          </div>
          
          <!-- Memory usage bar -->
          <div class="mt-4">
            <div class="flex justify-between text-xs text-gray-500 mb-1">
              <span>Utilisation mémoire</span>
              <span>{{ Math.round((memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100) }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                class="bg-blue-500 h-2 rounded-full transition-all duration-500"
                :style="{ width: `${Math.min((memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100, 100)}%` }"
              />
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500">
          Informations mémoire non disponibles
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div v-if="recommendations.length > 0" class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recommandations d'optimisation
      </h3>
      <div class="space-y-3">
        <div 
          v-for="(recommendation, index) in recommendations" 
          :key="index"
          class="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
        >
          <Icon name="light-bulb" class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            {{ recommendation }}
          </p>
        </div>
      </div>
    </div>

    <!-- Resource Timeline -->
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Ressources les plus lentes
      </h3>
      <div class="space-y-2">
        <div 
          v-for="resource in topSlowResources" 
          :key="resource.name"
          class="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ resource.name.split('/').pop() }}
            </div>
            <div class="text-xs text-gray-500">
              {{ resource.type }} • {{ Math.round(resource.size / 1024) }} KB
            </div>
          </div>
          <div class="text-sm font-medium text-gray-600 dark:text-gray-400 ml-4">
            {{ resource.duration }}ms
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Icon from '@/components/common/Icon.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import { usePerformance } from '@/composables/usePerformance'

const {
  metrics,
  performanceScore,
  performanceGrade,
  analyzeResources,
  analyzeBundleSize,
  getMemoryUsage,
  getRecommendations,
  reportPerformance
} = usePerformance()

const bundleAnalysis = ref(null)
const memoryUsage = ref(null)
const resources = ref([])

const recommendations = computed(() => getRecommendations())

const topSlowResources = computed(() => {
  return resources.value
    .slice(0, 10) // Top 10 slowest
    .filter(r => r.duration > 50) // Only show resources taking more than 50ms
})

const loadAnalytics = async () => {
  try {
    // Load bundle analysis
    bundleAnalysis.value = await analyzeBundleSize()
    
    // Get memory usage
    memoryUsage.value = getMemoryUsage()
    
    // Get resource analysis
    resources.value = analyzeResources()
  } catch (error) {
    console.error('[Performance] Error loading analytics:', error)
  }
}

onMounted(() => {
  loadAnalytics()
})
</script>