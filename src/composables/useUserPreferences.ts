import { ref, watch, computed } from 'vue'
import type { YearLevel, StatusType } from '@/types'

// Filter preferences
export interface FilterPreferences {
  search: string
  status: StatusType | ''
  level: string
  domain: string
  sortBy: 'id' | 'status' | 'level' | 'alphabetical' | 'date'
  sortOrder: 'asc' | 'desc'
  pinnedOnly: boolean
  years: YearLevel[]
}

// View preferences
export interface ViewPreferences {
  viewMode: 'detailed' | 'compact'
  showDomainStats: boolean
  showGlobalProgress: boolean
  sidebarOpen: boolean
  accentColor: string
}

// User preferences store
const STORAGE_KEY_FILTERS = 'digcomp_filters'
const STORAGE_KEY_VIEW = 'digcomp_view'

// Default values
const defaultFilters: FilterPreferences = {
  search: '',
  status: '',
  level: '',
  domain: '',
  sortBy: 'id',
  sortOrder: 'asc',
  pinnedOnly: false,
  years: ['L1', 'L2', 'L3']
}

const defaultView: ViewPreferences = {
  viewMode: 'detailed',
  showDomainStats: true,
  showGlobalProgress: true,
  sidebarOpen: true,
  accentColor: '#6366f1' // Indigo
}

// Load from localStorage
const loadFilters = (): FilterPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_FILTERS)
    if (stored) {
      return { ...defaultFilters, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.warn('Failed to load filter preferences:', e)
  }
  return { ...defaultFilters }
}

const loadView = (): ViewPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_VIEW)
    if (stored) {
      return { ...defaultView, ...JSON.parse(stored) }
    }
  } catch (e) {
    console.warn('Failed to load view preferences:', e)
  }
  return { ...defaultView }
}

// Reactive state
const filters = ref<FilterPreferences>(loadFilters())
const view = ref<ViewPreferences>(loadView())

// Save to localStorage on change
watch(filters, (newValue) => {
  localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(newValue))
}, { deep: true })

watch(view, (newValue) => {
  localStorage.setItem(STORAGE_KEY_VIEW, JSON.stringify(newValue))

  // Apply accent color as CSS variable
  document.documentElement.style.setProperty('--accent-color', newValue.accentColor)
}, { deep: true })

export function useUserPreferences() {
  // Filter actions
  const setFilter = <K extends keyof FilterPreferences>(key: K, value: FilterPreferences[K]) => {
    filters.value[key] = value
  }

  const resetFilters = () => {
    filters.value = { ...defaultFilters }
  }

  const hasActiveFilters = computed(() => {
    return filters.value.search !== '' ||
      filters.value.status !== '' ||
      filters.value.level !== '' ||
      filters.value.domain !== '' ||
      filters.value.pinnedOnly ||
      filters.value.years.length !== 3
  })

  // View actions
  const setViewMode = (mode: 'detailed' | 'compact') => {
    view.value.viewMode = mode
  }

  const toggleViewMode = () => {
    view.value.viewMode = view.value.viewMode === 'detailed' ? 'compact' : 'detailed'
  }

  const setAccentColor = (color: string) => {
    view.value.accentColor = color
    document.documentElement.style.setProperty('--accent-color', color)
  }

  const toggleDomainStats = () => {
    view.value.showDomainStats = !view.value.showDomainStats
  }

  const toggleGlobalProgress = () => {
    view.value.showGlobalProgress = !view.value.showGlobalProgress
  }

  // Preset accent colors
  const accentColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Orange', value: '#f97316' }
  ]

  // Initialize accent color on load
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--accent-color', view.value.accentColor)
  }

  return {
    filters,
    view,
    setFilter,
    resetFilters,
    hasActiveFilters,
    setViewMode,
    toggleViewMode,
    setAccentColor,
    toggleDomainStats,
    toggleGlobalProgress,
    accentColors
  }
}
