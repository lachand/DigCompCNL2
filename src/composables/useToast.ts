import { ref } from 'vue'
import type { Toast } from '@/types'

const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  const addToast = (type: Toast['type'], message: string) => {
    const id = nextId++
    toasts.value.push({ id, type, message })

    setTimeout(() => {
      removeToast(id)
    }, 3000)
  }

  const removeToast = (id: number) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string) => addToast('success', message)
  const error = (message: string) => addToast('error', message)
  const info = (message: string) => addToast('info', message)

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info
  }
}
