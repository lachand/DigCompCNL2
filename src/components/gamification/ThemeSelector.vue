<template>
  <div class="space-y-4">
    <h3 class="font-semibold text-lg">🎨 Sélecteur de Thème</h3>
    
    <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
      <button
        v-for="themeOption in availableThemes"
        :key="themeOption.name"
        @click="theme.applyTheme(themeOption.name)"
        class="p-4 rounded-lg border-2 transition-all hover:shadow-lg"
        :class="theme.currentTheme.value === themeOption.name ? 'border-indigo-600 shadow-lg' : 'border-gray-200 dark:border-gray-700'"
      >
        <!-- Color preview -->
        <div class="flex gap-1 mb-2">
          <div class="w-6 h-6 rounded" :style="{ backgroundColor: themeOption.primary }" title="Couleur primaire"></div>
        </div>
        
        <!-- Theme name -->
        <div class="font-medium text-sm">{{ themeOption.displayName }}</div>
        
        <!-- Checkmark if selected -->
        <div v-if="theme.currentTheme.value === themeOption.name" class="mt-2 text-indigo-600 text-sm font-bold">
          ✓ Actif
        </div>
      </button>
    </div>

    <!-- Theme Info -->
    <div class="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
      <p class="text-sm text-gray-700 dark:text-gray-300">
        <strong>Thème actuel:</strong> {{ currentThemeName }}
      </p>
      <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
        Votre préférence de thème est sauvegardée automatiquement
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'

const theme = useTheme()

const availableThemes = computed(() => theme.getThemeList())

const currentThemeName = computed(() => {
  const current = availableThemes.value.find(t => t.name === theme.currentTheme.value)
  return current?.displayName || 'Inconnu'
})
</script>
