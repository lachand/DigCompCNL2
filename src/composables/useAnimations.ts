// Composable pour les animations et transitions
import { ref, onMounted, onUnmounted } from 'vue'

export interface AnimationConfig {
  duration?: number
  easing?: string
  delay?: number
  fill?: 'none' | 'forwards' | 'backwards' | 'both'
}

export interface TransitionConfig extends AnimationConfig {
  enterFrom?: string
  enterActive?: string
  enterTo?: string
  leaveFrom?: string
  leaveActive?: string
  leaveTo?: string
}

export function useAnimations() {
  const prefersReducedMotion = ref(false)
  const isAnimationEnabled = ref(true)

  // Check for reduced motion preference
  const checkReducedMotion = () => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQuery.matches
    isAnimationEnabled.value = !mediaQuery.matches
    
    mediaQuery.addEventListener('change', (e) => {
      prefersReducedMotion.value = e.matches
      isAnimationEnabled.value = !e.matches
    })
  }

  // Fade in animation
  const fadeIn = (element: HTMLElement, config: AnimationConfig = {}) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const options: KeyframeAnimationOptions = {
      duration: config.duration || 300,
      easing: config.easing || 'ease-out',
      delay: config.delay || 0,
      fill: config.fill || 'both'
    }
    
    return element.animate([
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], options).finished
  }

  // Fade out animation
  const fadeOut = (element: HTMLElement, config: AnimationConfig = {}) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const options: KeyframeAnimationOptions = {
      duration: config.duration || 200,
      easing: config.easing || 'ease-in',
      delay: config.delay || 0,
      fill: config.fill || 'both'
    }
    
    return element.animate([
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-10px)' }
    ], options).finished
  }

  // Slide in from left
  const slideInLeft = (element: HTMLElement, config: AnimationConfig = {}) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const options: KeyframeAnimationOptions = {
      duration: config.duration || 300,
      easing: config.easing || 'ease-out',
      delay: config.delay || 0,
      fill: config.fill || 'both'
    }
    
    return element.animate([
      { opacity: 0, transform: 'translateX(-20px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ], options).finished
  }

  // Slide in from right
  const slideInRight = (element: HTMLElement, config: AnimationConfig = {}) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const options: KeyframeAnimationOptions = {
      duration: config.duration || 300,
      easing: config.easing || 'ease-out',
      delay: config.delay || 0,
      fill: config.fill || 'both'
    }
    
    return element.animate([
      { opacity: 0, transform: 'translateX(20px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ], options).finished
  }

  // Scale in animation
  const scaleIn = (element: HTMLElement, config: AnimationConfig = {}) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const options: KeyframeAnimationOptions = {
      duration: config.duration || 200,
      easing: config.easing || 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      delay: config.delay || 0,
      fill: config.fill || 'both'
    }
    
    return element.animate([
      { opacity: 0, transform: 'scale(0.9)' },
      { opacity: 1, transform: 'scale(1)' }
    ], options).finished
  }

  // Scale out animation
  const scaleOut = (element: HTMLElement, config: AnimationConfig = {}) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const options: KeyframeAnimationOptions = {
      duration: config.duration || 150,
      easing: config.easing || 'ease-in',
      delay: config.delay || 0,
      fill: config.fill || 'both'
    }
    
    return element.animate([
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.95)' }
    ], options).finished
  }

  // Shake animation for error states
  const shake = (element: HTMLElement, config: AnimationConfig = {}) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const options: KeyframeAnimationOptions = {
      duration: config.duration || 500,
      easing: config.easing || 'ease-in-out',
      delay: config.delay || 0,
      fill: config.fill || 'none'
    }
    
    return element.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(-2px)' },
      { transform: 'translateX(2px)' },
      { transform: 'translateX(0)' }
    ], options).finished
  }

  // Bounce animation for success states
  const bounce = (element: HTMLElement, config: AnimationConfig = {}) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const options: KeyframeAnimationOptions = {
      duration: config.duration || 600,
      easing: config.easing || 'ease-in-out',
      delay: config.delay || 0,
      fill: config.fill || 'none'
    }
    
    return element.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(0.95)' },
      { transform: 'scale(1.02)' },
      { transform: 'scale(1)' }
    ], options).finished
  }

  // Pulse animation
  const pulse = (element: HTMLElement, config: AnimationConfig = {}) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const options: KeyframeAnimationOptions = {
      duration: config.duration || 1000,
      easing: config.easing || 'ease-in-out',
      delay: config.delay || 0,
      fill: config.fill || 'none',
      iterations: 3
    }
    
    return element.animate([
      { opacity: 1 },
      { opacity: 0.7 },
      { opacity: 1 }
    ], options).finished
  }

  // Typing animation
  const typeWriter = async (
    element: HTMLElement, 
    text: string, 
    config: { speed?: number; cursor?: boolean } = {}
  ) => {
    if (!isAnimationEnabled.value) {
      element.textContent = text
      return Promise.resolve()
    }
    
    const speed = config.speed || 50
    const showCursor = config.cursor !== false
    
    element.textContent = ''
    
    if (showCursor) {
      element.style.borderRight = '2px solid'
      element.style.animation = 'caret 1s steps(1) infinite'
    }
    
    for (let i = 0; i <= text.length; i++) {
      await new Promise(resolve => setTimeout(resolve, speed))
      element.textContent = text.slice(0, i)
    }
    
    if (showCursor) {
      setTimeout(() => {
        element.style.borderRight = 'none'
        element.style.animation = 'none'
      }, 1000)
    }
  }

  // Stagger animation for lists
  const staggerIn = async (
    elements: HTMLElement[], 
    animation: (el: HTMLElement, config?: AnimationConfig) => Promise<void>,
    config: AnimationConfig & { stagger?: number } = {}
  ) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const stagger = config.stagger || 100
    const promises: Promise<void>[] = []
    
    elements.forEach((element, index) => {
      promises.push(
        animation(element, {
          ...config,
          delay: (config.delay || 0) + (index * stagger)
        })
      )
    })
    
    return Promise.all(promises).then(() => {})
  }

  // Morphing between two elements
  const morphTo = async (
    fromElement: HTMLElement,
    toElement: HTMLElement,
    config: AnimationConfig = {}
  ) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const duration = config.duration || 300
    
    // Hide target initially
    toElement.style.opacity = '0'
    toElement.style.display = 'block'
    
    // Fade out source
    await fadeOut(fromElement, { duration: duration / 2 })
    fromElement.style.display = 'none'
    
    // Fade in target
    await fadeIn(toElement, { duration: duration / 2 })
  }

  // Page transition
  const pageTransition = async (
    direction: 'in' | 'out' = 'in',
    config: AnimationConfig = {}
  ) => {
    if (!isAnimationEnabled.value) return Promise.resolve()
    
    const element = document.body
    
    if (direction === 'out') {
      return fadeOut(element, {
        duration: 200,
        ...config
      })
    } else {
      return fadeIn(element, {
        duration: 300,
        ...config
      })
    }
  }

  onMounted(() => {
    checkReducedMotion()
  })

  return {
    // State
    isAnimationEnabled,
    prefersReducedMotion,
    
    // Basic animations
    fadeIn,
    fadeOut,
    slideInLeft,
    slideInRight,
    scaleIn,
    scaleOut,
    
    // Feedback animations
    shake,
    bounce,
    pulse,
    
    // Complex animations
    typeWriter,
    staggerIn,
    morphTo,
    pageTransition
  }
}