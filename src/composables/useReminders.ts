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

export interface Reminder {
  id?: string
  outcomeId: string
  outcomeDescription: string
  userId: string
  dueDate: number
  note: string
  completed: boolean
  createdAt: number
}

const reminders = ref<Reminder[]>([])
let unsubscribe: Unsubscribe | null = null

export function useReminders() {
  const authStore = useAuthStore()
  const { success, error: showError, info } = useToast()

  const userReminders = computed(() => {
    return reminders.value.filter(r => r.userId === authStore.currentUser?.email)
  })

  const upcomingReminders = computed(() => {
    const now = Date.now()
    const oneDayLater = now + 24 * 60 * 60 * 1000 // 24 hours

    return userReminders.value
      .filter(r => !r.completed && r.dueDate <= oneDayLater)
      .sort((a, b) => a.dueDate - b.dueDate)
  })

  const overdueReminders = computed(() => {
    const now = Date.now()
    return userReminders.value
      .filter(r => !r.completed && r.dueDate < now)
      .sort((a, b) => a.dueDate - b.dueDate)
  })

  const loadReminders = () => {
    if (!authStore.currentUser?.email) return

    const q = query(
      collection(db, 'reminders'),
      where('userId', '==', authStore.currentUser.email),
      orderBy('dueDate', 'asc')
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      reminders.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Reminder))

      // Check for due reminders
      checkDueReminders()
    })
  }

  const checkDueReminders = () => {
    const now = Date.now()
    const dueReminders = userReminders.value.filter(r =>
      !r.completed &&
      r.dueDate <= now &&
      r.dueDate > now - 60000 // Within last minute
    )

    dueReminders.forEach(reminder => {
      info(`Rappel: ${reminder.outcomeDescription}`)

      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('DigComp Rappel', {
          body: reminder.note || reminder.outcomeDescription,
          icon: '/icon.png'
        })
      }
    })
  }

  const addReminder = async (
    outcomeId: string,
    outcomeDescription: string,
    dueDate: Date,
    note: string = ''
  ) => {
    if (!authStore.currentUser?.email) return null

    try {
      const reminder: Omit<Reminder, 'id'> = {
        outcomeId,
        outcomeDescription,
        userId: authStore.currentUser.email,
        dueDate: dueDate.getTime(),
        note,
        completed: false,
        createdAt: Date.now()
      }

      const docRef = await addDoc(collection(db, 'reminders'), reminder)
      success('Rappel créé')
      return docRef.id
    } catch (err) {
      showError('Erreur lors de la création du rappel')
      console.error(err)
      return null
    }
  }

  const completeReminder = async (reminderId: string) => {
    try {
      await updateDoc(doc(db, 'reminders', reminderId), {
        completed: true
      })
      success('Rappel terminé')
    } catch (err) {
      showError('Erreur lors de la mise à jour')
    }
  }

  const deleteReminder = async (reminderId: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', reminderId))
      success('Rappel supprimé')
    } catch (err) {
      showError('Erreur lors de la suppression')
    }
  }

  const snoozeReminder = async (reminderId: string, minutes: number) => {
    try {
      const newDueDate = Date.now() + minutes * 60 * 1000
      await updateDoc(doc(db, 'reminders', reminderId), {
        dueDate: newDueDate
      })
      success(`Rappel reporté de ${minutes} minutes`)
    } catch (err) {
      showError('Erreur lors du report')
    }
  }

  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // Check for due reminders periodically
  let intervalId: number | null = null

  onMounted(() => {
    loadReminders()
    intervalId = window.setInterval(checkDueReminders, 60000) // Check every minute
  })

  onUnmounted(() => {
    cleanup()
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  return {
    reminders: userReminders,
    upcomingReminders,
    overdueReminders,
    loadReminders,
    addReminder,
    completeReminder,
    deleteReminder,
    snoozeReminder,
    cleanup
  }
}
