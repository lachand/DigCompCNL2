import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingTour } from '@/composables/useOnboardingTour'

describe('useOnboardingTour', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset module-level refs that persist across tests
    const { resetTour } = useOnboardingTour()
    resetTour()
  })

  it('should start with tour not active', () => {
    const { tourActive } = useOnboardingTour()
    expect(tourActive.value).toBe(false)
  })

  it('should detect first visit (no localStorage)', () => {
    const { shouldShowTour } = useOnboardingTour()
    expect(shouldShowTour.value).toBe(true)
  })

  it('should detect returning user (localStorage set)', () => {
    localStorage.setItem('digcomp_onboarding_done', 'true')
    const { shouldShowTour } = useOnboardingTour()
    expect(shouldShowTour.value).toBe(false)
  })

  it('should start tour and set first step', () => {
    const { startTour, tourActive, currentStepIndex, currentStep } = useOnboardingTour()

    startTour()

    expect(tourActive.value).toBe(true)
    expect(currentStepIndex.value).toBe(0)
    expect(currentStep.value).not.toBeNull()
    expect(currentStep.value?.id).toBe('sidebar')
  })

  it('should navigate to next step', () => {
    const { startTour, nextStep, currentStepIndex } = useOnboardingTour()

    startTour()
    nextStep()

    expect(currentStepIndex.value).toBe(1)
  })

  it('should navigate to previous step', () => {
    const { startTour, nextStep, prevStep, currentStepIndex } = useOnboardingTour()

    startTour()
    nextStep()
    nextStep()
    prevStep()

    expect(currentStepIndex.value).toBe(1)
  })

  it('should not go below step 0', () => {
    const { startTour, prevStep, currentStepIndex } = useOnboardingTour()

    startTour()
    prevStep()

    expect(currentStepIndex.value).toBe(0)
  })

  it('should complete tour on last step next', () => {
    const { startTour, nextStep, goToStep, tourActive, tourCompleted, totalSteps } = useOnboardingTour()

    startTour()
    goToStep(totalSteps.value - 1)
    nextStep()

    expect(tourActive.value).toBe(false)
    expect(tourCompleted.value).toBe(true)
    expect(localStorage.getItem('digcomp_onboarding_done')).toBe('true')
  })

  it('should skip tour and mark as completed', () => {
    const { startTour, skipTour, tourActive, tourCompleted } = useOnboardingTour()

    startTour()
    skipTour()

    expect(tourActive.value).toBe(false)
    expect(tourCompleted.value).toBe(true)
  })

  it('should reset tour', () => {
    const { skipTour, resetTour, shouldShowTour, tourCompleted } = useOnboardingTour()

    skipTour()
    expect(tourCompleted.value).toBe(true)

    resetTour()
    expect(tourCompleted.value).toBe(false)
    expect(shouldShowTour.value).toBe(true)
    expect(localStorage.getItem('digcomp_onboarding_done')).toBeNull()
  })

  it('should go to specific step', () => {
    const { startTour, goToStep, currentStepIndex } = useOnboardingTour()

    startTour()
    goToStep(3)

    expect(currentStepIndex.value).toBe(3)
  })

  it('should not go to invalid step index', () => {
    const { startTour, goToStep, currentStepIndex, totalSteps } = useOnboardingTour()

    startTour()
    goToStep(999)

    expect(currentStepIndex.value).toBe(0)

    goToStep(-1)
    expect(currentStepIndex.value).toBe(0)
  })

  it('should report isFirstStep and isLastStep correctly', () => {
    const { startTour, nextStep, goToStep, isFirstStep, isLastStep, totalSteps } = useOnboardingTour()

    startTour()
    expect(isFirstStep.value).toBe(true)
    expect(isLastStep.value).toBe(false)

    nextStep()
    expect(isFirstStep.value).toBe(false)

    goToStep(totalSteps.value - 1)
    expect(isLastStep.value).toBe(true)
  })

  it('should have all steps with required fields', () => {
    const { startTour, currentStep, totalSteps, goToStep } = useOnboardingTour()

    startTour()

    for (let i = 0; i < totalSteps.value; i++) {
      goToStep(i)
      const step = currentStep.value
      expect(step).not.toBeNull()
      expect(step?.id).toBeTruthy()
      expect(step?.target).toBeTruthy()
      expect(step?.title).toBeTruthy()
      expect(step?.content).toBeTruthy()
      expect(['top', 'bottom', 'left', 'right']).toContain(step?.position)
    }
  })
})
