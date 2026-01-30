// Tests unitaires pour le composable useAnimations
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useAnimations } from '@/composables/useAnimations'

// Mock Performance API
const mockAnimate = vi.fn()
const mockMediaQuery = {
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockMediaQuery)
})

// Mock HTMLElement.animate
HTMLElement.prototype.animate = mockAnimate

describe('useAnimations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAnimate.mockReturnValue({
      finished: Promise.resolve()
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should check for reduced motion preference', () => {
      useAnimations()
      
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should disable animations when reduced motion is preferred', () => {
      mockMediaQuery.matches = true
      
      const { isAnimationEnabled, prefersReducedMotion } = useAnimations()
      
      expect(prefersReducedMotion.value).toBe(true)
      expect(isAnimationEnabled.value).toBe(false)
    })
  })

  describe('fade animations', () => {
    it('should perform fadeIn animation', async () => {
      const { fadeIn } = useAnimations()
      const element = document.createElement('div')
      
      await fadeIn(element)
      
      expect(mockAnimate).toHaveBeenCalledWith(
        [
          { opacity: 0, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 300,
          easing: 'ease-out',
          delay: 0,
          fill: 'both'
        }
      )
    })

    it('should perform fadeOut animation', async () => {
      const { fadeOut } = useAnimations()
      const element = document.createElement('div')
      
      await fadeOut(element)
      
      expect(mockAnimate).toHaveBeenCalledWith(
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-10px)' }
        ],
        {
          duration: 200,
          easing: 'ease-in',
          delay: 0,
          fill: 'both'
        }
      )
    })

    it('should skip animations when disabled', async () => {
      mockMediaQuery.matches = true
      
      const { fadeIn } = useAnimations()
      const element = document.createElement('div')
      
      await fadeIn(element)
      
      expect(mockAnimate).not.toHaveBeenCalled()
    })
  })

  describe('slide animations', () => {
    it('should perform slideInLeft animation', async () => {
      const { slideInLeft } = useAnimations()
      const element = document.createElement('div')
      
      await slideInLeft(element)
      
      expect(mockAnimate).toHaveBeenCalledWith(
        [
          { opacity: 0, transform: 'translateX(-20px)' },
          { opacity: 1, transform: 'translateX(0)' }
        ],
        expect.objectContaining({
          duration: 300,
          easing: 'ease-out'
        })
      )
    })

    it('should perform slideInRight animation', async () => {
      const { slideInRight } = useAnimations()
      const element = document.createElement('div')
      
      await slideInRight(element)
      
      expect(mockAnimate).toHaveBeenCalledWith(
        [
          { opacity: 0, transform: 'translateX(20px)' },
          { opacity: 1, transform: 'translateX(0)' }
        ],
        expect.objectContaining({
          duration: 300,
          easing: 'ease-out'
        })
      )
    })
  })

  describe('scale animations', () => {
    it('should perform scaleIn animation', async () => {
      const { scaleIn } = useAnimations()
      const element = document.createElement('div')
      
      await scaleIn(element)
      
      expect(mockAnimate).toHaveBeenCalledWith(
        [
          { opacity: 0, transform: 'scale(0.9)' },
          { opacity: 1, transform: 'scale(1)' }
        ],
        expect.objectContaining({
          duration: 200,
          easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        })
      )
    })

    it('should perform scaleOut animation', async () => {
      const { scaleOut } = useAnimations()
      const element = document.createElement('div')
      
      await scaleOut(element)
      
      expect(mockAnimate).toHaveBeenCalledWith(
        [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.95)' }
        ],
        expect.objectContaining({
          duration: 150,
          easing: 'ease-in'
        })
      )
    })
  })

  describe('feedback animations', () => {
    it('should perform shake animation', async () => {
      const { shake } = useAnimations()
      const element = document.createElement('div')
      
      await shake(element)
      
      expect(mockAnimate).toHaveBeenCalledWith(
        expect.arrayContaining([
          { transform: 'translateX(0)' },
          { transform: 'translateX(-4px)' },
          { transform: 'translateX(4px)' }
        ]),
        expect.objectContaining({
          duration: 500,
          fill: 'none'
        })
      )
    })

    it('should perform bounce animation', async () => {
      const { bounce } = useAnimations()
      const element = document.createElement('div')
      
      await bounce(element)
      
      expect(mockAnimate).toHaveBeenCalledWith(
        expect.arrayContaining([
          { transform: 'scale(1)' },
          { transform: 'scale(1.05)' },
          { transform: 'scale(0.95)' }
        ]),
        expect.objectContaining({
          duration: 600
        })
      )
    })

    it('should perform pulse animation with iterations', async () => {
      const { pulse } = useAnimations()
      const element = document.createElement('div')
      
      await pulse(element)
      
      expect(mockAnimate).toHaveBeenCalledWith(
        [
          { opacity: 1 },
          { opacity: 0.7 },
          { opacity: 1 }
        ],
        expect.objectContaining({
          duration: 1000,
          iterations: 3
        })
      )
    })
  })

  describe('complex animations', () => {
    it('should perform typeWriter animation', async () => {
      const { typeWriter } = useAnimations()
      const element = document.createElement('div')
      const text = 'Hello World'
      
      // Mock setTimeout to make test run faster
      vi.spyOn(global, 'setTimeout').mockImplementation((callback) => {
        callback()
        return 1 as any
      })
      
      await typeWriter(element, text, { speed: 10 })
      
      expect(element.textContent).toBe(text)
      expect(setTimeout).toHaveBeenCalled()
    })

    it('should stagger animations', async () => {
      const { staggerIn, fadeIn } = useAnimations()
      const elements = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div')
      ]
      
      await staggerIn(elements, fadeIn, { stagger: 100 })
      
      expect(mockAnimate).toHaveBeenCalledTimes(3)
      
      // Check that delays are staggered
      const calls = mockAnimate.mock.calls
      expect(calls[0][1].delay).toBe(0)
      expect(calls[1][1].delay).toBe(100)
      expect(calls[2][1].delay).toBe(200)
    })

    it('should morph between elements', async () => {
      const { morphTo } = useAnimations()
      const fromElement = document.createElement('div')
      const toElement = document.createElement('div')
      
      await morphTo(fromElement, toElement)
      
      expect(mockAnimate).toHaveBeenCalledTimes(2) // fadeOut + fadeIn
      expect(fromElement.style.display).toBe('none')
      expect(toElement.style.display).toBe('block')
    })
  })

  describe('configuration', () => {
    it('should accept custom animation config', async () => {
      const { fadeIn } = useAnimations()
      const element = document.createElement('div')
      const config = {
        duration: 500,
        easing: 'ease-in-out',
        delay: 100,
        fill: 'forwards' as const
      }
      
      await fadeIn(element, config)
      
      expect(mockAnimate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining(config)
      )
    })

    it('should use default values when config is not provided', async () => {
      const { fadeIn } = useAnimations()
      const element = document.createElement('div')
      
      await fadeIn(element)
      
      expect(mockAnimate).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          duration: 300,
          easing: 'ease-out',
          delay: 0,
          fill: 'both'
        })
      )
    })
  })

  describe('accessibility', () => {
    it('should respect user motion preferences', () => {
      mockMediaQuery.matches = true
      
      const { isAnimationEnabled, prefersReducedMotion } = useAnimations()
      
      expect(prefersReducedMotion.value).toBe(true)
      expect(isAnimationEnabled.value).toBe(false)
    })

    it('should update preferences when media query changes', () => {
      const { isAnimationEnabled, prefersReducedMotion } = useAnimations()
      
      // Initially no reduced motion
      expect(prefersReducedMotion.value).toBe(false)
      expect(isAnimationEnabled.value).toBe(true)
      
      // Simulate media query change
      const changeCallback = mockMediaQuery.addEventListener.mock.calls[0][1]
      changeCallback({ matches: true })
      
      expect(prefersReducedMotion.value).toBe(true)
      expect(isAnimationEnabled.value).toBe(false)
    })
  })
})