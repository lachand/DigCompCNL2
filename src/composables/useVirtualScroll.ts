// Composable pour le virtual scrolling
import { ref, computed, nextTick, watch, onMounted, onUnmounted, type Ref } from 'vue'

export interface VirtualScrollItem {
  id: string | number
  height?: number
  [key: string]: any
}

export interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  horizontal?: boolean
}

export function useVirtualScroll<T extends VirtualScrollItem>(
  items: Ref<T[]>,
  options: VirtualScrollOptions
) {
  const scrollContainer = ref<HTMLElement>()
  const scrollTop = ref(0)
  const scrollLeft = ref(0)
  const containerSize = ref(options.containerHeight)
  const itemSize = ref(options.itemHeight)
  const overscan = options.overscan || 5
  const isHorizontal = options.horizontal || false
  
  // Calculate visible range
  const visibleRange = computed(() => {
    const scroll = isHorizontal ? scrollLeft.value : scrollTop.value
    const containerDimension = isHorizontal ? containerSize.value : containerSize.value
    
    const start = Math.floor(scroll / itemSize.value)
    const end = Math.min(
      start + Math.ceil(containerDimension / itemSize.value) + overscan,
      items.value.length
    )
    
    return {
      start: Math.max(0, start - overscan),
      end
    }
  })
  
  // Get visible items
  const visibleItems = computed(() => {
    const { start, end } = visibleRange.value
    return items.value.slice(start, end).map((item, index) => ({
      ...item,
      index: start + index,
      offset: (start + index) * itemSize.value
    }))
  })
  
  // Calculate total size
  const totalSize = computed(() => {
    return items.value.length * itemSize.value
  })
  
  // Calculate offset before visible items
  const offsetBefore = computed(() => {
    return visibleRange.value.start * itemSize.value
  })
  
  // Calculate offset after visible items
  const offsetAfter = computed(() => {
    const visibleHeight = visibleRange.value.end * itemSize.value
    return Math.max(0, totalSize.value - visibleHeight)
  })
  
  // Scroll handler
  const onScroll = (event: Event) => {
    const target = event.target as HTMLElement
    
    if (isHorizontal) {
      scrollLeft.value = target.scrollLeft
    } else {
      scrollTop.value = target.scrollTop
    }
  }
  
  // Scroll to index
  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!scrollContainer.value) return
    
    const offset = index * itemSize.value
    
    if (isHorizontal) {
      scrollContainer.value.scrollTo({
        left: offset,
        behavior
      })
    } else {
      scrollContainer.value.scrollTo({
        top: offset,
        behavior
      })
    }
  }
  
  // Scroll to item
  const scrollToItem = (itemId: string | number, behavior: ScrollBehavior = 'smooth') => {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
      scrollToIndex(index, behavior)
    }
  }
  
  // Update container size
  const updateContainerSize = () => {
    if (scrollContainer.value) {
      const rect = scrollContainer.value.getBoundingClientRect()
      containerSize.value = isHorizontal ? rect.width : rect.height
    }
  }
  
  // Resize observer
  let resizeObserver: ResizeObserver | null = null
  
  onMounted(() => {
    if (scrollContainer.value) {
      updateContainerSize()
      
      // Setup resize observer
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(() => {
          updateContainerSize()
        })
        resizeObserver.observe(scrollContainer.value)
      }
    }
  })
  
  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  })
  
  return {
    // Refs
    scrollContainer,
    
    // Computed
    visibleItems,
    visibleRange,
    totalSize,
    offsetBefore,
    offsetAfter,
    
    // Methods
    onScroll,
    scrollToIndex,
    scrollToItem,
    updateContainerSize
  }
}

// Composable pour l'intersection observer (lazy loading)
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) {
  const targets = ref<Set<Element>>(new Set())
  let observer: IntersectionObserver | null = null
  
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  }
  
  // Initialize observer
  const initObserver = () => {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(callback, defaultOptions)
      
      // Observe existing targets
      targets.value.forEach(target => {
        observer?.observe(target)
      })
    }
  }
  
  // Observe element
  const observe = (element: Element) => {
    targets.value.add(element)
    observer?.observe(element)
  }
  
  // Unobserve element
  const unobserve = (element: Element) => {
    targets.value.delete(element)
    observer?.unobserve(element)
  }
  
  // Disconnect observer
  const disconnect = () => {
    observer?.disconnect()
    targets.value.clear()
  }
  
  onMounted(() => {
    initObserver()
  })
  
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    observe,
    unobserve,
    disconnect
  }
}

// Composable pour le lazy loading des images
export function useLazyImage() {
  const imageRefs = ref<Map<string, HTMLImageElement>>(new Map())
  const loadedImages = ref<Set<string>>(new Set())
  const errorImages = ref<Set<string>>(new Set())
  
  const { observe, unobserve } = useIntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          
          if (src && !loadedImages.value.has(src)) {
            loadImage(src, img)
          }
        }
      })
    },
    { rootMargin: '100px' }
  )
  
  const loadImage = (src: string, img: HTMLImageElement) => {
    const image = new Image()
    
    image.onload = () => {
      img.src = src
      img.classList.remove('lazy-loading')
      img.classList.add('lazy-loaded')
      loadedImages.value.add(src)
    }
    
    image.onerror = () => {
      img.classList.remove('lazy-loading')
      img.classList.add('lazy-error')
      errorImages.value.add(src)
    }
    
    image.src = src
  }
  
  const registerImage = (img: HTMLImageElement, src: string) => {
    img.dataset.src = src
    img.classList.add('lazy-loading')
    
    // Set placeholder or low-quality version
    if (!img.src) {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"%3E%3C/svg%3E'
    }
    
    imageRefs.value.set(src, img)
    observe(img)
  }
  
  const unregisterImage = (src: string) => {
    const img = imageRefs.value.get(src)
    if (img) {
      unobserve(img)
      imageRefs.value.delete(src)
    }
  }
  
  const isLoaded = (src: string) => loadedImages.value.has(src)
  const hasError = (src: string) => errorImages.value.has(src)
  
  return {
    registerImage,
    unregisterImage,
    isLoaded,
    hasError
  }
}