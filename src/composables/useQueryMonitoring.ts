// Monitoring des performances et des requêtes
import { ref, reactive, computed } from 'vue'

interface QueryMetrics {
  endpoint: string
  count: number
  totalTime: number
  averageTime: number
  lastCall: number
  errors: number
}

interface PerformanceMetrics {
  totalQueries: number
  totalTime: number
  averageResponseTime: number
  errorRate: number
  cacheHitRate: number
  queriesPerMinute: number
}

class QueryMonitor {
  private queries = reactive<Map<string, QueryMetrics>>(new Map())
  private cacheHits = ref(0)
  private cacheMisses = ref(0)
  private startTime = Date.now()

  trackQuery(endpoint: string, responseTime: number, isError = false) {
    const existing = this.queries.get(endpoint)
    
    if (existing) {
      existing.count++
      existing.totalTime += responseTime
      existing.averageTime = existing.totalTime / existing.count
      existing.lastCall = Date.now()
      if (isError) existing.errors++
    } else {
      this.queries.set(endpoint, {
        endpoint,
        count: 1,
        totalTime: responseTime,
        averageTime: responseTime,
        lastCall: Date.now(),
        errors: isError ? 1 : 0
      })
    }
  }

  trackCacheHit() {
    this.cacheHits.value++
  }

  trackCacheMiss() {
    this.cacheMisses.value++
  }

  getMetrics(): PerformanceMetrics {
    const totalQueries = Array.from(this.queries.values())
      .reduce((sum, q) => sum + q.count, 0)
    
    const totalTime = Array.from(this.queries.values())
      .reduce((sum, q) => sum + q.totalTime, 0)
    
    const totalErrors = Array.from(this.queries.values())
      .reduce((sum, q) => sum + q.errors, 0)

    const totalCacheRequests = this.cacheHits.value + this.cacheMisses.value
    const elapsedMinutes = (Date.now() - this.startTime) / (1000 * 60)

    return {
      totalQueries,
      totalTime,
      averageResponseTime: totalQueries > 0 ? totalTime / totalQueries : 0,
      errorRate: totalQueries > 0 ? (totalErrors / totalQueries) * 100 : 0,
      cacheHitRate: totalCacheRequests > 0 ? (this.cacheHits.value / totalCacheRequests) * 100 : 0,
      queriesPerMinute: elapsedMinutes > 0 ? totalQueries / elapsedMinutes : 0
    }
  }

  getTopQueries(limit = 10) {
    return Array.from(this.queries.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  getSlowestQueries(limit = 10) {
    return Array.from(this.queries.values())
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit)
  }

  reset() {
    this.queries.clear()
    this.cacheHits.value = 0
    this.cacheMisses.value = 0
    this.startTime = Date.now()
  }
}

const queryMonitor = new QueryMonitor()

export function useQueryMonitoring() {
  const isMonitoring = ref(true)
  
  const wrapQuery = async <T>(
    endpoint: string,
    queryFn: () => Promise<T>,
    useCache = false
  ): Promise<T> => {
    if (!isMonitoring.value) {
      return queryFn()
    }

    const startTime = performance.now()
    let isError = false

    try {
      const result = await queryFn()
      
      if (useCache) {
        queryMonitor.trackCacheHit()
      } else {
        queryMonitor.trackCacheMiss()
      }
      
      return result
    } catch (error) {
      isError = true
      throw error
    } finally {
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      queryMonitor.trackQuery(endpoint, responseTime, isError)
      
      // Loguer les requêtes lentes (>1s)
      if (responseTime > 1000) {
        console.warn(`⚠️ Requête lente détectée: ${endpoint} (${responseTime.toFixed(2)}ms)`)
      }
    }
  }

  const metrics = computed(() => queryMonitor.getMetrics())
  const topQueries = computed(() => queryMonitor.getTopQueries())
  const slowestQueries = computed(() => queryMonitor.getSlowestQueries())

  const generateReport = () => {
    const currentMetrics = metrics.value
    const report = {
      timestamp: new Date().toISOString(),
      summary: currentMetrics,
      topQueries: topQueries.value,
      slowestQueries: slowestQueries.value,
      recommendations: generateRecommendations(currentMetrics)
    }
    
    console.log('📊 Rapport de performance Firestore:', report)
    return report
  }

  const generateRecommendations = (metrics: PerformanceMetrics): string[] => {
    const recommendations: string[] = []
    
    if (metrics.queriesPerMinute > 60) {
      recommendations.push('⚠️ Taux de requêtes élevé - Considérer plus de cache/polling')
    }
    
    if (metrics.averageResponseTime > 500) {
      recommendations.push('🐌 Temps de réponse lent - Vérifier les index Firestore')
    }
    
    if (metrics.errorRate > 5) {
      recommendations.push('❌ Taux d\'erreur élevé - Vérifier la connectivité/permissions')
    }
    
    if (metrics.cacheHitRate < 30) {
      recommendations.push('📦 Cache peu utilisé - Augmenter la mise en cache')
    }
    
    return recommendations
  }

  const toggleMonitoring = () => {
    isMonitoring.value = !isMonitoring.value
  }

  const resetMetrics = () => {
    queryMonitor.reset()
  }

  return {
    wrapQuery,
    metrics,
    topQueries,
    slowestQueries,
    generateReport,
    toggleMonitoring,
    resetMetrics,
    isMonitoring
  }
}