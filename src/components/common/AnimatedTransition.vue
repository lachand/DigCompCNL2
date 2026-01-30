<template>
  <Transition
    :name="transitionName"
    :mode="mode"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <slot />
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAnimations } from '@/composables/useAnimations'

interface Props {
  name?: 'fade' | 'slide' | 'scale' | 'bounce' | 'flip'
  mode?: 'in-out' | 'out-in' | 'default'
  duration?: number
  easing?: string
  disabled?: boolean
}

interface Emits {
  (e: 'before-enter', el: Element): void
  (e: 'enter', el: Element): void
  (e: 'after-enter', el: Element): void
  (e: 'before-leave', el: Element): void
  (e: 'leave', el: Element): void
  (e: 'after-leave', el: Element): void
}

const props = withDefaults(defineProps<Props>(), {
  name: 'fade',
  mode: 'default',
  duration: 300,
  easing: 'ease-out',
  disabled: false
})

const emit = defineEmits<Emits>()

const { isAnimationEnabled } = useAnimations()

const transitionName = computed(() => {
  if (props.disabled || !isAnimationEnabled.value) {
    return 'none'
  }
  return props.name
})

// Transition hooks
const onBeforeEnter = (el: Element) => {
  emit('before-enter', el)
}

const onEnter = (el: Element) => {
  emit('enter', el)
}

const onAfterEnter = (el: Element) => {
  emit('after-enter', el)
}

const onBeforeLeave = (el: Element) => {
  emit('before-leave', el)
}

const onLeave = (el: Element) => {
  emit('leave', el)
}

const onAfterLeave = (el: Element) => {
  emit('after-leave', el)
}
</script>

<style scoped>
/* Fade transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all v-bind('props.duration + "ms"') v-bind('props.easing');
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Slide transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all v-bind('props.duration + "ms"') v-bind('props.easing');
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Scale transitions */
.scale-enter-active,
.scale-leave-active {
  transition: all v-bind('props.duration + "ms"') v-bind('props.easing');
}

.scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.scale-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* Bounce transitions */
.bounce-enter-active {
  animation: bounce-in v-bind('props.duration + "ms"') v-bind('props.easing');
}

.bounce-leave-active {
  animation: bounce-out v-bind('props.duration + "ms"') v-bind('props.easing');
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  30% {
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(0.3);
  }
}

/* Flip transitions */
.flip-enter-active,
.flip-leave-active {
  transition: all v-bind('props.duration + "ms"') v-bind('props.easing');
}

.flip-enter-from {
  opacity: 0;
  transform: rotateY(-90deg);
}

.flip-leave-to {
  opacity: 0;
  transform: rotateY(90deg);
}

/* No transition */
.none-enter-active,
.none-leave-active {
  transition: none !important;
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active,
  .slide-enter-active,
  .slide-leave-active,
  .scale-enter-active,
  .scale-leave-active,
  .bounce-enter-active,
  .bounce-leave-active,
  .flip-enter-active,
  .flip-leave-active {
    transition: none !important;
    animation: none !important;
  }
  
  .fade-enter-from,
  .slide-enter-from,
  .scale-enter-from,
  .flip-enter-from {
    opacity: 1;
    transform: none;
  }
  
  .fade-leave-to,
  .slide-leave-to,
  .scale-leave-to,
  .flip-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>