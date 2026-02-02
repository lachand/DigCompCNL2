// Composable pour le chargement conditionnel basé sur la visibilité
import { ref, watch } from 'vue'

interface ConditionalLoader {
  isVisible: boolean
  priority: 'high' | 'medium' | 'low'
  loadOnVisible: boolean
  preload: boolean
}

export function useConditionalLoading() {
  const visibilityStates = ref<Record<string, ConditionalLoader>>({})
  const loadQueue = ref<string[]>([])
  
  // Observer d'intersection pour détecter la visibilité
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const componentId = entry.target.getAttribute('data-component-id')
        if (componentId && visibilityStates.value[componentId]) {
          visibilityStates.value[componentId].isVisible = entry.isIntersecting
          
          // Charger si configuré pour le faire à la visibilité
          if (entry.isIntersecting && visibilityStates.value[componentId].loadOnVisible) {
            loadComponent(componentId)
          }
        }
      })
    },
    { 
      rootMargin: '50px', // Commencer à charger 50px avant d'être visible
      threshold: 0.1 
    }
  )

  const registerComponent = (
    id: string, 
    element: HTMLElement,
    config: Partial<ConditionalLoader> = {}
  ) => {
    const defaultConfig: ConditionalLoader = {
      isVisible: false,
      priority: 'medium',
      loadOnVisible: true,
      preload: false,
      ...config
    }
    
    visibilityStates.value[id] = defaultConfig
    element.setAttribute('data-component-id', id)
    observer.observe(element)

    // Préchargement si configuré
    if (defaultConfig.preload) {
      queueLoad(id)
    }
  }

  const queueLoad = (componentId: string) => {
    if (!loadQueue.value.includes(componentId)) {
      const config = visibilityStates.value[componentId]
      
      // Insérer selon la priorité
      if (config.priority === 'high') {
        loadQueue.value.unshift(componentId)
      } else {
        loadQueue.value.push(componentId)
      }
      
      processQueue()
    }
  }

  const processQueue = async () => {
    if (loadQueue.value.length === 0) return
    
    // Traiter un élément à la fois pour éviter la surcharge
    const componentId = loadQueue.value.shift()!
    await loadComponent(componentId)
    
    // Continuer avec le prochain après un délai
    setTimeout(processQueue, 100)
  }

  const loadComponent = async (componentId: string) => {
    console.log(`🚀 Chargement conditionnel: ${componentId}`)
    // Logique de chargement spécifique au composant sera implémentée
    // dans les composants individuels via des callbacks
  }

  const unregisterComponent = (id: string, element: HTMLElement) => {
    observer.unobserve(element)
    delete visibilityStates.value[id]
  }

  const isComponentVisible = (id: string): boolean => {
    return visibilityStates.value[id]?.isVisible || false
  }

  const getLoadingStats = () => {
    return {
      totalComponents: Object.keys(visibilityStates.value).length,
      visibleComponents: Object.values(visibilityStates.value).filter(c => c.isVisible).length,
      queueLength: loadQueue.value.length
    }
  }

  return {
    registerComponent,
    unregisterComponent,
    queueLoad,
    isComponentVisible,
    getLoadingStats,
    visibilityStates: visibilityStates.value
  }
}