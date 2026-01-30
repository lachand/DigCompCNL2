<template>
  <header class="h-16 theme-surface border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6">
    <!-- Bouton hamburger mobile -->
    <button class="md:hidden p-2 mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300" @click="$emit('toggle-sidebar')" title="Menu">
      <i class="ph ph-list text-2xl"></i>
    </button>
    <!-- Espace flexible pour pousser les icônes à droite -->
    <div class="flex-1"></div>
    <!-- Icône chat toujours visible à droite avec badge non lus -->
    <div class="relative">
      <button @click="$emit('toggle-chat')" class="p-2 hover:theme-bg rounded-lg transition text-gray-600 dark:text-gray-300 ml-2" title="Chat">
        <i class="ph ph-chat-circle-dots text-xl"></i>
        <span v-if="chatStore.unreadCount > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
          {{ chatStore.unreadCount > 9 ? '9+' : chatStore.unreadCount }}
        </span>
      </button>
    </div>
    <!-- Actions dynamiques (desktop et mobile, sans doublon, tout via v-for) -->
    <div class="flex items-center gap-2 md:gap-4">
        <template v-for="action in visibleActions" :key="action.key">
          <button
            @click="action.handler()"
            class="p-2 hover:theme-bg rounded-lg transition text-gray-600 dark:text-gray-300"
            :title="action.label"
          >
            <i :class="action.icon + ' text-xl'"></i>
            <!-- Badges pour notifications et reviews -->
            <span v-if="action.key === 'notifications' && notificationsStore.unreadCount > 0" class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {{ notificationsStore.unreadCount > 9 ? '9+' : notificationsStore.unreadCount }}
            </span>
            <span v-if="action.key === 'reviews' && reviewPendingCount > 0" class="absolute top-1 right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
              {{ reviewPendingCount }}
            </span>
            <span v-if="action.key === 'video' && videoActive" class="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
          </button>
          <!-- Menu thème spécial -->
          <div v-if="action.key === 'theme'" class="relative group">
            <button
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-300"
              title="Changer de thème"
            >
              <i class="ph ph-palette text-xl"></i>
            </button>
            <div class="absolute right-0 mt-2 w-48 theme-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto z-50">
              <div class="p-2 space-y-1">
                <button
                  v-for="themeOption in availableThemes"
                  :key="themeOption.name"
                  @click="theme.applyTheme(themeOption.name)"
                  class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2"
                  :class="{ 'bg-indigo-50 dark:bg-indigo-900': theme.currentTheme.value === themeOption.name }"
                >
                  <div class="w-4 h-4 rounded" :style="{ backgroundColor: themeOption.primary }"></div>
                  <span>{{ themeOption.displayName }}</span>
                  <i v-if="theme.currentTheme.value === themeOption.name" class="ph ph-check ml-auto text-green-600"></i>
                </button>
              </div>
            </div>
          </div>
        </template>
        <!-- Bouton overflow ... (toujours visible si overflowActions, mobile ou desktop) -->
        <div v-if="overflowActions.length > 0" class="relative">
          <button ref="overflowBtn" @click="toggleOverflow" class="p-2 hover:theme-bg rounded-lg transition text-gray-600 dark:text-gray-300" title="Plus d'actions">
            <i class="ph ph-dots-three-outline text-xl"></i>
          </button>
          <div v-if="showOverflow" ref="overflowMenu" :style="overflowMenuStyle" class="absolute right-0 mt-2 w-48 theme-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
            <div class="p-2 space-y-1">
              <button v-for="action in overflowActions" :key="action.key" @click="handleOverflowAction(action)" class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm flex items-center gap-2">
                <i :class="action.icon + ' text-xl'"></i>
                <span>{{ action.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- Toutes les actions dynamiques sont gérées par le v-for ci-dessus. -->

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
          class="absolute right-0 mt-2 w-96 theme-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
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
              <p class="text-xs mt-2 opacity-75">Les notifications apparaîtront ici quand vous serez assigné à des LO, quand des deadlines seront fixées, ou quand une review sera demandée.</p>
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
          <UserAvatar :email="authStore.userData?.email || ''" :size="40" :hasStar="userHasGoldFrame" />

        </button>

        <!-- Settings Dropdown -->
        <div
          v-if="showSettings"
          v-click-away="() => showSettings = false"
          class="absolute right-0 mt-2 w-80 theme-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50"
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

              <button @click="playSound(authStore.userData?.prefSound || 'beep')" class="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
                Écouter
              </button> 
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

            <!-- Push Notifications -->
            <div>
              <button
                @click="showNotificationSettings = !showNotificationSettings"
                class="w-full flex items-center justify-between py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition"
              >
                <span class="flex items-center gap-2">
                  <i class="ph ph-bell"></i>
                  Notifications Push
                </span>
                <i class="ph ph-caret-down" :class="{ 'rotate-180': showNotificationSettings }"></i>
              </button>
              
              <div v-if="showNotificationSettings" class="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <NotificationSettings />
              </div>
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
  </header>
</template>

<script setup lang="ts">
import { useChatStore } from '@/stores/chat'
import { onMounted, onBeforeUnmount, nextTick } from 'vue'
import NotificationSettings from '@/components/common/NotificationSettings.vue'

const showOverflow = ref(false)
const themeSelector = ref(false)
const showNotificationSettings = ref(false)
const overflowBtn = ref<HTMLElement | null>(null)
const overflowMenu = ref<HTMLElement | null>(null)
const overflowMenuStyle = ref({ right: '0', top: '2.5rem', width: '10rem' })

const emit = defineEmits<{
  (e: 'toggle-chat'): void
  (e: 'toggle-video'): void
  (e: 'toggle-history'): void
  (e: 'toggle-magic-import'): void
  (e: 'toggle-export'): void
  (e: 'toggle-referential'): void
  (e: 'toggle-reviews'): void
  (e: 'toggle-sidebar'): void
}>()

// Toutes les actions à répartir dynamiquement (hors chat)
const dynamicActions = [
  { key: 'magic-import', label: 'Import magique', icon: 'ph ph-magic-wand', handler: () => emit('toggle-magic-import') },
  { key: 'export', label: 'Exporter', icon: 'ph ph-export', handler: () => emit('toggle-export') },
  { key: 'theme', label: 'Thème', icon: 'ph ph-palette', handler: () => themeSelector.value = !themeSelector.value },
  { key: 'video', label: 'Visioconférence', icon: 'ph ph-video-camera', handler: () => emit('toggle-video') },
  { key: 'reviews', label: 'Reviews', icon: 'ph ph-checks', handler: () => emit('toggle-reviews') },
  { key: 'notifications', label: 'Notifications', icon: 'ph ph-bell', handler: () => showNotifications.value = !showNotifications.value },
  { key: 'import-jsonld', label: 'Importer JSON-LD', icon: 'ph ph-file-arrow-up', handler: () => importJSONLD() },
  { key: 'firebase-mode', label: 'Basculer Firebase', icon: 'ph ph-database', handler: () => toggleFirebaseMode() },
  { key: 'dark-mode', label: 'Mode sombre', icon: 'ph ph-moon', handler: () => darkMode.toggle() }
]

const visibleActions = ref([] as typeof dynamicActions)
const overflowActions = ref([] as typeof dynamicActions)

function updateOverflowActions() {
  // Largeur max forcée à 44px pour test : tout va dans le menu overflow
  const maxWidth = 44
  let used = 0
  const actionWidths = [44, 44, 44, 44, 44, 44, 44, 44, 44]
  visibleActions.value = []
  overflowActions.value = []
  for (let i = 0; i < dynamicActions.length; i++) {
    if (used + actionWidths[i] <= maxWidth) {
      visibleActions.value.push(dynamicActions[i])
      used += actionWidths[i]
    } else {
      overflowActions.value.push(dynamicActions[i])
    }
  }
  // DEBUG : forcer l'affichage du bouton overflow même si aucune action n'est overflow
  if (overflowActions.value.length === 0 && dynamicActions.length > 0) {
    overflowActions.value.push(dynamicActions[dynamicActions.length - 1])
    visibleActions.value.pop()
  }
}

// Toujours mettre à jour lors du resize et au montage
onMounted(() => {
  updateOverflowActions()
  window.addEventListener('resize', updateOverflowActions)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateOverflowActions)
})

// Watcher pour forcer la mise à jour si la taille de la fenêtre change (sécurité)
watch(() => window.innerWidth, () => {
  updateOverflowActions()
})

function handleOverflowAction(action: any) {
  if (action.key === 'theme') {
    themeSelector.value = !themeSelector.value
  } else {
    action.handler()
    showOverflow.value = false
  }
}

function toggleOverflow() {
  showOverflow.value = !showOverflow.value
  if (showOverflow.value) {
    nextTick(() => {
      positionOverflowMenu()
    })
  }
}

function positionOverflowMenu() {
  if (!overflowBtn.value || !overflowMenu.value) return
  const btnRect = overflowBtn.value.getBoundingClientRect()
  overflowMenuStyle.value = {
    right: '0',
    top: `${btnRect.height + 8}px`,
    width: '10rem'
  }
}

function handleClickOutside(event: MouseEvent) {
  if (
    showOverflow.value &&
    overflowMenu.value &&
    !overflowMenu.value.contains(event.target as Node) &&
    overflowBtn.value &&
    !overflowBtn.value.contains(event.target as Node)
  ) {
    showOverflow.value = false
    themeSelector.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  updateOverflowActions()
  window.addEventListener('resize', updateOverflowActions)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', updateOverflowActions)
})
import { storeToRefs } from 'pinia'
import { useExtendedGamificationStore } from '@/stores/extendedGamification'

const gamificationStore = useExtendedGamificationStore()
const { userInventory } = storeToRefs(gamificationStore)
const userHasGoldFrame = computed(() => {
  return userInventory.value?.items?.some(item => item.itemId === 'avatar-frame-gold')
})
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useNotificationsStore } from '@/stores/notifications'
import { useCompetencesStore } from '@/stores/competences'
import { useDarkMode } from '@/composables/useDarkMode'
import { useTheme } from '@/composables/useTheme'
import { useGemini } from '@/composables/useGemini'
import { useToast } from '@/composables/useToast'
import { formatDate, playSound } from '@/utils/helpers'
import { SOUND_OPTIONS, AI_MODELS } from '@/types'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import { useOnboardingTour } from '@/composables/useOnboardingTour'
import { useReviewRequests } from '@/composables/useReviewRequests'
import { useGamification } from '@/composables/useGamification'
import { useUserPreferences } from '@/composables/useUserPreferences'

defineProps<{
  videoActive?: boolean
}>()

const onboardingTour = useOnboardingTour()

const restartTour = () => {
  onboardingTour.resetTour()
  onboardingTour.startTour()
  showSettings.value = false
}


const route = useRoute()
const authStore = useAuthStore()
const chatStore = useChatStore()
const notificationsStore = useNotificationsStore()
const competencesStore = useCompetencesStore()
const darkMode = useDarkMode()
const theme = useTheme()
const { validateApiKey } = useGemini()
const { success } = useToast()
const { toggleFirebaseMode, view } = useUserPreferences()

// Debug notifications in development
if (typeof console !== 'undefined') {
  console.log('[DigComp] App initialized successfully')
}

const { pendingCount: reviewPendingCount } = useReviewRequests()
const { userStats: gamificationStats } = useGamification()

const showNotifications = ref(false)
const showSettings = ref(false)

const availableThemes = computed(() => theme.getThemeList())

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

const importJSONLD = async () => {
  if (confirm('Êtes-vous sûr de vouloir importer les données JSON-LD ? Cela remplacera toutes les données actuelles.')) {
    await competencesStore.importFromJSONLD()
  }
}

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

// Notification helpers
const getNotificationIcon = (type: string) => {
  const icons: Record<string, string> = {
    assignment: 'ph ph-user-plus',
    status_change: 'ph ph-arrow-right',
    comment: 'ph ph-chat-circle',
    calendar: 'ph ph-calendar',
    deadline: 'ph ph-calendar-x',
    review: 'ph ph-user-check',
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
    deadline: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    review: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
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
</script>
