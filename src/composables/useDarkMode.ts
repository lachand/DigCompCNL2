import { ref, watch } from 'vue'

const isDark = ref(false)

// Load from localStorage on init
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('darkMode')
  isDark.value = stored === 'true'

  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
}

export function useDarkMode() {
  const toggle = () => {
    isDark.value = !isDark.value
  }

  watch(isDark, (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', String(dark))
  })

  return {
    isDark,
    toggle
  }
}
