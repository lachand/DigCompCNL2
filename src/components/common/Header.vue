<template>
  <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
    <!-- Left Actions -->
    <div class="flex items-center gap-4">
      <!-- Activity History -->
      <button
        data-tour="history"
        @click="$emit('toggle-history')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-300"
        title="Historique d'activité"
      >
        <i class="ph ph-clock-counter-clockwise text-xl"></i>
      </button>

      <!-- Page Title -->
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ pageTitle }}</h1>
    </div>

    <!-- Actions -->
    <div data-tour="header-actions" class="flex items-center gap-4">
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
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-300"
        title="Import magique"
      >
        <i class="ph ph-magic-wand text-xl"></i>
      </button>

      <!-- Export -->
      <button
        @click="$emit('toggle-export')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-300"
        title="Exporter"
      >
        <i class="ph ph-export text-xl"></i>
      </button>

      <!-- Referential Panel -->
      <button
        @click="$emit('toggle-referential')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-300"
        title="Référentiel DigComp"
      >
        <i class="ph ph-tree-structure text-xl"></i>
      </button>

      <!-- Dark Mode Toggle -->
      <button
        @click="darkMode.toggle()"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-300"
        :title="darkMode.isDark.value ? 'Mode clair' : 'Mode sombre'"
      >
        <i class="ph text-xl" :class="darkMode.isDark.value ? 'ph-sun' : 'ph-moon'"></i>
      </button>

      <!-- Video Conference -->
      <button
        @click="$emit('toggle-video')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition relative"
        :class="videoActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'"
        title="Visioconférence"
      >
        <i class="ph ph-video-camera text-xl"></i>
        <span v-if="videoActive" class="absolute top-1 right-1 flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
      </button>

      <!-- Reviews -->
      <button
        @click="$emit('toggle-reviews')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition relative text-gray-600 dark:text-gray-300"
        title="Reviews"
      >
        <i class="ph ph-checks text-xl"></i>
        <span v-if="reviewPendingCount > 0" class="absolute top-1 right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
          {{ reviewPendingCount }}
        </span>
      </button>

      <!-- Chat Toggle -->
      <button
        @click="$emit('toggle-chat')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition relative text-gray-600 dark:text-gray-300"
        title="Chat d'équipe"
      >
        <i class="ph ph-chat-circle-dots text-xl"></i>
        <span v-if="chatStore.unreadCount > 0" class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {{ chatStore.unreadCount }}
        </span>
      </button>

      <!-- Notifications -->
      <div data-tour="notifications" class="relative">
        <button
          @click="showNotifications = !showNotifications"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition relative text-gray-600 dark:text-gray-300"
        >
          <i class="ph ph-bell text-xl"></i>
          <span v-if="notificationsStore.unreadCount > 0" class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {{ notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount }}
          </span>
        </button>

        <!-- Notifications Dropdown -->
        <div
          v-if="showNotifications"
          v-click-away="() => showNotifications = false"
          class="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
        >
          <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <button
              v-if="notificationsStore.unreadCount > 0"
              @click="notificationsStore.markAllAsRead()"
              class="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Tout marquer comme lu
            </button>
          </div>
          <div class="max-h-96 overflow-y-auto">
            <div v-if="notificationsStore.sortedNotifications.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
              <i class="ph ph-bell-slash text-4xl mb-2"></i>
              <p>Aucune notification</p>
            </div>
            <div
              v-for="notif in notificationsStore.sortedNotifications"
              :key="notif.id"
              @click="handleNotificationClick(notif)"
              class="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex gap-3"
              :class="{ 'bg-indigo-50 dark:bg-indigo-900/10': !notif.read }"
            >
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="getNotificationIconClass(notif.type)">
                  <i :class="getNotificationIcon(notif.type)"></i>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 dark:text-white text-sm">{{ notif.title }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400 truncate">{{ notif.message }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ formatDate(notif.createdAt) }}</p>
              </div>
              <button
                @click.stop="notificationsStore.deleteNotification(notif.id!)"
                class="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded opacity-0 group-hover:opacity-100"
              >
                <i class="ph ph-x text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Gamification indicators -->
      <div v-if="gamificationStats" class="flex items-center gap-2 text-sm">
        <span v-if="gamificationStats.currentStreak > 0" class="flex items-center gap-0.5 text-orange-500" title="Streak d'activité">
          <i class="ph ph-fire"></i>
          <span class="font-medium">{{ gamificationStats.currentStreak }}</span>
        </span>
        <span class="flex items-center gap-0.5 text-yellow-600 dark:text-yellow-400" title="Points">
          <i class="ph ph-star"></i>
          <span class="font-medium">{{ gamificationStats.points }}</span>
        </span>
      </div>

      <!-- User Avatar (click to open settings) -->
      <div data-tour="user-menu" class="relative">
        <button
          @click="showSettings = !showSettings"
          class="rounded-full hover:ring-2 hover:ring-indigo-400 transition"
          title="Paramètres"
        >
          <UserAvatar :email="authStore.userData?.email || ''" :size="40" />
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

            <!-- Restart Tour -->
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                @click="restartTour"
                class="w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition flex items-center justify-center gap-2"
              >
                <i class="ph ph-compass"></i>
                Relancer la visite guidee
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useNotificationsStore } from '@/stores/notifications'
import { useDarkMode } from '@/composables/useDarkMode'
import { useGemini } from '@/composables/useGemini'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/utils/helpers'
import { SOUND_OPTIONS, AI_MODELS } from '@/types'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import { useOnboardingTour } from '@/composables/useOnboardingTour'
import { useReviewRequests } from '@/composables/useReviewRequests'
import { useGamification } from '@/composables/useGamification'

defineProps<{
  videoActive?: boolean
}>()

const onboardingTour = useOnboardingTour()

const restartTour = () => {
  onboardingTour.resetTour()
  onboardingTour.startTour()
  showSettings.value = false
}

defineEmits<{
  'toggle-chat': []
  'toggle-video': []
  'toggle-history': []
  'toggle-magic-import': []
  'toggle-export': []
  'toggle-referential': []
  'toggle-reviews': []
}>()

const route = useRoute()
const authStore = useAuthStore()
const chatStore = useChatStore()
const notificationsStore = useNotificationsStore()
const darkMode = useDarkMode()
const { validateApiKey } = useGemini()
const { success, error: showError } = useToast()

const { pendingCount: reviewPendingCount } = useReviewRequests()
const { userStats: gamificationStats } = useGamification()

const searchQuery = ref('')
const showNotifications = ref(false)
const showSettings = ref(false)

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
    '/calendar': 'Calendrier',
    '/comparison': 'Comparaison',
    '/statistics': 'Statistiques',
    '/chat': 'Chat'
  }
  return titles[route.path] || 'DigComp 3.0'
})

const handleSearch = () => {
  // TODO: Implement search
  console.log('Search:', searchQuery.value)
}

// Notification helpers
const getNotificationIcon = (type: string) => {
  const icons: Record<string, string> = {
    assignment: 'ph ph-user-plus',
    status_change: 'ph ph-arrow-right',
    comment: 'ph ph-chat-circle',
    calendar: 'ph ph-calendar',
    mention: 'ph ph-at'
  }
  return icons[type] || 'ph ph-bell'
}

const getNotificationIconClass = (type: string) => {
  const classes: Record<string, string> = {
    assignment: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    status_change: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    comment: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    calendar: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    mention: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
  }
  return classes[type] || 'bg-gray-100 text-gray-600'
}

const handleNotificationClick = async (notif: any) => {
  if (!notif.read) {
    await notificationsStore.markAsRead(notif.id)
  }
  if (notif.link) {
    showNotifications.value = false
    // Navigate using router would be cleaner but this works for now
    window.location.href = notif.link
  }
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
