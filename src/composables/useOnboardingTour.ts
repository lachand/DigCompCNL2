import { ref, computed } from 'vue'

export interface TourStep {
  id: string
  target: string // CSS selector
  title: string
  content: string
  position: 'top' | 'bottom' | 'left' | 'right'
}

const STORAGE_KEY = 'digcomp_onboarding_done'

const tourCompleted = ref(localStorage.getItem(STORAGE_KEY) === 'true')
const tourActive = ref(false)
const currentStepIndex = ref(0)

const steps: TourStep[] = [
  {
    id: 'sidebar',
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    content: 'Le menu latéral permet de naviguer entre les domaines DigComp, les vues d\'ensemble et les outils d\'analyse.',
    position: 'right'
  },
  {
    id: 'header-search',
    target: '[data-tour="header-actions"]',
    title: 'Barre d\'outils',
    content: 'Accédez rapidement à l\'export, au référentiel DigComp, au mode sombre, à la visioconférence et au chat d\'équipe.',
    position: 'bottom'
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    title: 'Notifications',
    content: 'Recevez des alertes quand un collègue modifie le statut d\'un LO, ajoute un commentaire ou vous assigne une tâche.',
    position: 'bottom'
  },
  {
    id: 'outcomes',
    target: '[data-tour="outcomes-view"]',
    title: 'Learning Outcomes',
    content: 'Gérez les acquis d\'apprentissage par domaine et compétence. Filtrez par statut, niveau ou année (L1, L2, L3).',
    position: 'bottom'
  },
  {
    id: 'filters',
    target: '[data-tour="filters"]',
    title: 'Filtres et tri',
    content: 'Utilisez les filtres pour cibler les LO par statut (brouillon, en revue, validé), par année ou par niveau de compétence.',
    position: 'bottom'
  },
  {
    id: 'ai-assistant',
    target: '[data-tour="ai-assistant"]',
    title: 'Assistant IA',
    content: 'Générez automatiquement des plans de cours, des exercices, des QCM et des mises en situation grâce à l\'IA intégrée.',
    position: 'left'
  },
  {
    id: 'history',
    target: '[data-tour="history"]',
    title: 'Historique',
    content: 'Consultez l\'historique complet des modifications avec un diff visuel par Learning Outcome. Restaurez des snapshots précédents.',
    position: 'bottom'
  },
  {
    id: 'shortcuts',
    target: '[data-tour="user-menu"]',
    title: 'Raccourcis clavier',
    content: 'Ctrl+H : Historique, Ctrl+I : Import magique, Ctrl+Shift+E : Export, Ctrl+Shift+R : Référentiel. Cliquez sur votre avatar pour les paramètres.',
    position: 'bottom'
  }
]

export function useOnboardingTour() {
  // Re-sync with localStorage on each call
  tourCompleted.value = localStorage.getItem(STORAGE_KEY) === 'true'

  const currentStep = computed(() => steps[currentStepIndex.value] || null)
  const totalSteps = computed(() => steps.length)
  const isLastStep = computed(() => currentStepIndex.value === steps.length - 1)
  const isFirstStep = computed(() => currentStepIndex.value === 0)

  const startTour = () => {
    currentStepIndex.value = 0
    tourActive.value = true
  }

  const nextStep = () => {
    if (currentStepIndex.value < steps.length - 1) {
      currentStepIndex.value++
    } else {
      completeTour()
    }
  }

  const prevStep = () => {
    if (currentStepIndex.value > 0) {
      currentStepIndex.value--
    }
  }

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      currentStepIndex.value = index
    }
  }

  const completeTour = () => {
    tourActive.value = false
    tourCompleted.value = true
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  const skipTour = () => {
    completeTour()
  }

  const resetTour = () => {
    tourCompleted.value = false
    localStorage.removeItem(STORAGE_KEY)
  }

  const shouldShowTour = computed(() => !tourCompleted.value)

  return {
    tourActive,
    tourCompleted,
    currentStep,
    currentStepIndex,
    totalSteps,
    isLastStep,
    isFirstStep,
    shouldShowTour,
    startTour,
    nextStep,
    prevStep,
    goToStep,
    completeTour,
    skipTour,
    resetTour
  }
}
