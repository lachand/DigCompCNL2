import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '@/composables/useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should add a toast', () => {
    const { toasts, success } = useToast()

    success('Test message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[0].message).toBe('Test message')
  })

  it('should remove toast after 3 seconds', () => {
    const { toasts, success } = useToast()

    success('Test message')
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(3000)
    expect(toasts.value).toHaveLength(0)
  })

  it('should add error toast', () => {
    const { toasts, error } = useToast()

    error('Error message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].type).toBe('error')
  })

  it('should add info toast', () => {
    const { toasts, info } = useToast()

    info('Info message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].type).toBe('info')
  })

  it('should handle multiple toasts', () => {
    const { toasts, success, error } = useToast()

    success('Success 1')
    error('Error 1')
    success('Success 2')

    expect(toasts.value).toHaveLength(3)
  })
})
