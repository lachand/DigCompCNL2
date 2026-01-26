<template>
  <div
    v-if="isVisible"
    class="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl overflow-hidden"
    :style="windowStyle"
    @mousedown="startDrag"
  >
    <!-- Header -->
    <div
      class="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex items-center justify-between cursor-move"
      @mousedown="startDrag"
    >
      <div class="flex items-center gap-2">
        <i class="ph ph-video-camera text-indigo-600 dark:text-indigo-400"></i>
        <span class="font-medium text-gray-900 dark:text-white text-sm">Visioconférence</span>
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
const jitsiContainer = ref<HTMLDivElement>()
const jitsiApi = ref<any>(null)

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

const initJitsi = () => {
  if (!jitsiContainer.value) return

  const domain = 'meet.jit.si'
  const options = {
    roomName: props.roomName,
    width: containerWidth.value,
    height: containerHeight.value,
    parentNode: jitsiContainer.value,
    userInfo: {
      email: authStore.currentUser?.email,
      displayName: authStore.currentUser?.email?.split('@')[0]
    },
    configOverwrite: {
      startWithAudioMuted: true,
      startWithVideoMuted: true,
      prejoinPageEnabled: false
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'closedcaptions', 'desktop',
        'fullscreen', 'hangup', 'chat', 'raisehand',
        'tileview'
      ]
    }
  }

  // @ts-ignore
  jitsiApi.value = new JitsiMeetExternalAPI(domain, options)
}

const toggleSize = () => {
  isMinimized.value = !isMinimized.value
}

const open = () => {
  isVisible.value = true
  setTimeout(() => {
    initJitsi()
  }, 100)
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

  // Load Jitsi script
  const script = document.createElement('script')
  script.src = 'https://meet.jit.si/external_api.js'
  document.head.appendChild(script)
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
