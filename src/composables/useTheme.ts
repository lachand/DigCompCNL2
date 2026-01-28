import { ref, watch, computed } from 'vue'
import { THEMES, type ThemeName, type ThemeConfig } from '@/types'

const currentTheme = ref<ThemeName>('light')

// Load from localStorage on init
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('selectedTheme')
  if (stored && (stored in THEMES)) {
    currentTheme.value = stored as ThemeName
  }
}

export function useTheme() {
  const themeConfig = computed<ThemeConfig>(() => THEMES[currentTheme.value])

  const applyTheme = (themeName: ThemeName) => {
    currentTheme.value = themeName
  }

  const setThemeCSSVariables = () => {
    const theme = themeConfig.value
    const root = document.documentElement

    // Set CSS variables for theme colors
    root.style.setProperty('--color-primary', theme.colors.primary)
    root.style.setProperty('--color-secondary', theme.colors.secondary)
    root.style.setProperty('--color-accent', theme.colors.accent)
    root.style.setProperty('--color-background', theme.colors.background)
    root.style.setProperty('--color-surface', theme.colors.surface)
    root.style.setProperty('--color-text', theme.colors.text)

    // Apply dark class if needed
    if (theme.isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Store preference
    localStorage.setItem('selectedTheme', currentTheme.value)
  }

  // Watch theme changes and apply CSS variables
  watch(currentTheme, () => {
    setThemeCSSVariables()
  }, { immediate: true })

  // Initialize on mount
  if (typeof window !== 'undefined') {
    setThemeCSSVariables()
  }

  const getThemeList = () => {
    return Object.values(THEMES).map(t => ({
      name: t.name,
      displayName: t.displayName,
      isDark: t.isDark,
      primary: t.colors.primary
    }))
  }

  const nextTheme = () => {
    const themes = Object.keys(THEMES) as ThemeName[]
    const currentIndex = themes.indexOf(currentTheme.value)
    const nextIndex = (currentIndex + 1) % themes.length
    currentTheme.value = themes[nextIndex]
  }

  return {
    currentTheme,
    themeConfig,
    applyTheme,
    getThemeList,
    nextTheme
  }
}
