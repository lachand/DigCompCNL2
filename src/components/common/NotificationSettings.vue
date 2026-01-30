<template>
  <div class="notification-settings">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Notifications Push
      </h3>
      <div class="flex items-center space-x-2">
        <i 
          :class="[
            'w-5 h-5',
            isEnabled ? 'ph ph-bell text-green-500' : 'ph ph-bell-slash text-gray-400'
          ]"
        ></i>
        <span class="text-sm" :class="isEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500'">
          {{ isEnabled ? 'Activées' : 'Désactivées' }}
        </span>
      </div>
    </div>

    <!-- Support Check -->
    <div v-if="!isSupported" class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <div class="flex items-center">
        <i class="ph ph-warning w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2"></i>
        <p class="text-yellow-800 dark:text-yellow-200">
          Les notifications push ne sont pas supportées sur ce navigateur.
        </p>
      </div>
    </div>

    <!-- Permission Request -->
    <div v-else-if="!isEnabled" class="mb-6">
      <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
        <div class="flex items-start">
          <i class="ph ph-info w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0"></i>
          <div class="flex-1">
            <h4 class="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Activez les notifications pour ne rien manquer !
            </h4>
            <p class="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Recevez des notifications pour les nouveaux messages, mentions, deadlines et achievements.
            </p>
            <button
              @click="requestPermission"
              :disabled="isRegistering"
              class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              <i 
                v-if="isRegistering"
                class="ph ph-spinner w-4 h-4 mr-2 animate-spin"
              ></i>
              <i 
                v-else
                class="ph ph-bell w-4 h-4 mr-2"
              ></i>
              {{ isRegistering ? 'Activation...' : 'Activer les notifications' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Notification Preferences -->
    <div v-else class="space-y-6">
      <!-- Status -->
      <div class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div class="flex items-center">
          <i class="ph ph-check-circle w-5 h-5 text-green-600 dark:text-green-400 mr-2"></i>
          <span class="text-green-800 dark:text-green-200 font-medium">
            Notifications activées
          </span>
        </div>
      </div>

      <!-- Preferences -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 class="font-medium text-gray-900 dark:text-white mb-4">
          Types de notifications
        </h4>
        
        <div class="space-y-4">
          <NotificationToggle
            v-model="localPreferences.chat"
            title="Messages du chat"
            description="Notifications pour les nouveaux messages du chat en temps réel"
            icon="chat-bubble-left-right"
          />
          
          <NotificationToggle
            v-model="localPreferences.mentions"
            title="Mentions"
            description="Notifications quand vous êtes mentionné dans un commentaire"
            icon="at-symbol"
          />
          
          <NotificationToggle
            v-model="localPreferences.deadlines"
            title="Échéances"
            description="Rappels pour les deadlines approchantes"
            icon="calendar"
          />
          
          <NotificationToggle
            v-model="localPreferences.gamification"
            title="Gamification"
            description="Notifications pour les nouveaux achievements et récompenses"
            icon="trophy"
          />
          
          <NotificationToggle
            v-model="localPreferences.reviews"
            title="Demandes de révision"
            description="Notifications pour les nouvelles demandes de révision"
            icon="eye"
          />
        </div>
      </div>

      <!-- Test Section -->
      <div class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h4 class="font-medium text-gray-900 dark:text-white mb-4">
          Test des notifications
        </h4>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Envoyez une notification de test pour vérifier que tout fonctionne correctement.
        </p>
        <button
          @click="sendTestNotification"
          class="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
        >
          <i class="ph ph-bell w-4 h-4 mr-2"></i>
          Envoyer un test
        </button>
      </div>

      <!-- Technical Info -->
      <details class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <summary class="font-medium text-gray-900 dark:text-white cursor-pointer">
          Informations techniques
        </summary>
        <div class="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong>Permission:</strong> {{ permission }}
          </div>
          <div>
            <strong>Token:</strong> 
            <code class="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs break-all">
              {{ token ? `${token.slice(0, 20)}...` : 'Non disponible' }}
            </code>
          </div>
          <div>
            <strong>Support:</strong> {{ isSupported ? 'Oui' : 'Non' }}
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import NotificationToggle from './NotificationToggle.vue'
import { usePushNotifications } from '@/composables/usePushNotifications'

const {
  isSupported,
  permission,
  token,
  isRegistering,
  isEnabled,
  notificationPreferences,
  requestPermission,
  updateNotificationPreferences,
  sendTestNotification,
  initialize
} = usePushNotifications()

// Local preferences for reactive updates
const localPreferences = ref({ ...notificationPreferences.value })

// Watch for changes and update
watch(
  localPreferences,
  (newPrefs) => {
    updateNotificationPreferences(newPrefs)
  },
  { deep: true }
)

// Watch for external changes
watch(
  notificationPreferences,
  (newPrefs) => {
    localPreferences.value = { ...newPrefs }
  },
  { deep: true }
)

onMounted(() => {
  initialize()
})
</script>