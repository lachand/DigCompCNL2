<template>
  <div class="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
    <div class="flex items-start space-x-3">
      <div class="flex-shrink-0 mt-1">
        <i 
          :class="`ph ph-${getPhosphorIcon(icon)} w-5 h-5 text-gray-600 dark:text-gray-400`"
        ></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 dark:text-white">
          {{ title }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ description }}
        </p>
      </div>
    </div>
    
    <div class="flex-shrink-0 ml-4">
      <button
        @click="toggle"
        :class="[
          'relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
          modelValue 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500'
        ]"
        :aria-label="`${modelValue ? 'Désactiver' : 'Activer'} ${title}`"
      >
        <span
          :class="[
            'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out',
            modelValue ? 'translate-x-6' : 'translate-x-1'
          ]"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">

interface Props {
  modelValue: boolean
  title: string
  description: string
  icon: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getPhosphorIcon = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'chat-bubble-left-right': 'chat-dots',
    'at-symbol': 'at',
    'calendar': 'calendar',
    'trophy': 'trophy',
    'eye': 'eye'
  }
  return iconMap[iconName] || iconName
}

const toggle = () => {
  emit('update:modelValue', !props.modelValue)
}
</script>