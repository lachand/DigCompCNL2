<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md"
        :class="toastClasses(toast.type)"
      >
        <i class="ph text-xl flex-shrink-0" :class="toastIcon(toast.type)"></i>
        <p class="flex-1 font-medium">{{ toast.message }}</p>
        <button
          @click="removeToast(toast.id)"
          class="flex-shrink-0 hover:opacity-70 transition"
        >
          <i class="ph ph-x"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import type { Toast } from '@/types'

const { toasts, removeToast } = useToast()

const toastClasses = (type: Toast['type']) => {
  const classes = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white'
  }
  return classes[type]
}

const toastIcon = (type: Toast['type']) => {
  const icons = {
    success: 'ph-check-circle',
    error: 'ph-x-circle',
    info: 'ph-info'
  }
  return icons[type]
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
