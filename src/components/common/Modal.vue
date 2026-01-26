<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="close"
        ></div>

        <!-- Modal -->
        <div
          class="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
          :class="sizeClasses"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div v-if="icon" class="w-10 h-10 rounded-lg flex items-center justify-center" :class="iconBgClass">
                <i class="ph text-xl" :class="[icon, iconColorClass]"></i>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ title }}</h2>
            </div>
            <button
              @click="close"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <i class="ph ph-x text-xl"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="p-6 border-t border-gray-200 dark:border-gray-700">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  title: string
  icon?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'default' | 'primary' | 'success' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  variant: 'default'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-full max-w-md',
    md: 'w-full max-w-2xl',
    lg: 'w-full max-w-4xl',
    xl: 'w-full max-w-6xl',
    full: 'w-[95vw] h-[95vh]'
  }
  return sizes[props.size]
})

const iconBgClass = computed(() => {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-700',
    primary: 'bg-indigo-100 dark:bg-indigo-900/20',
    success: 'bg-green-100 dark:bg-green-900/20',
    danger: 'bg-red-100 dark:bg-red-900/20'
  }
  return variants[props.variant]
})

const iconColorClass = computed(() => {
  const variants = {
    default: 'text-gray-600 dark:text-gray-400',
    primary: 'text-indigo-600 dark:text-indigo-400',
    success: 'text-green-600 dark:text-green-400',
    danger: 'text-red-600 dark:text-red-400'
  }
  return variants[props.variant]
})

const close = () => {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child {
  transform: scale(0.9);
}

.modal-leave-to > div:last-child {
  transform: scale(0.9);
}
</style>
