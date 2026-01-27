<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-8 text-white">
      <h1 class="text-3xl font-bold mb-2">Calendrier</h1>
      <p class="text-teal-100">Planifiez vos revues et validations de Learning Outcomes</p>
    </div>

    <!-- Calendar Controls -->
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-4">
          <button
            @click="previousMonth"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <i class="ph ph-caret-left text-xl"></i>
          </button>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white min-w-[200px] text-center">
            {{ currentMonthName }} {{ currentYear }}
          </h2>
          <button
            @click="nextMonth"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <i class="ph ph-caret-right text-xl"></i>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="goToToday"
            class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
          >
            Aujourd'hui
          </button>
          <button
            @click="showAddEventModal = true"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center gap-2"
          >
            <i class="ph ph-plus"></i>
            <span>Planifier</span>
          </button>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        <!-- Day Headers -->
        <div
          v-for="day in weekDays"
          :key="day"
          class="bg-gray-50 dark:bg-gray-800 p-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400"
        >
          {{ day }}
        </div>

        <!-- Calendar Days -->
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="bg-white dark:bg-gray-800 min-h-[120px] p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          :class="{
            'opacity-40': !day.isCurrentMonth,
            'ring-2 ring-teal-500 ring-inset': day.isToday
          }"
          @click="selectDate(day.date)"
        >
          <div class="flex items-center justify-between mb-1">
            <span
              class="text-sm font-medium"
              :class="day.isToday ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-gray-900 dark:text-white'"
            >
              {{ day.dayNumber }}
            </span>
            <span v-if="getEventsForDay(day.date).length > 0" class="text-xs text-gray-500">
              {{ getEventsForDay(day.date).length }}
            </span>
          </div>
          <div class="space-y-1">
            <div
              v-for="event in getEventsForDay(day.date).slice(0, 3)"
              :key="event.id"
              @click.stop="editEvent(event)"
              class="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
              :class="getEventClass(event.type)"
            >
              {{ event.title }}
            </div>
            <div
              v-if="getEventsForDay(day.date).length > 3"
              class="text-xs text-gray-500 dark:text-gray-400"
            >
              +{{ getEventsForDay(day.date).length - 3 }} autres
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Events -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Upcoming Reviews -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="ph ph-clock text-blue-500"></i>
          Prochaines revues
        </h3>
        <div v-if="upcomingReviews.length === 0" class="text-center py-8 text-gray-500">
          <i class="ph ph-calendar-blank text-4xl mb-2"></i>
          <p>Aucune revue planifiee</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="event in upcomingReviews"
            :key="event.id"
            class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white">{{ event.title }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ formatDate(event.date) }}</p>
            </div>
            <button
              v-if="!event.isFromDeadline"
              @click="deleteEvent(event.id)"
              class="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded"
            >
              <i class="ph ph-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Upcoming Validations -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="ph ph-check-circle text-green-500"></i>
          Validations a venir
        </h3>
        <div v-if="upcomingValidations.length === 0" class="text-center py-8 text-gray-500">
          <i class="ph ph-calendar-blank text-4xl mb-2"></i>
          <p>Aucune validation planifiee</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="event in upcomingValidations"
            :key="event.id"
            class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="w-2 h-2 rounded-full bg-green-500"></div>
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white">{{ event.title }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ formatDate(event.date) }}</p>
            </div>
            <button
              v-if="!event.isFromDeadline"
              @click="deleteEvent(event.id)"
              class="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded"
            >
              <i class="ph ph-trash"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Upcoming Deadlines from LOs -->
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <i class="ph ph-alarm text-red-500"></i>
          Deadlines LO
        </h3>
        <div v-if="upcomingDeadlines.length === 0" class="text-center py-8 text-gray-500">
          <i class="ph ph-calendar-blank text-4xl mb-2"></i>
          <p>Aucune deadline definie</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="dl in upcomingDeadlines"
            :key="dl.id"
            class="flex items-center gap-3 p-3 rounded-lg"
            :class="dl.isOverdue
              ? 'bg-red-50 dark:bg-red-900/20'
              : dl.isSoon
                ? 'bg-orange-50 dark:bg-orange-900/20'
                : 'bg-gray-50 dark:bg-gray-700'"
          >
            <div
              class="w-2 h-2 rounded-full"
              :class="dl.isOverdue ? 'bg-red-500' : dl.isSoon ? 'bg-orange-500' : 'bg-gray-400'"
            ></div>
            <div class="flex-1">
              <p class="font-medium text-gray-900 dark:text-white">{{ dl.title }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ dl.label }} — {{ formatDate(dl.date) }}</p>
            </div>
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full"
              :class="dl.isOverdue
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : dl.isSoon
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'"
            >
              {{ dl.daysLabel }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Event Modal -->
    <Modal
      v-model="showAddEventModal"
      :title="editingEvent ? 'Modifier l\'evenement' : 'Planifier un evenement'"
      icon="ph-calendar-plus"
      size="md"
    >
      <div class="space-y-4">
        <!-- Event Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type d'evenement
          </label>
          <div class="flex gap-2">
            <button
              v-for="type in eventTypes"
              :key="type.value"
              @click="newEvent.type = type.value"
              class="flex-1 px-4 py-2 rounded-lg border-2 transition"
              :class="newEvent.type === type.value
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700'"
            >
              <i :class="type.icon" class="mr-2"></i>
              {{ type.label }}
            </button>
          </div>
        </div>

        <!-- Select LO -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Learning Outcome
          </label>
          <select
            v-model="newEvent.outcomeId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Selectionner un LO</option>
            <option v-for="lo in competencesStore.allOutcomes" :key="lo.id" :value="lo.id">
              {{ lo.id }} - {{ lo.description.substring(0, 50) }}...
            </option>
          </select>
        </div>

        <!-- Select Year -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Annee
          </label>
          <div class="flex gap-2">
            <button
              v-for="year in ['L1', 'L2', 'L3']"
              :key="year"
              @click="newEvent.year = year"
              class="flex-1 px-4 py-2 rounded-lg border-2 transition"
              :class="newEvent.year === year
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-700'"
            >
              {{ year }}
            </button>
          </div>
        </div>

        <!-- Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date
          </label>
          <input
            v-model="newEvent.date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (optionnel)
          </label>
          <textarea
            v-model="newEvent.notes"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Ajouter des notes..."
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            @click="showAddEventModal = false"
            class="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
          >
            Annuler
          </button>
          <button
            @click="saveEvent"
            :disabled="!newEvent.outcomeId || !newEvent.date"
            class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {{ editingEvent ? 'Modifier' : 'Planifier' }}
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useCompetencesStore } from '@/stores/competences'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'

interface CalendarEvent {
  id?: string
  type: 'review' | 'validation' | 'deadline'
  outcomeId: string
  year: string
  date: string
  title: string
  notes?: string
  createdBy: string
  createdAt: number
  isFromDeadline?: boolean
}

import type { YearLevel } from '@/types'

const competencesStore = useCompetencesStore()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const currentDate = ref(new Date())
const events = ref<CalendarEvent[]>([])
const showAddEventModal = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const selectedDate = ref<string>('')

const newEvent = ref({
  type: 'review' as 'review' | 'validation' | 'deadline',
  outcomeId: '',
  year: 'L1',
  date: '',
  notes: ''
})

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const eventTypes = [
  { value: 'review', label: 'Revue', icon: 'ph ph-eye' },
  { value: 'validation', label: 'Validation', icon: 'ph ph-check-circle' },
  { value: 'deadline', label: 'Deadline', icon: 'ph ph-warning' }
]

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())
const currentMonthName = computed(() => {
  return currentDate.value.toLocaleDateString('fr-FR', { month: 'long' })
})

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const days: Array<{
    date: string
    dayNumber: number
    isCurrentMonth: boolean
    isToday: boolean
  }> = []

  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const date = new Date(year, month - 1, day)
    days.push({
      date: date.toISOString().split('T')[0],
      dayNumber: day,
      isCurrentMonth: false,
      isToday: false
    })
  }

  // Current month days
  const today = new Date().toISOString().split('T')[0]
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === today
    })
  }

  // Next month days to fill grid (6 rows)
  const remaining = 42 - days.length
  for (let day = 1; day <= remaining; day++) {
    const date = new Date(year, month + 1, day)
    days.push({
      date: date.toISOString().split('T')[0],
      dayNumber: day,
      isCurrentMonth: false,
      isToday: false
    })
  }

  return days
})

// Computed: deadlines extracted from LO mappings as CalendarEvents
const deadlineEvents = computed<CalendarEvent[]>(() => {
  const result: CalendarEvent[] = []
  for (const outcome of competencesStore.allOutcomes) {
    for (const year of ['L1', 'L2', 'L3'] as YearLevel[]) {
      const dl = outcome.mappings[year]?.deadline
      if (dl) {
        const dateStr = new Date(dl.date).toISOString().split('T')[0]
        result.push({
          id: `dl-${outcome.id}-${year}`,
          type: 'deadline',
          outcomeId: outcome.id,
          year,
          date: dateStr,
          title: `${outcome.id} (${year}) — ${dl.label}`,
          createdBy: '',
          createdAt: 0,
          isFromDeadline: true
        })
      }
    }
  }
  return result
})

// Merge Firestore events + LO deadline events
const allEvents = computed(() => [...events.value, ...deadlineEvents.value])

const upcomingReviews = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return allEvents.value
    .filter(e => e.type === 'review' && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
})

const upcomingValidations = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return allEvents.value
    .filter(e => e.type === 'validation' && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)
})

const upcomingDeadlines = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  return deadlineEvents.value
    .map(e => {
      const dlDate = new Date(e.date + 'T00:00:00')
      const days = Math.ceil((dlDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...e,
        label: e.title.split(' — ')[1] || '',
        isOverdue: days < 0,
        isSoon: days >= 0 && days <= 3,
        daysLabel: days < 0
          ? `${Math.abs(days)}j en retard`
          : days === 0
            ? "Aujourd'hui"
            : days === 1
              ? 'Demain'
              : `Dans ${days}j`
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8)
})

function getEventsForDay(date: string): CalendarEvent[] {
  return allEvents.value.filter(e => e.date === date)
}

function getEventClass(type: string): string {
  const classes: Record<string, string> = {
    review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    validation: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    deadline: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }
  return classes[type] || classes.review
}

function previousMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

function goToToday() {
  currentDate.value = new Date()
}

function selectDate(date: string) {
  selectedDate.value = date
  newEvent.value.date = date
  showAddEventModal.value = true
}

function editEvent(event: CalendarEvent) {
  editingEvent.value = event
  newEvent.value = {
    type: event.type,
    outcomeId: event.outcomeId,
    year: event.year,
    date: event.date,
    notes: event.notes || ''
  }
  showAddEventModal.value = true
}

async function saveEvent() {
  if (!newEvent.value.outcomeId || !newEvent.value.date) return

  const outcome = competencesStore.getOutcomeById(newEvent.value.outcomeId)
  if (!outcome) return

  try {
    const eventData: Omit<CalendarEvent, 'id'> = {
      type: newEvent.value.type,
      outcomeId: newEvent.value.outcomeId,
      year: newEvent.value.year,
      date: newEvent.value.date,
      title: `${outcome.id} (${newEvent.value.year})`,
      notes: newEvent.value.notes,
      createdBy: authStore.currentUser?.email || '',
      createdAt: Date.now()
    }

    if (editingEvent.value?.id) {
      await updateDoc(doc(db, 'calendar_events', editingEvent.value.id), eventData)
      success('Evenement modifie')
    } else {
      await addDoc(collection(db, 'calendar_events'), eventData)
      success('Evenement planifie')
    }

    showAddEventModal.value = false
    resetNewEvent()
  } catch (err) {
    showError('Erreur lors de la sauvegarde')
  }
}

async function deleteEvent(eventId: string) {
  try {
    await deleteDoc(doc(db, 'calendar_events', eventId))
    success('Evenement supprime')
  } catch (err) {
    showError('Erreur lors de la suppression')
  }
}

function resetNewEvent() {
  editingEvent.value = null
  newEvent.value = {
    type: 'review',
    outcomeId: '',
    year: 'L1',
    date: '',
    notes: ''
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

onMounted(() => {
  // Load events
  const q = query(collection(db, 'calendar_events'), orderBy('date', 'asc'))
  onSnapshot(q, (snapshot) => {
    events.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CalendarEvent))
  })
})
</script>
