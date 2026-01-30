<template>
  <div class="loading-skeleton" :class="[
    'animate-pulse bg-gradient-to-r',
    variant === 'light' 
      ? 'from-gray-200 via-gray-300 to-gray-200' 
      : 'from-gray-700 via-gray-600 to-gray-700',
    roundedClass,
    sizeClass
  ]">
    <!-- Content placeholder for screen readers -->
    <span class="sr-only">Chargement...</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'light' | 'dark'
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  lines?: number
  avatar?: boolean
  card?: boolean
  text?: boolean
  button?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'light',
  width: '100%',
  height: '1rem',
  rounded: 'md',
  lines: 1
})

const roundedClass = computed(() => {
  const roundedMap = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }
  return roundedMap[props.rounded]
})

const sizeClass = computed(() => {
  if (props.avatar) {
    return 'w-10 h-10'
  }
  
  if (props.card) {
    return 'w-full h-48'
  }
  
  if (props.text) {
    return 'w-3/4 h-4'
  }
  
  if (props.button) {
    return 'w-24 h-10'
  }
  
  // Custom dimensions
  const width = typeof props.width === 'number' ? `${props.width}px` : props.width
  const height = typeof props.height === 'number' ? `${props.height}px` : props.height
  
  return {
    width,
    height
  }
})
</script>

<style scoped>
.loading-skeleton {
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .loading-skeleton {
    animation: none;
    background: theme('colors.gray.300');
  }
  
  .dark .loading-skeleton {
    background: theme('colors.gray.600');
  }
}
</style>