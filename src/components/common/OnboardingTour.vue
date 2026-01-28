<template>
  <!-- Welcome modal (shown once on first login) -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="showWelcome" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white text-center">
            <i class="ph ph-graduation-cap text-5xl mb-3"></i>
            <h2 class="text-2xl font-bold">Bienvenue sur DigComp</h2>
            <p class="mt-2 text-indigo-100">Plateforme collaborative de gestion des competences numeriques</p>
          </div>
          <div class="p-6">
            <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Cette application vous permet de gerer les acquis d'apprentissage du referentiel DigComp
              a travers les trois annees de licence (L1, L2, L3). Vous pouvez collaborer en equipe,
              generer du contenu pedagogique avec l'IA et suivre la progression en temps reel.
            </p>
            <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <i class="ph ph-list-checks text-indigo-500"></i>
                <span>Learning Outcomes</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <i class="ph ph-sparkle text-purple-500"></i>
                <span>Assistant IA</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <i class="ph ph-users text-green-500"></i>
                <span>Collaboration</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <i class="ph ph-chart-bar text-orange-500"></i>
                <span>Statistiques</span>
              </div>
            </div>
          </div>
          <div class="px-6 pb-6 flex gap-3">
            <button
              @click="skipAll"
              class="flex-1 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Passer
            </button>
            <button
              @click="beginTour"
              class="flex-1 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
            >
              <i class="ph ph-compass mr-1"></i>
              Visite guidee
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Tour overlay + tooltip -->
    <div v-if="tour.tourActive.value" class="fixed inset-0 z-[90]">
      <!-- Dark overlay with spotlight hole -->
      <div class="absolute inset-0 bg-black/40 transition-all duration-300" @click="tour.skipTour()"></div>

      <!-- Spotlight cutout with glow effect -->
      <svg class="absolute inset-0 pointer-events-none z-[91]">
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white"/>
            <rect
              v-if="spotlightRect"
              :x="spotlightRect.left - PADDING"
              :y="spotlightRect.top - PADDING"
              :width="spotlightRect.width + PADDING * 2"
              :height="spotlightRect.height + PADDING * 2"
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="black" mask="url(#tour-mask)" opacity="0.4"/>
      </svg>

      <!-- Spotlight ring -->
      <div
        v-if="spotlightRect"
        class="absolute bg-transparent rounded-lg ring-4 ring-indigo-400 ring-offset-4 ring-offset-transparent transition-all duration-300 pointer-events-none z-[91] shadow-lg"
        :style="spotlightStyle"
      ></div>

      <!-- Tooltip -->
      <div
        v-if="tour.currentStep.value"
        class="absolute z-[92] w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 pointer-events-auto"
        :style="tooltipStyle"
      >
        <!-- Arrow -->
        <div class="absolute w-3 h-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rotate-45" :style="arrowStyle"></div>

        <div class="p-5 relative">
          <!-- Step counter + Close button -->
          <div class="flex items-center justify-between mb-3">
            <span class="inline-block px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 rounded">
              {{ tour.currentStepIndex.value + 1 }}/{{ tour.totalSteps.value }}
            </span>
            <button
              @click="tour.skipTour()"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Fermer la visite"
            >
              <i class="ph ph-x text-sm"></i>
            </button>
          </div>

          <!-- Title + Content -->
          <h3 class="font-bold text-lg text-gray-900 dark:text-white mb-2">{{ tour.currentStep.value.title }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{{ tour.currentStep.value.content }}</p>

          <!-- Progress dots - clickable to jump to steps -->
          <div class="flex items-center justify-center gap-2 mb-4">
            <button
              v-for="(_, index) in Array(tour.totalSteps.value)"
              :key="index"
              @click="tour.goToStep(index)"
              class="transition-all rounded-full hover:scale-125"
              :title="`Aller à l'étape ${index + 1}`"
              :class="index === tour.currentStepIndex.value
                ? 'w-3 h-3 bg-indigo-600 dark:bg-indigo-400'
                : index < tour.currentStepIndex.value
                  ? 'w-2 h-2 bg-indigo-300 dark:bg-indigo-600'
                  : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'"
            ></button>
          </div>

          <!-- Navigation buttons -->
          <div class="flex gap-2">
            <button
              v-if="!tour.isFirstStep.value"
              @click="tour.prevStep()"
              class="flex-1 py-2 px-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition font-medium flex items-center justify-center gap-2"
              title="Étape précédente (← ou Shift+Tab)"
            >
              <i class="ph ph-arrow-left"></i>
              Précédent
            </button>
            <button
              @click="tour.nextStep()"
              class="flex-1 py-2 px-3 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
              :title="tour.isLastStep.value ? 'Terminer la visite (Entrée)' : 'Étape suivante (→)'"
            >
              {{ tour.isLastStep.value ? 'Terminer' : 'Suivant' }}
              <i :class="tour.isLastStep.value ? 'ph ph-check' : 'ph ph-arrow-right'"></i>
            </button>
          </div>

          <!-- Keyboard hints -->
          <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <p class="text-xs text-gray-400 dark:text-gray-500 text-center">
              <kbd class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">→</kbd>
              <kbd class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">←</kbd>
              Navigation · 
              <kbd class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">Esc</kbd>
              Fermer
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useOnboardingTour } from '@/composables/useOnboardingTour'

const tour = useOnboardingTour()
const showWelcome = ref(false)
const spotlightRect = ref<DOMRect | null>(null)

onMounted(() => {
  if (tour.shouldShowTour.value) {
    // Show welcome after a short delay
    setTimeout(() => {
      showWelcome.value = true
    }, 800)
  }
})

const beginTour = () => {
  showWelcome.value = false
  tour.startTour()
}

const skipAll = () => {
  showWelcome.value = false
  tour.skipTour()
}

// Retry counter for element visibility
let retryCount = 0
const MAX_RETRIES = 5

// Track target element position
const updateSpotlight = async () => {
  await nextTick()
  const step = tour.currentStep.value
  if (!step) {
    spotlightRect.value = null
    retryCount = 0
    return
  }

  let el = document.querySelector(step.target)
  
  // If element not found, retry a few times (for async-rendered elements)
  if (!el && retryCount < MAX_RETRIES) {
    retryCount++
    setTimeout(() => updateSpotlight(), 300)
    return
  }

  retryCount = 0

  if (el) {
    spotlightRect.value = el.getBoundingClientRect()
    // Scroll element into view if needed
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  } else {
    console.warn(`Tour step target not found: ${step.target}`)
    spotlightRect.value = null
  }
}

watch(() => tour.currentStepIndex.value, updateSpotlight)
watch(() => tour.tourActive.value, (active) => {
  if (active) updateSpotlight()
})

// Update on resize
const onResize = () => {
  if (tour.tourActive.value) updateSpotlight()
}
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

// Keyboard navigation
const onKeydown = (e: KeyboardEvent) => {
  if (!tour.tourActive.value) return
  
  switch (e.key) {
    case 'ArrowRight':
    case 'Enter':
      e.preventDefault()
      tour.nextStep()
      break
    case 'ArrowLeft':
      e.preventDefault()
      if (!tour.isFirstStep.value) tour.prevStep()
      break
    case 'Escape':
      e.preventDefault()
      tour.skipTour()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
})

const PADDING = 8

const spotlightStyle = computed(() => {
  if (!spotlightRect.value) return { display: 'none' }
  const r = spotlightRect.value
  return {
    top: (r.top - PADDING) + 'px',
    left: (r.left - PADDING) + 'px',
    width: (r.width + PADDING * 2) + 'px',
    height: (r.height + PADDING * 2) + 'px'
  }
})

const tooltipStyle = computed(() => {
  if (!spotlightRect.value || !tour.currentStep.value) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  const r = spotlightRect.value
  const pos = tour.currentStep.value.position
  const gap = 16

  switch (pos) {
    case 'bottom':
      return {
        top: (r.bottom + gap) + 'px',
        left: Math.max(16, Math.min(window.innerWidth - 336, r.left + r.width / 2 - 160)) + 'px'
      }
    case 'top':
      return {
        bottom: (window.innerHeight - r.top + gap) + 'px',
        left: Math.max(16, Math.min(window.innerWidth - 336, r.left + r.width / 2 - 160)) + 'px'
      }
    case 'right':
      return {
        top: Math.max(16, r.top + r.height / 2 - 80) + 'px',
        left: (r.right + gap) + 'px'
      }
    case 'left':
      return {
        top: Math.max(16, r.top + r.height / 2 - 80) + 'px',
        right: (window.innerWidth - r.left + gap) + 'px'
      }
    default:
      return {
        top: (r.bottom + gap) + 'px',
        left: r.left + 'px'
      }
  }
})

const arrowStyle = computed(() => {
  if (!tour.currentStep.value) return { display: 'none' }
  const pos = tour.currentStep.value.position

  switch (pos) {
    case 'bottom':
      return { top: '-7px', left: '50%', marginLeft: '-6px', borderRight: 'none', borderBottom: 'none' }
    case 'top':
      return { bottom: '-7px', left: '50%', marginLeft: '-6px', borderLeft: 'none', borderTop: 'none' }
    case 'right':
      return { left: '-7px', top: '24px', borderTop: 'none', borderRight: 'none' }
    case 'left':
      return { right: '-7px', top: '24px', borderBottom: 'none', borderLeft: 'none' }
    default:
      return { display: 'none' }
  }
})

// Rewatch step changes to update spotlight
watch(() => tour.currentStepIndex.value, updateSpotlight)
watch(() => tour.tourActive.value, (active) => {
  if (active) {
    setTimeout(updateSpotlight, 100)
  }
})
</script>
