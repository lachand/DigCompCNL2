<template>
  <div
    v-if="isVisible"
    class="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden"
    :style="windowStyle"
  >
    <!-- Header -->
    <div
      class="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex items-center justify-between cursor-move"
      @mousedown="startDrag"
    >
      <div class="flex items-center gap-2">
        <i class="ph ph-video-camera text-indigo-600 dark:text-indigo-400"></i>
        <span class="font-medium text-gray-900 dark:text-white text-sm">Visioconference</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          @click="toggleSize"
          class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
        >
          <i class="ph" :class="isMinimized ? 'ph-arrows-out' : 'ph-arrows-in'"></i>
        </button>
        <button
          @click="close"
          class="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition"
        >
          <i class="ph ph-x"></i>
        </button>
      </div>
    </div>

    <!-- Jitsi Container -->
    <div
      v-show="!isMinimized"
      ref="jitsiContainer"
      :style="{ height: containerHeight + 'px' }"
    ></div>

    <!-- Loading state -->
    <div v-if="!isMinimized && isLoading" class="absolute inset-0 top-10 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="text-center">
        <i class="ph ph-spinner ph-spin text-3xl text-indigo-500 mb-2"></i>
        <p class="text-sm text-gray-500 dark:text-gray-400">Chargement de la visioconference...</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-if="!isMinimized && loadError" class="absolute inset-0 top-10 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div class="text-center p-4">
        <i class="ph ph-warning text-3xl text-red-500 mb-2"></i>
        <p class="text-sm text-red-600 dark:text-red-400">{{ loadError }}</p>
        <button @click="retryInit" class="mt-2 px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
          Reessayer
        </button>
      </div>
    </div>

    <!-- Minimized View -->
    <div v-if="isMinimized" class="p-4 text-center">
      <i class="ph ph-video-camera text-4xl text-gray-400 dark:text-gray-600 mb-2"></i>
      <p class="text-sm text-gray-600 dark:text-gray-400">{{ roomName }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

interface Props {
  roomName?: string
}

const props = withDefaults(defineProps<Props>(), {
  roomName: 'digcomp-room'
})

const authStore = useAuthStore()

const isVisible = ref(false)
const isMinimized = ref(false)
const isLoading = ref(false)
const loadError = ref('')
const jitsiContainer = ref<HTMLDivElement>()
const jitsiApi = ref<any>(null)
const scriptLoaded = ref(false)

// Dragging
const isDragging = ref(false)
const position = ref({ x: window.innerWidth - 420, y: 20 })
const dragOffset = ref({ x: 0, y: 0 })

const containerWidth = computed(() => isMinimized.value ? 300 : 400)
const containerHeight = computed(() => isMinimized.value ? 0 : 300)

const windowStyle = computed(() => ({
  left: position.value.x + 'px',
  top: position.value.y + 'px',
  width: containerWidth.value + 'px'
}))

const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return

  position.value = {
    x: Math.max(0, Math.min(window.innerWidth - containerWidth.value, e.clientX - dragOffset.value.x)),
    y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.value.y))
  }
}

const stopDrag = () => {
  isDragging.value = false
}

// JaaS 8x8.vc
const JAAS_APP_ID = 'vpaas-magic-cookie-6d9b644a44dd43169d30c23ee93d243e'

const loadScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (scriptLoaded.value || (window as any).JitsiMeetExternalAPI) {
      scriptLoaded.value = true
      resolve()
      return
    }

    // Check if script tag already exists
    const existing = document.querySelector(`script[src*="${JAAS_APP_ID}"]`)
    if (existing) {
      existing.addEventListener('load', () => {
        scriptLoaded.value = true
        resolve()
      })
      existing.addEventListener('error', () => reject(new Error('Echec du chargement du script JaaS')))
      return
    }

    const script = document.createElement('script')
    script.src = `https://8x8.vc/${JAAS_APP_ID}/external_api.js`
    script.async = true
    script.onload = () => {
      scriptLoaded.value = true
      resolve()
    }
    script.onerror = () => {
      reject(new Error('Echec du chargement du script JaaS'))
    }
    document.head.appendChild(script)
  })
}

const initJitsi = async () => {
  if (!jitsiContainer.value) return

  isLoading.value = true
  loadError.value = ''

  try {
    await loadScript()

    const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI
    if (!JitsiMeetExternalAPI) {
      throw new Error('JitsiMeetExternalAPI non disponible')
    }

    jitsiApi.value = new JitsiMeetExternalAPI('8x8.vc', {
      roomName: `${JAAS_APP_ID}/${props.roomName}`,
      parentNode: jitsiContainer.value,
      userInfo: {
        email: authStore.currentUser?.email || '',
        displayName: authStore.currentUser?.email?.split('@')[0] || 'Utilisateur'
      },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: true,
        prejoinPageEnabled: false,
        disableDeepLinking: true
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop',
          'fullscreen', 'hangup', 'chat', 'raisehand',
          'tileview', 'participants-pane'
        ]
      }
    })

    jitsiApi.value.addListener('videoConferenceLeft', () => {
      close()
    })

    isLoading.value = false
  } catch (err: any) {
    console.error('Erreur initialisation Jitsi:', err)
    loadError.value = err.message || 'Erreur de chargement'
    isLoading.value = false
  }
}

const retryInit = () => {
  loadError.value = ''
  initJitsi()
}

const toggleSize = () => {
  isMinimized.value = !isMinimized.value
}

const open = () => {
  isVisible.value = true
  // Wait for DOM update before initializing
  setTimeout(() => {
    initJitsi()
  }, 50)
}

const close = () => {
  if (jitsiApi.value) {
    jitsiApi.value.dispose()
    jitsiApi.value = null
  }
  isVisible.value = false
}

onMounted(() => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  close()
})

defineExpose({
  open,
  close
})
</script>
