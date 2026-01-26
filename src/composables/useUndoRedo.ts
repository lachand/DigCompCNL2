import { ref, computed } from 'vue'

export interface HistoryAction {
  id: string
  type: string
  description: string
  timestamp: number
  undo: () => Promise<void> | void
  redo: () => Promise<void> | void
}

const MAX_HISTORY = 50

const undoStack = ref<HistoryAction[]>([])
const redoStack = ref<HistoryAction[]>([])
const isUndoing = ref(false)
const isRedoing = ref(false)

export function useUndoRedo() {
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const lastAction = computed(() => {
    if (undoStack.value.length === 0) return null
    return undoStack.value[undoStack.value.length - 1]
  })

  const pushAction = (action: HistoryAction) => {
    // Don't record actions while undoing/redoing
    if (isUndoing.value || isRedoing.value) return

    undoStack.value.push(action)

    // Limit history size
    if (undoStack.value.length > MAX_HISTORY) {
      undoStack.value.shift()
    }

    // Clear redo stack on new action
    redoStack.value = []
  }

  const undo = async () => {
    if (!canUndo.value) return null

    const action = undoStack.value.pop()
    if (!action) return null

    isUndoing.value = true
    try {
      await action.undo()
      redoStack.value.push(action)
      return action
    } finally {
      isUndoing.value = false
    }
  }

  const redo = async () => {
    if (!canRedo.value) return null

    const action = redoStack.value.pop()
    if (!action) return null

    isRedoing.value = true
    try {
      await action.redo()
      undoStack.value.push(action)
      return action
    } finally {
      isRedoing.value = false
    }
  }

  const clearHistory = () => {
    undoStack.value = []
    redoStack.value = []
  }

  // Helper to create a status change action
  const createStatusAction = (
    outcomeId: string,
    year: string,
    oldStatus: string,
    newStatus: string,
    applyChange: (status: string) => Promise<void>
  ): HistoryAction => ({
    id: `status-${outcomeId}-${Date.now()}`,
    type: 'status_change',
    description: `Statut ${outcomeId} (${year}): ${oldStatus} → ${newStatus}`,
    timestamp: Date.now(),
    undo: () => applyChange(oldStatus),
    redo: () => applyChange(newStatus)
  })

  // Helper to create a resource action
  const createResourceAction = (
    outcomeId: string,
    year: string,
    resourceTitle: string,
    isAdd: boolean,
    applyChange: (add: boolean) => Promise<void>
  ): HistoryAction => ({
    id: `resource-${outcomeId}-${Date.now()}`,
    type: isAdd ? 'resource_add' : 'resource_remove',
    description: `${isAdd ? 'Ajout' : 'Suppression'} ressource: ${resourceTitle} (${outcomeId})`,
    timestamp: Date.now(),
    undo: () => applyChange(!isAdd),
    redo: () => applyChange(isAdd)
  })

  // Helper to create a course link action
  const createCourseLinkAction = (
    outcomeId: string,
    year: string,
    oldLink: string,
    newLink: string,
    applyChange: (link: string) => Promise<void>
  ): HistoryAction => ({
    id: `course-${outcomeId}-${Date.now()}`,
    type: 'course_link',
    description: `Lien cours ${outcomeId} (${year}) modifié`,
    timestamp: Date.now(),
    undo: () => applyChange(oldLink),
    redo: () => applyChange(newLink)
  })

  return {
    undoStack,
    redoStack,
    canUndo,
    canRedo,
    lastAction,
    isUndoing,
    isRedoing,
    pushAction,
    undo,
    redo,
    clearHistory,
    createStatusAction,
    createResourceAction,
    createCourseLinkAction
  }
}
