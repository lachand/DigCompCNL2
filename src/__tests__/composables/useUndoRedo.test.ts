import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useUndoRedo } from '@/composables/useUndoRedo'

describe('useUndoRedo', () => {
  beforeEach(() => {
    const { clearHistory } = useUndoRedo()
    clearHistory()
  })

  it('should start with empty stacks', () => {
    const { canUndo, canRedo, lastAction } = useUndoRedo()

    expect(canUndo.value).toBe(false)
    expect(canRedo.value).toBe(false)
    expect(lastAction.value).toBeNull()
  })

  it('should push an action to undo stack', () => {
    const { pushAction, canUndo, lastAction } = useUndoRedo()

    pushAction({
      id: 'test-1',
      type: 'test',
      description: 'Test action',
      timestamp: Date.now(),
      undo: vi.fn(),
      redo: vi.fn()
    })

    expect(canUndo.value).toBe(true)
    expect(lastAction.value?.id).toBe('test-1')
  })

  it('should undo an action', async () => {
    const undoFn = vi.fn()
    const { pushAction, undo, canUndo, canRedo } = useUndoRedo()

    pushAction({
      id: 'test-1',
      type: 'test',
      description: 'Test action',
      timestamp: Date.now(),
      undo: undoFn,
      redo: vi.fn()
    })

    const result = await undo()

    expect(undoFn).toHaveBeenCalledOnce()
    expect(result?.id).toBe('test-1')
    expect(canUndo.value).toBe(false)
    expect(canRedo.value).toBe(true)
  })

  it('should redo an undone action', async () => {
    const redoFn = vi.fn()
    const { pushAction, undo, redo, canRedo } = useUndoRedo()

    pushAction({
      id: 'test-1',
      type: 'test',
      description: 'Test action',
      timestamp: Date.now(),
      undo: vi.fn(),
      redo: redoFn
    })

    await undo()
    expect(canRedo.value).toBe(true)

    const result = await redo()
    expect(redoFn).toHaveBeenCalledOnce()
    expect(result?.id).toBe('test-1')
  })

  it('should clear redo stack on new action', async () => {
    const { pushAction, undo, canRedo } = useUndoRedo()

    pushAction({
      id: 'test-1',
      type: 'test',
      description: 'Action 1',
      timestamp: Date.now(),
      undo: vi.fn(),
      redo: vi.fn()
    })

    await undo()
    expect(canRedo.value).toBe(true)

    pushAction({
      id: 'test-2',
      type: 'test',
      description: 'Action 2',
      timestamp: Date.now(),
      undo: vi.fn(),
      redo: vi.fn()
    })

    expect(canRedo.value).toBe(false)
  })

  it('should return null when undoing with empty stack', async () => {
    const { undo } = useUndoRedo()

    const result = await undo()
    expect(result).toBeNull()
  })

  it('should return null when redoing with empty stack', async () => {
    const { redo } = useUndoRedo()

    const result = await redo()
    expect(result).toBeNull()
  })

  it('should limit history to 50 actions', () => {
    const { pushAction, undoStack } = useUndoRedo()

    for (let i = 0; i < 60; i++) {
      pushAction({
        id: `test-${i}`,
        type: 'test',
        description: `Action ${i}`,
        timestamp: Date.now(),
        undo: vi.fn(),
        redo: vi.fn()
      })
    }

    expect(undoStack.value.length).toBe(50)
    // First action should be the 11th one pushed (0-9 were shifted out)
    expect(undoStack.value[0].id).toBe('test-10')
  })

  it('should clear history', () => {
    const { pushAction, clearHistory, canUndo, canRedo } = useUndoRedo()

    pushAction({
      id: 'test-1',
      type: 'test',
      description: 'Action',
      timestamp: Date.now(),
      undo: vi.fn(),
      redo: vi.fn()
    })

    clearHistory()

    expect(canUndo.value).toBe(false)
    expect(canRedo.value).toBe(false)
  })

  it('should create a status action helper', () => {
    const { createStatusAction } = useUndoRedo()
    const applyChange = vi.fn()

    const action = createStatusAction('1.1.1', 'L1', 'draft', 'validated', applyChange)

    expect(action.type).toBe('status_change')
    expect(action.description).toContain('1.1.1')
    expect(action.description).toContain('draft')
    expect(action.description).toContain('validated')
  })

  it('should create a resource action helper', () => {
    const { createResourceAction } = useUndoRedo()
    const applyChange = vi.fn()

    const addAction = createResourceAction('1.1.1', 'L1', 'Video cours', true, applyChange)
    expect(addAction.type).toBe('resource_add')
    expect(addAction.description).toContain('Ajout')

    const removeAction = createResourceAction('1.1.1', 'L1', 'Video cours', false, applyChange)
    expect(removeAction.type).toBe('resource_remove')
    expect(removeAction.description).toContain('Suppression')
  })

  it('should execute status action undo/redo correctly', async () => {
    const applyChange = vi.fn()
    const { createStatusAction, pushAction, undo, redo } = useUndoRedo()

    const action = createStatusAction('1.1.1', 'L1', 'draft', 'validated', applyChange)
    pushAction(action)

    await undo()
    expect(applyChange).toHaveBeenCalledWith('draft')

    await redo()
    expect(applyChange).toHaveBeenCalledWith('validated')
  })
})
