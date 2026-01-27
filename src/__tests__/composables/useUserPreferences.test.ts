import { describe, it, expect, beforeEach } from 'vitest'
import { useUserPreferences } from '@/composables/useUserPreferences'

describe('useUserPreferences', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should return default filter values', () => {
    const { filters } = useUserPreferences()

    expect(filters.value.search).toBe('')
    expect(filters.value.status).toBe('')
    expect(filters.value.level).toBe('')
    expect(filters.value.domain).toBe('')
    expect(filters.value.sortBy).toBe('id')
    expect(filters.value.sortOrder).toBe('asc')
    expect(filters.value.pinnedOnly).toBe(false)
    expect(filters.value.years).toEqual(['L1', 'L2', 'L3'])
  })

  it('should return default view values', () => {
    const { view } = useUserPreferences()

    expect(view.value.viewMode).toBe('detailed')
    expect(view.value.showDomainStats).toBe(true)
    expect(view.value.showGlobalProgress).toBe(true)
    expect(view.value.accentColor).toBe('#6366f1')
  })

  it('should update filter values', () => {
    const { filters, setFilter } = useUserPreferences()

    setFilter('search', 'test query')
    expect(filters.value.search).toBe('test query')

    setFilter('status', 'validated')
    expect(filters.value.status).toBe('validated')

    setFilter('sortBy', 'level')
    expect(filters.value.sortBy).toBe('level')
  })

  it('should reset filters to defaults', () => {
    const { filters, setFilter, resetFilters } = useUserPreferences()

    setFilter('search', 'test')
    setFilter('status', 'draft')
    setFilter('pinnedOnly', true)

    resetFilters()

    expect(filters.value.search).toBe('')
    expect(filters.value.status).toBe('')
    expect(filters.value.pinnedOnly).toBe(false)
  })

  it('should detect active filters', () => {
    const { hasActiveFilters, setFilter, resetFilters } = useUserPreferences()

    resetFilters()
    expect(hasActiveFilters.value).toBe(false)

    setFilter('search', 'something')
    expect(hasActiveFilters.value).toBe(true)

    resetFilters()
    setFilter('pinnedOnly', true)
    expect(hasActiveFilters.value).toBe(true)
  })

  it('should toggle view mode', () => {
    const { view, toggleViewMode } = useUserPreferences()

    expect(view.value.viewMode).toBe('detailed')

    toggleViewMode()
    expect(view.value.viewMode).toBe('compact')

    toggleViewMode()
    expect(view.value.viewMode).toBe('detailed')
  })

  it('should set view mode directly', () => {
    const { view, setViewMode } = useUserPreferences()

    setViewMode('compact')
    expect(view.value.viewMode).toBe('compact')

    setViewMode('detailed')
    expect(view.value.viewMode).toBe('detailed')
  })

  it('should toggle domain stats', () => {
    const { view, toggleDomainStats } = useUserPreferences()

    const initial = view.value.showDomainStats
    toggleDomainStats()
    expect(view.value.showDomainStats).toBe(!initial)
  })

  it('should toggle global progress', () => {
    const { view, toggleGlobalProgress } = useUserPreferences()

    const initial = view.value.showGlobalProgress
    toggleGlobalProgress()
    expect(view.value.showGlobalProgress).toBe(!initial)
  })

  it('should set accent color', () => {
    const { view, setAccentColor } = useUserPreferences()

    setAccentColor('#ff0000')
    expect(view.value.accentColor).toBe('#ff0000')
  })

  it('should provide preset accent colors', () => {
    const { accentColors } = useUserPreferences()

    expect(accentColors.length).toBeGreaterThan(0)
    accentColors.forEach(color => {
      expect(color.name).toBeTruthy()
      expect(color.value).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })
})
