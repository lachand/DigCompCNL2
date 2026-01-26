import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  orderBy,
  updateDoc
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import type { YearLevel } from '@/types'

export interface PersonalNote {
  id?: string
  outcomeId: string
  year?: YearLevel
  userId: string
  content: string
  color: string
  createdAt: number
  updatedAt: number
}

const notes = ref<PersonalNote[]>([])
let unsubscribe: Unsubscribe | null = null

// Note colors
export const NOTE_COLORS = [
  { name: 'Jaune', value: '#fef3c7', dark: '#92400e' },
  { name: 'Rose', value: '#fce7f3', dark: '#9d174d' },
  { name: 'Bleu', value: '#dbeafe', dark: '#1e40af' },
  { name: 'Vert', value: '#dcfce7', dark: '#166534' },
  { name: 'Violet', value: '#ede9fe', dark: '#5b21b6' },
  { name: 'Orange', value: '#ffedd5', dark: '#9a3412' }
]

export function usePersonalNotes() {
  const authStore = useAuthStore()
  const { success, error: showError } = useToast()

  const userNotes = computed(() => {
    return notes.value.filter(n => n.userId === authStore.currentUser?.email)
  })

  const getNotesForOutcome = (outcomeId: string, year?: YearLevel) => {
    return computed(() => {
      return userNotes.value.filter(n => {
        if (n.outcomeId !== outcomeId) return false
        if (year && n.year && n.year !== year) return false
        return true
      })
    })
  }

  const loadNotes = () => {
    if (!authStore.currentUser?.email) return

    const q = query(
      collection(db, 'personal_notes'),
      where('userId', '==', authStore.currentUser.email),
      orderBy('updatedAt', 'desc')
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      notes.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PersonalNote))
    })
  }

  const addNote = async (
    outcomeId: string,
    content: string,
    year?: YearLevel,
    color: string = NOTE_COLORS[0].value
  ) => {
    if (!authStore.currentUser?.email) return null

    try {
      const note: Omit<PersonalNote, 'id'> = {
        outcomeId,
        userId: authStore.currentUser.email,
        content,
        year,
        color,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      const docRef = await addDoc(collection(db, 'personal_notes'), note)
      success('Note ajoutée')
      return docRef.id
    } catch (err) {
      showError('Erreur lors de la création de la note')
      console.error(err)
      return null
    }
  }

  const updateNote = async (noteId: string, content: string, color?: string) => {
    try {
      const updateData: Partial<PersonalNote> = {
        content,
        updatedAt: Date.now()
      }
      if (color) {
        updateData.color = color
      }

      await updateDoc(doc(db, 'personal_notes', noteId), updateData)
      success('Note mise à jour')
    } catch (err) {
      showError('Erreur lors de la mise à jour')
    }
  }

  const deleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, 'personal_notes', noteId))
      success('Note supprimée')
    } catch (err) {
      showError('Erreur lors de la suppression')
    }
  }

  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    notes: userNotes,
    getNotesForOutcome,
    loadNotes,
    addNote,
    updateNote,
    deleteNote,
    cleanup,
    NOTE_COLORS
  }
}
