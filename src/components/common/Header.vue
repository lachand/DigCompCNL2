<template>
  <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
    <!-- Left Actions -->
    <div class="flex items-center gap-4">
      <!-- Activity History -->
      <button
        @click="$emit('toggle-history')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        title="Historique d'activité"
      >
        <i class="ph ph-clock-counter-clockwise text-xl"></i>
      </button>

      <!-- Page Title -->
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-4">
      <!-- Search -->
      <div class="relative hidden md:block">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher..."
          class="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          @keyup.enter="handleSearch"
        />
        <i class="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
      </div>

      <!-- Magic Import -->
      <button
        @click="$emit('toggle-magic-import')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        title="Import magique"
      >
        <i class="ph ph-magic-wand text-xl"></i>
      </button>

      <!-- Export -->
      <button
        @click="$emit('toggle-export')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        title="Exporter"
      >
        <i class="ph ph-export text-xl"></i>
      </button>

      <!-- Referential Panel -->
      <button
        @click="$emit('toggle-referential')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        title="Référentiel DigComp"
      >
        <i class="ph ph-tree-structure text-xl"></i>
      </button>

      <!-- Dark Mode Toggle -->
      <button
        @click="darkMode.toggle()"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        :title="darkMode.isDark.value ? 'Mode clair' : 'Mode sombre'"
      >
        <i class="ph text-xl" :class="darkMode.isDark.value ? 'ph-sun' : 'ph-moon'"></i>
      </button>

      <!-- Video Conference -->
      <button
        @click="$emit('toggle-video')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        title="Visioconférence"
      >
        <i class="ph ph-video-camera text-xl"></i>
      </button>

      <!-- Chat Toggle -->
      <button
        @click="$emit('toggle-chat')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition relative"
        title="Chat d'équipe"
      >
        <i class="ph ph-chat-circle-dots text-xl"></i>
        <span v-if="chatStore.unreadCount > 0" class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {{ chatStore.unreadCount }}
        </span>
      </button>

      <!-- Notifications -->
      <div class="relative">
        <button
          @click="showNotifications = !showNotifications"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition relative"
        >
          <i class="ph ph-bell text-xl"></i>
          <span v-if="unreadNotifications > 0" class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <!-- Notifications Dropdown -->
        <div
          v-if="showNotifications"
          v-click-away="() => showNotifications = false"
          class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
        >
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">Notifications</h3>
          </div>
          <div class="max-h-96 overflow-y-auto">
            <div v-if="notifications.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
              <i class="ph ph-bell-slash text-4xl mb-2"></i>
              <p>Aucune notification</p>
            </div>
            <div
              v-for="notif in notifications"
              :key="notif.id"
              class="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <p class="font-medium text-gray-900 dark:text-white">{{ notif.title }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ notif.message }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ formatDate(notif.timestamp) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div class="relative">
        <button
          @click="showSettings = !showSettings"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <i class="ph ph-gear text-xl"></i>
        </button>

        <!-- Settings Dropdown -->
        <div
          v-if="showSettings"
          v-click-away="() => showSettings = false"
          class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
        >
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white">Paramètres</h3>
          </div>
          <div class="p-4 space-y-4">
            <!-- Sound -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Son de notification
              </label>
              <select
                :value="authStore.userData?.prefSound || 'beep'"
                @change="(e) => authStore.updateUserField('prefSound', (e.target as HTMLSelectElement).value)"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option v-for="sound in SOUND_OPTIONS" :key="sound.value" :value="sound.value">
                  {{ sound.label }}
                </option>
              </select>
            </div>

            <!-- API Key -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clé API Gemini
              </label>
              <div class="flex gap-2">
                <input
                  v-model="apiKeyInput"
                  type="password"
                  placeholder="AIza..."
                  class="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  :class="apiKeyStatus === 'valid' ? 'border-green-500' : apiKeyStatus === 'invalid' ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
                />
                <button
                  @click="validateAndSaveApiKey"
                  :disabled="isValidatingKey || !apiKeyInput"
                  class="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition"
                  :title="apiKeyStatus === 'valid' ? 'Clé valide' : 'Valider la clé'"
                >
                  <i v-if="isValidatingKey" class="ph ph-spinner animate-spin"></i>
                  <i v-else-if="apiKeyStatus === 'valid'" class="ph ph-check"></i>
                  <i v-else class="ph ph-key"></i>
                </button>
              </div>
              <p v-if="apiKeyError" class="text-xs text-red-500 mt-1">{{ apiKeyError }}</p>
              <p v-else-if="apiKeyStatus === 'valid'" class="text-xs text-green-500 mt-1">Clé API valide</p>
            </div>

            <!-- AI Model Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modèle IA par défaut
              </label>
              <select
                :value="authStore.userData?.aiModel || 'gemini-3-flash-preview'"
                @change="(e) => authStore.updateUserField('aiModel', (e.target as HTMLSelectElement).value)"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option v-for="model in AI_MODELS" :key="model.value" :value="model.value">
                  {{ model.label }}
                </option>
              </select>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ currentModelDescription }}
              </p>
            </div>

            <!-- Keyboard Shortcuts Info -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Raccourcis clavier</h4>
              <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div class="flex justify-between">
                  <span>Historique</span>
                  <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+H</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Import magique</span>
                  <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+I</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Export</span>
                  <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Shift+E</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Référentiel</span>
                  <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+Shift+R</kbd>
                </div>
                <div class="flex justify-between">
                  <span>Fermer panneau</span>
                  <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Échap</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Avatar -->
      <UserAvatar :email="authStore.userData?.email || ''" :size="40" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useDarkMode } from '@/composables/useDarkMode'
import { useGemini } from '@/composables/useGemini'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/utils/helpers'
import { SOUND_OPTIONS, AI_MODELS } from '@/types'
import UserAvatar from '@/components/auth/UserAvatar.vue'

defineEmits<{
  'toggle-chat': []
  'toggle-video': []
  'toggle-history': []
  'toggle-magic-import': []
  'toggle-export': []
  'toggle-referential': []
}>()

const route = useRoute()
const authStore = useAuthStore()
const chatStore = useChatStore()
const darkMode = useDarkMode()
const { validateApiKey } = useGemini()
const { success, error: showError } = useToast()

const searchQuery = ref('')
const showNotifications = ref(false)
const showSettings = ref(false)
const notifications = ref<any[]>([])
const unreadNotifications = computed(() => notifications.value.filter(n => !n.read).length)

// API Key validation
const apiKeyInput = ref(authStore.userData?.apiKey || '')
const isValidatingKey = ref(false)
const apiKeyStatus = ref<'none' | 'valid' | 'invalid'>('none')
const apiKeyError = ref('')

// Watch for existing API key
watch(() => authStore.userData?.apiKey, (newKey) => {
  if (newKey) {
    apiKeyInput.value = newKey
    apiKeyStatus.value = 'valid' // Assume existing key is valid
  }
}, { immediate: true })

const currentModelDescription = computed(() => {
  const model = AI_MODELS.find(m => m.value === (authStore.userData?.aiModel || 'gemini-3-flash-preview'))
  return model?.description || ''
})

const validateAndSaveApiKey = async () => {
  if (!apiKeyInput.value) return

  isValidatingKey.value = true
  apiKeyError.value = ''

  try {
    const result = await validateApiKey(apiKeyInput.value)

    if (result.valid) {
      await authStore.updateUserField('apiKey', apiKeyInput.value)
      apiKeyStatus.value = 'valid'
      success('Clé API validée et enregistrée')
    } else {
      apiKeyStatus.value = 'invalid'
      apiKeyError.value = result.error || 'Clé invalide'
    }
  } catch (err) {
    apiKeyStatus.value = 'invalid'
    apiKeyError.value = err instanceof Error ? err.message : 'Erreur de validation'
  } finally {
    isValidatingKey.value = false
  }
}

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/l1': 'Licence 1',
    '/l2': 'Licence 2',
    '/l3': 'Licence 3',
    '/overview': 'Vue d\'ensemble',
    '/kanban': 'Kanban',
    '/chat': 'Chat'
  }
  return titles[route.path] || 'DigComp 3.0'
})

const handleSearch = () => {
  // TODO: Implement search
  console.log('Search:', searchQuery.value)
}

// Simple click-away directive alternative
const clickAway = (callback: () => void) => {
  const listener = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.relative')) {
      callback()
      document.removeEventListener('click', listener)
    }
  }
  setTimeout(() => document.addEventListener('click', listener), 0)
}
</script>
