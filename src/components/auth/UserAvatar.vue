<template>
  <div
    class="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
    :style="{ width: size + 'px', height: size + 'px', backgroundColor: color, fontSize: fontSize + 'px' }"
    :title="email"
  >
    {{ initials }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getUserColor } from '@/utils/helpers'

interface Props {
  email: string
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 32
})

const initials = computed(() => {
  if (!props.email) return '?'
  const parts = props.email.split('@')[0].split('.')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return props.email.substring(0, 2).toUpperCase()
})

const color = computed(() => getUserColor(props.email))

const fontSize = computed(() => Math.floor(props.size * 0.4))
</script>
