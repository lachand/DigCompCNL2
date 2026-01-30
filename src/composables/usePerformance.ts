// Composable pour la performance et l'optimisation
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

export interface PerformanceMetrics {
  // Core Web Vitals
  LCP?: number  // Largest Contentful Paint
  FID?: number  // First Input Delay
  CLS?: number  // Cumulative Layout Shift
  
  // Additional metrics
  FCP?: number  // First Contentful Paint
  TTFB?: number // Time to First Byte
  
  // Custom metrics
  routeChangeTime?: number
  componentMountTime?: Record<string, number>
  apiResponseTime?: Record<string, number>
}

export function usePerformance() {
  const metrics = ref<PerformanceMetrics>({})
  const isSupported = ref(false)
  const observer = ref<PerformanceObserver | null>(null)
  
  // Check if Performance API is supported
  const checkSupport = () => {
    isSupported.value = 
      'performance' in window && 
      'PerformanceObserver' in window &&
      'getEntriesByType' in performance
  }
  
  // Measure Core Web Vitals
  const measureCoreWebVitals = () => {
    if (!isSupported.value) return
    
    try {
      // LCP - Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        metrics.value.LCP = Math.round(lastEntry.startTime)
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      
      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          metrics.value.FID = Math.round(entry.processingStart - entry.startTime)
        })
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      
      // CLS - Cumulative Layout Shift
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            metrics.value.CLS = Math.round(clsValue * 1000) / 1000
          }
        })
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      
    } catch (error) {
      console.warn('[Performance] Error setting up Core Web Vitals:', error)
    }
  }
  
  // Measure navigation timing
  const measureNavigationTiming = () => {
    if (!isSupported.value) return
    
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        metrics.value.FCP = Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart)
        metrics.value.TTFB = Math.round(navigation.responseStart - navigation.fetchStart)
      }
    } catch (error) {
      console.warn('[Performance] Error measuring navigation timing:', error)
    }
  }
  
  // Measure route change time
  const measureRouteChange = (startTime: number) => {
    nextTick(() => {
      const endTime = performance.now()
      metrics.value.routeChangeTime = Math.round(endTime - startTime)
    })
  }
  
  // Measure component mount time
  const measureComponentMount = (componentName: string, startTime: number) => {
    nextTick(() => {
      const endTime = performance.now()
      const mountTime = Math.round(endTime - startTime)
      
      // Store per-component metrics
      if (!metrics.value.componentMountTime) {
        metrics.value.componentMountTime = {}
      }
      
      metrics.value.componentMountTime[componentName] = mountTime
    })
  }
  
  // Measure API response time
  const measureApiCall = async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)
      
      // Store per-endpoint metrics
      if (!metrics.value.apiResponseTime) {
        metrics.value.apiResponseTime = {}
      }
      
      metrics.value.apiResponseTime[endpoint] = responseTime
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)
      
      if (!metrics.value.apiResponseTime) {
        metrics.value.apiResponseTime = {}
      }
      
      metrics.value.apiResponseTime[`${endpoint}_error`] = responseTime
      
      throw error
    }
  }
  
  // Get performance score based on Core Web Vitals
  const performanceScore = computed(() => {
    const { LCP, FID, CLS } = metrics.value
    
    if (!LCP && !FID && !CLS) return null
    
    let score = 100
    
    // LCP scoring (target: <2.5s)
    if (LCP) {
      if (LCP > 4000) score -= 40
      else if (LCP > 2500) score -= 20
    }
    
    // FID scoring (target: <100ms)
    if (FID) {
      if (FID > 300) score -= 30
      else if (FID > 100) score -= 15
    }
    
    // CLS scoring (target: <0.1)
    if (CLS) {
      if (CLS > 0.25) score -= 30
      else if (CLS > 0.1) score -= 15
    }
    
    return Math.max(0, score)
  })
  
  // Get performance grade
  const performanceGrade = computed(() => {
    const score = performanceScore.value
    
    if (score === null) return 'N/A'
    if (score >= 90) return 'A'
    if (score >= 75) return 'B'
    if (score >= 60) return 'C'
    if (score >= 40) return 'D'
    return 'F'
  })
  
  // Resource timing analysis
  const analyzeResources = () => {
    if (!isSupported.value) return []
    
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    return resources.map(resource => ({
      name: resource.name,
      type: getResourceType(resource.name),
      size: resource.transferSize || 0,
      duration: Math.round(resource.duration),
      blocked: Math.round(resource.domainLookupStart - resource.fetchStart),
      dns: Math.round(resource.domainLookupEnd - resource.domainLookupStart),
      connect: Math.round(resource.connectEnd - resource.connectStart),
      send: Math.round(resource.responseStart - resource.requestStart),
      wait: Math.round(resource.responseEnd - resource.responseStart),
      receive: Math.round(resource.responseEnd - resource.responseStart)
    })).sort((a, b) => b.duration - a.duration)
  }
  
  // Determine resource type from URL
  const getResourceType = (url: string): string => {
    const extension = url.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return 'image'
    }
    if (['js'].includes(extension || '')) {
      return 'script'
    }
    if (['css'].includes(extension || '')) {
      return 'stylesheet'
    }
    if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) {
      return 'font'
    }
    if (url.includes('/api/') || url.includes('.json')) {
      return 'xhr'
    }
    
    return 'other'
  }
  
  // Memory usage analysis
  const getMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) // MB
      }
    }
    return null
  }
  
  // Bundle analysis helper
  const analyzeBundleSize = async () => {
    if (!isSupported.value) return null
    
    const resources = analyzeResources()
    const jsResources = resources.filter(r => r.type === 'script')
    const cssResources = resources.filter(r => r.type === 'stylesheet')
    
    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0)
    const totalCssSize = cssResources.reduce((sum, r) => sum + r.size, 0)
    
    return {
      javascript: {
        count: jsResources.length,
        totalSize: Math.round(totalJsSize / 1024), // KB
        largest: jsResources[0] || null
      },
      css: {
        count: cssResources.length,
        totalSize: Math.round(totalCssSize / 1024), // KB
        largest: cssResources[0] || null
      }
    }
  }
  
  // Performance recommendations
  const getRecommendations = () => {
    const recommendations: string[] = []
    const { LCP, FID, CLS } = metrics.value
    
    if (LCP && LCP > 2500) {
      recommendations.push('Optimize Largest Contentful Paint - compress images, use WebP format, implement lazy loading')
    }
    
    if (FID && FID > 100) {
      recommendations.push('Improve First Input Delay - reduce JavaScript execution time, use web workers')
    }
    
    if (CLS && CLS > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift - set image dimensions, avoid dynamic content injection')
    }
    
    const resources = analyzeResources()
    const largeImages = resources.filter(r => r.type === 'image' && r.size > 500 * 1024)
    
    if (largeImages.length > 0) {
      recommendations.push(`Optimize ${largeImages.length} large image(s) - compress and use modern formats`)
    }
    
    return recommendations
  }
  
  // Start monitoring
  const startMonitoring = () => {
    checkSupport()
    
    if (isSupported.value) {
      measureCoreWebVitals()
      measureNavigationTiming()
    }
  }
  
  // Stop monitoring
  const stopMonitoring = () => {
    if (observer.value) {
      observer.value.disconnect()
    }
  }
  
  // Report performance data (could send to analytics)
  const reportPerformance = () => {
    const report = {
      metrics: metrics.value,
      score: performanceScore.value,
      grade: performanceGrade.value,
      resources: analyzeResources().slice(0, 10), // Top 10 slowest
      memory: getMemoryUsage(),
      recommendations: getRecommendations(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    console.log('[Performance] Report:', report)
    
    // Here you could send to your analytics service
    // analytics.track('performance_report', report)
    
    return report
  }
  
  onMounted(() => {
    startMonitoring()
  })
  
  onUnmounted(() => {
    stopMonitoring()
  })
  
  return {
    // State
    metrics: computed(() => metrics.value),
    performanceScore,
    performanceGrade,
    isSupported,
    
    // Methods
    measureRouteChange,
    measureComponentMount,
    measureApiCall,
    analyzeResources,
    analyzeBundleSize,
    getMemoryUsage,
    getRecommendations,
    reportPerformance,
    
    // Control
    startMonitoring,
    stopMonitoring
  }
}