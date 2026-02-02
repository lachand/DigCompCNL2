// Composable pour le chargement progressif du dashboard
import { ref, computed, onMounted, nextTick } from 'vue'
import { useConditionalLoading } from './useConditionalLoading'
import { useStaticCache } from './useStaticCache'

interface DashboardWidget {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  loadOnVisible: boolean
  cacheKey?: string
  cacheTimeMinutes?: number
}

export function useDashboardLoading() {
  const { registerComponent, isComponentVisible } = useConditionalLoading()
  const staticCache = useStaticCache()
  
  const widgets = ref<Record<string, DashboardWidget>>({})
  const loadedWidgets = ref<Set<string>>(new Set())
  const loadingWidgets = ref<Set<string>>(new Set())
  
  // Configuration des widgets
  const widgetConfigs: DashboardWidget[] = [
    {
      id: 'kpi-cards',
      title: 'KPI Cards', 
      priority: 'high',
      loadOnVisible: false, // Toujours charger
      cacheKey: 'dashboard_kpis',
      cacheTimeMinutes: 30
    },
    {
      id: 'status-chart',
      title: 'Status Distribution',
      priority: 'high', 
      loadOnVisible: false,
      cacheKey: 'dashboard_status',
      cacheTimeMinutes: 15
    },
    {
      id: 'yearly-comparison',
      title: 'Yearly Comparison',
      priority: 'medium',
      loadOnVisible: true,
      cacheKey: 'dashboard_yearly',
      cacheTimeMinutes: 60
    },
    {
      id: 'domain-coverage',
      title: 'Domain Coverage',
      priority: 'medium',
      loadOnVisible: true,
      cacheKey: 'dashboard_domains',
      cacheTimeMinutes: 30
    },
    {
      id: 'sunburst',
      title: 'Sunburst Chart', 
      priority: 'low',
      loadOnVisible: true,
      cacheKey: 'dashboard_sunburst',
      cacheTimeMinutes: 120
    }
  ]

  const initializeWidgets = () => {
    widgetConfigs.forEach(config => {
      widgets.value[config.id] = config
    })
  }

  const registerWidget = (widgetId: string, element: HTMLElement) => {
    const config = widgets.value[widgetId]
    if (!config) return

    registerComponent(widgetId, element, {
      priority: config.priority,
      loadOnVisible: config.loadOnVisible,
      preload: config.priority === 'high'
    })

    // Charger immédiatement si priorité haute
    if (config.priority === 'high') {
      loadWidget(widgetId)
    }
  }

  const loadWidget = async (widgetId: string) => {
    const config = widgets.value[widgetId]
    if (!config || loadedWidgets.value.has(widgetId) || loadingWidgets.value.has(widgetId)) {
      return
    }

    loadingWidgets.value.add(widgetId)

    try {
      // Vérifier le cache d'abord
      if (config.cacheKey) {
        const cached = staticCache.get(config.cacheKey)
        if (cached) {
          console.log(`📦 Widget ${widgetId} chargé depuis le cache`)
          loadedWidgets.value.add(widgetId)
          loadingWidgets.value.delete(widgetId)
          return cached
        }
      }

      // Charger les données du widget (sera implémenté par widget)
      console.log(`🔄 Chargement du widget: ${widgetId}`)
      
      // Simuler un délai de chargement basé sur la priorité
      const delay = config.priority === 'high' ? 0 : config.priority === 'medium' ? 100 : 300
      await new Promise(resolve => setTimeout(resolve, delay))

      loadedWidgets.value.add(widgetId)
      
      // Mettre en cache si configuré
      if (config.cacheKey && config.cacheTimeMinutes) {
        staticCache.set(config.cacheKey, { widgetId, loadedAt: Date.now() }, config.cacheTimeMinutes * 60 * 1000)
      }

    } finally {
      loadingWidgets.value.delete(widgetId)
    }
  }

  const isWidgetLoaded = (widgetId: string): boolean => {
    return loadedWidgets.value.has(widgetId)
  }

  const isWidgetLoading = (widgetId: string): boolean => {
    return loadingWidgets.value.has(widgetId)
  }

  const getLoadingProgress = computed(() => {
    const total = Object.keys(widgets.value).length
    const loaded = loadedWidgets.value.size
    return total > 0 ? Math.round((loaded / total) * 100) : 0
  })

  const preloadCriticalWidgets = () => {
    Object.entries(widgets.value).forEach(([id, config]) => {
      if (config.priority === 'high') {
        nextTick(() => loadWidget(id))
      }
    })
  }

  onMounted(() => {
    initializeWidgets()
    preloadCriticalWidgets()
  })

  return {
    widgets,
    registerWidget,
    loadWidget,
    isWidgetLoaded,
    isWidgetLoading,
    loadingProgress: getLoadingProgress,
    preloadCriticalWidgets
  }
}