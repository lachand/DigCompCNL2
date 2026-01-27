<template>
  <div
    v-if="isVisible"
    class="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden"
    :style="windowStyle"
  >
    <!-- Header -->
    <div
      class="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex items-center justify-between cursor-move select-none"
      @mousedown.prevent="startDrag"
    >
      <div class="flex items-center gap-2">
        <i class="ph ph-video-camera text-indigo-600 dark:text-indigo-400"></i>
        <span class="font-medium text-gray-900 dark:text-white text-sm">Visioconference</span>
        <span v-if="isMinimized" class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      </div>
      <div class="flex items-center gap-1">
        <button
          @click="toggleSize"
          class="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
          :title="isMinimized ? 'Restaurer' : 'Minimiser'"
        >
          <i class="ph" :class="isMinimized ? 'ph-arrows-out' : 'ph-arrows-in'"></i>
        </button>
        <button
          @click="close"
          class="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded transition"
          title="Fermer"
        >
          <i class="ph ph-x"></i>
        </button>
      </div>
    </div>

    <!-- Jitsi Container -->
    <div
      v-show="!isMinimized"
      ref="jitsiContainer"
      :style="{ width: '100%', height: currentHeight + 'px' }"
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
    <div v-if="isMinimized" class="px-4 py-3 flex items-center gap-3">
      <span class="relative flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </span>
      <p class="text-sm text-gray-600 dark:text-gray-400">Appel en cours — {{ roomName }}</p>
    </div>

    <!-- Resize handles (only when not minimized) -->
    <template v-if="!isMinimized">
      <!-- Right edge -->
      <div
        class="absolute top-0 right-0 w-1.5 h-full cursor-ew-resize hover:bg-indigo-400/30 transition-colors"
        @mousedown.prevent="startResize('e', $event)"
      ></div>
      <!-- Bottom edge -->
      <div
        class="absolute bottom-0 left-0 h-1.5 w-full cursor-ns-resize hover:bg-indigo-400/30 transition-colors"
        @mousedown.prevent="startResize('s', $event)"
      ></div>
      <!-- Bottom-right corner -->
      <div
        class="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        @mousedown.prevent="startResize('se', $event)"
      >
        <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" viewBox="0 0 16 16" fill="currentColor">
          <path d="M14 14H12V12H14V14ZM14 10H12V8H14V10ZM10 14H8V12H10V14Z" />
        </svg>
      </div>
      <!-- Left edge -->
      <div
        class="absolute top-0 left-0 w-1.5 h-full cursor-ew-resize hover:bg-indigo-400/30 transition-colors"
        @mousedown.prevent="startResize('w', $event)"
      ></div>
      <!-- Bottom-left corner -->
      <div
        class="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize"
        @mousedown.prevent="startResize('sw', $event)"
      ></div>
    </template>
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

// Whether a call is active (visible and initialized)
const isActive = computed(() => isVisible.value && jitsiApi.value !== null)

// Dragging
const isDragging = ref(false)
const position = ref({ x: window.innerWidth - 520, y: 20 })
const dragOffset = ref({ x: 0, y: 0 })

// Resizable dimensions
const MIN_WIDTH = 320
const MIN_HEIGHT = 240
const currentWidth = ref(500)
const currentHeight = ref(380)

// Resize state
const isResizing = ref(false)
const resizeDirection = ref('')
const resizeStart = ref({ x: 0, y: 0, w: 0, h: 0, left: 0 })

const windowStyle = computed(() => {
  if (isMinimized.value) {
    return {
      left: position.value.x + 'px',
      top: position.value.y + 'px',
      width: '280px'
    }
  }
  return {
    left: position.value.x + 'px',
    top: position.value.y + 'px',
    width: currentWidth.value + 'px'
  }
})

// --- Drag ---
const startDrag = (e: MouseEvent) => {
  if (isResizing.value) return
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
}

const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return
  const w = isMinimized.value ? 280 : currentWidth.value
  position.value = {
    x: Math.max(0, Math.min(window.innerWidth - w, e.clientX - dragOffset.value.x)),
    y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.value.y))
  }
}

const stopDrag = () => {
  isDragging.value = false
}

// --- Resize ---
const startResize = (direction: string, e: MouseEvent) => {
  isResizing.value = true
  resizeDirection.value = direction
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    w: currentWidth.value,
    h: currentHeight.value,
    left: position.value.x
  }
}

const onResize = (e: MouseEvent) => {
  if (!isResizing.value) return

  const dx = e.clientX - resizeStart.value.x
  const dy = e.clientY - resizeStart.value.y
  const dir = resizeDirection.value

  if (dir.includes('e')) {
    currentWidth.value = Math.max(MIN_WIDTH, resizeStart.value.w + dx)
  }
  if (dir.includes('w')) {
    const newW = Math.max(MIN_WIDTH, resizeStart.value.w - dx)
    const actualDx = resizeStart.value.w - newW
    currentWidth.value = newW
    position.value.x = resizeStart.value.left + actualDx
  }
  if (dir.includes('s')) {
    currentHeight.value = Math.max(MIN_HEIGHT, resizeStart.value.h + dy)
  }
}

const stopResize = () => {
  isResizing.value = false
  resizeDirection.value = ''
}

// --- Mouse handler (shared) ---
const onMouseMove = (e: MouseEvent) => {
  onDrag(e)
  onResize(e)
}

const onMouseUp = () => {
  stopDrag()
  stopResize()
}

// JaaS 8x8.vc
const JAAS_APP_ID = 'vpaas-magic-cookie-6d9b644a44dd43169d30c23ee93d243e'

const loadScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (scriptLoaded.value || (window as any).JitsiMeetExternalAPI) {
      scriptLoaded.value = true
      resolve()
      return
    }

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
  if (isVisible.value && isMinimized.value) {
    // Already active but minimized: restore
    isMinimized.value = false
    return
  }
  if (isVisible.value) return

  isVisible.value = true
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
  isMinimized.value = false
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  close()
})

defineExpose({
  open,
  close,
  isActive
})
</script>
