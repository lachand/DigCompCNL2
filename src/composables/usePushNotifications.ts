// Composable pour les notifications push
import { ref, computed } from 'vue'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { firebaseApp } from '@/firebase/config'
import { useToast } from './useToast'

export interface PushNotificationData {
  type: 'chat' | 'deadline' | 'mention' | 'gamification' | 'review'
  title: string
  body: string
  url?: string
  icon?: string
}

export interface NotificationPermissions {
  chat: boolean
  deadlines: boolean
  mentions: boolean
  gamification: boolean
  reviews: boolean
}

export function usePushNotifications() {
  const { addToast } = useToast()
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    addToast(type, message)
  }
  
  const isSupported = ref(false)
  const permission = ref<NotificationPermission>('default')
  const token = ref<string | null>(null)
  const isRegistering = ref(false)
  const messaging = ref<ReturnType<typeof getMessaging> | null>(null)
  
  // Check if push notifications are supported
  const checkSupport = () => {
    isSupported.value = 'Notification' in window && 
                       'serviceWorker' in navigator && 
                       'PushManager' in window
    
    if (isSupported.value) {
      permission.value = Notification.permission
      try {
        messaging.value = getMessaging(firebaseApp)
      } catch (error) {
        console.warn('[Push] Firebase messaging not available:', error)
        isSupported.value = false
      }
    }
  }
  
  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported.value || !messaging.value) {
      showToast('Les notifications push ne sont pas supportées sur ce navigateur', 'error')
      return false
    }
    
    try {
      isRegistering.value = true
      
      // Request permission
      const newPermission = await Notification.requestPermission()
      permission.value = newPermission
      
      if (newPermission === 'granted') {
        // Get FCM token
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
        
        if (!vapidKey) {
          console.warn('[Push] VAPID key not configured')
          showToast('Configuration des notifications incomplète', 'warning')
          return false
        }
        
        const fcmToken = await getToken(messaging.value, {
          vapidKey: vapidKey
        })
        
        if (fcmToken) {
          token.value = fcmToken
          console.log('[Push] FCM token obtained:', fcmToken)
          
          // Save token to localStorage
          localStorage.setItem('fcm_token', fcmToken)
          localStorage.setItem('push_notifications_enabled', 'true')
          
          showToast('Notifications activées avec succès !', 'success')
          return true
        } else {
          showToast('Impossible d\'obtenir le token de notification', 'error')
          return false
        }
      } else {
        showToast('Permissions de notification refusées', 'warning')
        return false
      }
    } catch (error) {
      console.error('[Push] Error requesting permission:', error)
      showToast('Erreur lors de l\'activation des notifications', 'error')
      return false
    } finally {
      isRegistering.value = false
    }
  }
  
  // Update notification preferences
  const updateNotificationPreferences = (newPrefs: Partial<NotificationPermissions>) => {
    try {
      // Mettre à jour les préférences locales
      Object.assign(notificationPreferences.value, newPrefs)
      localStorage.setItem('notification_preferences', JSON.stringify(notificationPreferences.value))
      showToast('Préférences de notification mises à jour', 'success')
    } catch (error) {
      console.error('[Push] Error updating preferences:', error)
      showToast('Erreur lors de la mise à jour des préférences', 'error')
    }
  }
  
  // Setup foreground message listener
  const setupMessageListener = () => {
    if (!messaging.value) return
    
    onMessage(messaging.value, (payload) => {
      console.log('[Push] Foreground message received:', payload)
      
      const { notification, data } = payload
      
      // Show notification if browser supports it and permission is granted
      if ('Notification' in window && Notification.permission === 'granted') {
        const options: NotificationOptions = {
          body: notification?.body || 'Nouveau message',
          icon: notification?.icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          tag: 'digcomp-notification',
          data: data,
          requireInteraction: true
        }
        
        new Notification(notification?.title || 'DigComp CNL2', options)
      }
      
      // Show toast as fallback
      showToast(notification?.body || 'Nouvelle notification', 'info')
    })
  }
  
  // Send test notification
  const sendTestNotification = async () => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const options: NotificationOptions = {
          body: 'Ceci est une notification de test pour vérifier que tout fonctionne correctement.',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          tag: 'test-notification',
          requireInteraction: false
        }
        
        new Notification('Test de notification - DigComp CNL2', options)
        showToast('Notification de test envoyée !', 'success')
      } else {
        showToast('Les notifications ne sont pas autorisées', 'warning')
      }
    } catch (error) {
      console.error('[Push] Error sending test notification:', error)
      showToast('Erreur lors de l\'envoi de la notification de test', 'error')
    }
  }
  
  // Initialize
  const initialize = () => {
    checkSupport()
    setupMessageListener()
    
    if (typeof window !== 'undefined') {
      // Mettre à jour la permission
      permission.value = Notification.permission
      
      // Auto-restore token if available
      const savedToken = localStorage.getItem('fcm_token')
      const isEnabled = localStorage.getItem('push_notifications_enabled') === 'true'
      if (savedToken && Notification.permission === 'granted' && isEnabled) {
        token.value = savedToken
      }
    }
  }
  
  // Computed properties
  const isEnabled = computed(() => 
    isSupported.value && 
    permission.value === 'granted' && 
    localStorage.getItem('push_notifications_enabled') === 'true'
  )
  
  // Notification preferences
  const getInitialPreferences = (): NotificationPermissions => {
    try {
      const saved = localStorage.getItem('notification_preferences')
      return saved ? JSON.parse(saved) : {
        chat: true,
        deadlines: true,
        mentions: true,
        gamification: true,
        reviews: true
      }
    } catch {
      return {
        chat: true,
        deadlines: true,
        mentions: true,
        gamification: true,
        reviews: true
      }
    }
  }

  const notificationPreferences = ref<NotificationPermissions>(getInitialPreferences())
  
  return {
    // State
    isSupported: computed(() => isSupported.value),
    permission: computed(() => permission.value),
    token: computed(() => token.value),
    isRegistering: computed(() => isRegistering.value),
    isEnabled,
    notificationPreferences,
    
    // Methods
    requestPermission,
    updateNotificationPreferences,
    sendTestNotification,
    initialize
  }
}