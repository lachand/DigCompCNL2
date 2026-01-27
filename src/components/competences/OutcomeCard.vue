<template>
  <div
    class="bg-white dark:bg-gray-800 border rounded-lg shadow-sm hover:shadow-md transition"
    :class="[
      isLocked ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700',
      isPinned ? 'ring-2 ring-yellow-400' : '',
      selected ? 'ring-2 ring-indigo-500' : ''
    ]"
  >
    <!-- Lock Conflict Banner (always visible) -->
    <div v-if="lockedBy" class="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-2">
      <span class="relative flex h-2.5 w-2.5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
      </span>
      <i class="ph ph-lock-key text-red-600 dark:text-red-400"></i>
      <span class="text-xs font-medium text-red-700 dark:text-red-300">
        En cours d'edition par <strong>{{ lockedBy.split('@')[0] }}</strong>
      </span>
      <UserAvatar :email="lockedBy" :size="20" class="ml-auto" />
    </div>

    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <!-- Checkbox for selection -->
            <input
              v-if="selectable"
              type="checkbox"
              :checked="selected"
              @change="$emit('toggle-select')"
              class="w-4 h-4 rounded text-indigo-600 mr-1"
              @click.stop
            />
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ outcome.id }}</h3>
            <span class="px-2 py-1 text-xs font-medium rounded" :class="levelClass">
              {{ outcome.level }}
            </span>
            <i
              v-if="isPinned"
              class="ph-fill ph-push-pin text-yellow-500"
              title="Épinglé"
            ></i>
          </div>
          <p class="text-gray-700 dark:text-gray-300">{{ outcome.description }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1">
          <button
            data-tour="ai-assistant"
            @click="showAIAssistant = true"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title="Assistant IA"
          >
            <i class="ph ph-magic-wand"></i>
          </button>
          <button
            @click="showResourceHunter = true"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title="Resource Hunter"
          >
            <i class="ph ph-magnifying-glass"></i>
          </button>
          <button
            @click="authStore.togglePin(outcome.id)"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            :title="isPinned ? 'Désépingler' : 'Épingler'"
          >
            <i class="ph" :class="isPinned ? 'ph-fill ph-push-pin' : 'ph-push-pin'"></i>
          </button>
          <button
            @click="expanded = !expanded"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <i class="ph" :class="expanded ? 'ph-caret-up' : 'ph-caret-down'"></i>
          </button>
        </div>
      </div>

      <!-- Tags & Assignees -->
      <div class="flex items-center gap-3 mt-3">
        <TagManager :outcome="outcome" compact />
        <AssigneeManager :outcome="outcome" compact />
      </div>
    </div>

    <!-- Year Mappings -->
    <div v-if="outcome.mappings" class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
      <div
        v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])"
        :key="year"
        class="p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-semibold text-gray-900 dark:text-white">{{ year }}</h4>
          <StatusDropdown
            :status="outcome.mappings[year]?.status || 'none'"
            :outcome-id="outcome.id"
            :year="year"
          />
        </div>

        <!-- Review Status / Request -->
        <div v-if="outcome.mappings[year]?.status === 'review'" class="mb-3">
          <div v-if="getActiveReview(outcome.id, year)" class="flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs">
            <i class="ph ph-hourglass text-blue-500"></i>
            <span class="text-blue-700 dark:text-blue-400">
              Review en cours par <strong>{{ getActiveReview(outcome.id, year)!.reviewer.split('@')[0] }}</strong>
            </span>
          </div>
          <div v-else>
            <button
              @click="openReviewPopover(year)"
              class="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition"
            >
              <i class="ph ph-user-check"></i>
              Demander une review
            </button>
          </div>
        </div>

        <!-- Review Request Popover -->
        <div
          v-if="reviewPopoverYear === year"
          class="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 space-y-2"
        >
          <select
            v-model="reviewSelectedUser"
            class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Choisir un reviewer</option>
            <option
              v-for="user in availableReviewers"
              :key="user.email"
              :value="user.email"
            >
              {{ user.email.split('@')[0] }}
            </option>
          </select>
          <textarea
            v-model="reviewComment"
            rows="2"
            placeholder="Message (optionnel)"
            class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          ></textarea>
          <div class="flex gap-2">
            <button
              @click="reviewPopoverYear = null"
              class="flex-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
            >
              Annuler
            </button>
            <button
              @click="sendReviewRequest(year)"
              :disabled="!reviewSelectedUser"
              class="flex-1 px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded"
            >
              Envoyer
            </button>
          </div>
        </div>

        <!-- Deadline Badge -->
        <div v-if="outcome.mappings[year]?.deadline" class="mb-3">
          <div
            class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium"
            :class="getDeadlineClass(outcome.mappings[year].deadline!)"
          >
            <i class="ph" :class="getDeadlineIcon(outcome.mappings[year].deadline!)"></i>
            <span class="flex-1">
              {{ outcome.mappings[year].deadline!.label }} —
              {{ formatDeadlineDate(outcome.mappings[year].deadline!.date) }}
            </span>
            <span class="text-[10px] opacity-75">{{ getDeadlineDaysLabel(outcome.mappings[year].deadline!) }}</span>
            <button
              @click="removeDeadline(outcome.id, year)"
              class="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
              title="Supprimer la deadline"
            >
              <i class="ph ph-x text-xs"></i>
            </button>
          </div>
        </div>

        <!-- Set Deadline Button -->
        <div v-if="!outcome.mappings[year]?.deadline" class="mb-3">
          <button
            @click="openDeadlinePopover(year)"
            class="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <i class="ph ph-calendar-plus"></i>
            Définir deadline
          </button>
        </div>

        <!-- Deadline Popover -->
        <div
          v-if="deadlinePopoverYear === year"
          class="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 space-y-2"
        >
          <input
            v-model="deadlineLabel"
            type="text"
            placeholder="Label (ex: Finalisation)"
            class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <input
            v-model="deadlineDateStr"
            type="date"
            class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <div class="flex gap-2">
            <button
              @click="deadlinePopoverYear = null"
              class="flex-1 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
            >
              Annuler
            </button>
            <button
              @click="saveDeadline(year)"
              :disabled="!deadlineLabel || !deadlineDateStr"
              class="flex-1 px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded"
            >
              Définir
            </button>
          </div>
        </div>

        <!-- Course Link -->
        <div v-if="outcome.mappings[year]?.courseLink" class="mb-3">
          <a
            :href="outcome.mappings[year].courseLink"
            target="_blank"
            class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <i class="ph ph-link"></i>
            Lien vers le cours
          </a>
        </div>

        <!-- Resources -->
        <ResourceList
          :resources="outcome.mappings[year]?.resources || []"
          :outcome-id="outcome.id"
          :year="year"
        />
      </div>
    </div>

    <!-- Expanded Section -->
    <div v-if="expanded" class="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <!-- Comments -->
      <CommentsList :outcome="outcome" />

    </div>

    <!-- AI Assistant Modal -->
    <AIAssistant v-model="showAIAssistant" :outcome="outcome" />

    <!-- Resource Hunter Modal -->
    <ResourceHunter v-model="showResourceHunter" :outcome="outcome" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompetencesStore } from '@/stores/competences'
import StatusDropdown from './StatusDropdown.vue'
import ResourceList from './ResourceList.vue'
import CommentsList from './CommentsList.vue'
import TagManager from './TagManager.vue'
import AssigneeManager from './AssigneeManager.vue'
import AIAssistant from '@/components/ai/AIAssistant.vue'
import ResourceHunter from './ResourceHunter.vue'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import { useReviewRequests } from '@/composables/useReviewRequests'
import type { LearningOutcome, YearLevel, Deadline } from '@/types'

interface Props {
  outcome: LearningOutcome
  selected?: boolean
  selectable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  selectable: true
})

defineEmits<{
  'toggle-select': []
}>()

const authStore = useAuthStore()
const competencesStore = useCompetencesStore()
const { getReviewForOutcome, createReviewRequest } = useReviewRequests()

const expanded = ref(false)
const showAIAssistant = ref(false)
const showResourceHunter = ref(false)

// Review popover state
const reviewPopoverYear = ref<YearLevel | null>(null)
const reviewSelectedUser = ref('')
const reviewComment = ref('')

const availableReviewers = computed(() => {
  return authStore.users.filter(u => u.email !== authStore.currentUser?.email)
})

function openReviewPopover(year: YearLevel) {
  reviewPopoverYear.value = year
  reviewSelectedUser.value = ''
  reviewComment.value = ''
}

function getActiveReview(outcomeId: string, year: YearLevel) {
  return getReviewForOutcome(outcomeId, year)
}

async function sendReviewRequest(year: YearLevel) {
  if (!reviewSelectedUser.value) return
  await createReviewRequest(
    props.outcome.id,
    year,
    reviewSelectedUser.value,
    reviewComment.value || undefined
  )
  reviewPopoverYear.value = null
}

// Deadline popover state
const deadlinePopoverYear = ref<YearLevel | null>(null)
const deadlineLabel = ref('')
const deadlineDateStr = ref('')

function openDeadlinePopover(year: YearLevel) {
  deadlinePopoverYear.value = year
  deadlineLabel.value = ''
  deadlineDateStr.value = ''
}

function getDeadlineDaysRemaining(deadline: Deadline): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(deadline.date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getDeadlineClass(deadline: Deadline): string {
  const days = getDeadlineDaysRemaining(deadline)
  if (days < 0) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  if (days <= 3) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

function getDeadlineIcon(deadline: Deadline): string {
  const days = getDeadlineDaysRemaining(deadline)
  if (days < 0) return 'ph-alarm text-red-600 dark:text-red-400'
  if (days <= 3) return 'ph-warning text-orange-600 dark:text-orange-400'
  return 'ph-calendar text-gray-500'
}

function getDeadlineDaysLabel(deadline: Deadline): string {
  const days = getDeadlineDaysRemaining(deadline)
  if (days < 0) return `${Math.abs(days)}j en retard`
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  return `Dans ${days}j`
}

function formatDeadlineDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

async function saveDeadline(year: YearLevel) {
  if (!deadlineLabel.value || !deadlineDateStr.value) return
  const deadline: Deadline = {
    date: new Date(deadlineDateStr.value).getTime(),
    label: deadlineLabel.value
  }
  await competencesStore.setDeadline(props.outcome.id, year, deadline)
  deadlinePopoverYear.value = null
}

async function removeDeadline(outcomeId: string, year: YearLevel) {
  await competencesStore.removeDeadline(outcomeId, year)
}

const isPinned = computed(() => authStore.isPinned(props.outcome.id))
const isLocked = computed(() => competencesStore.isLocked(props.outcome.id))
const lockedBy = computed(() => competencesStore.getLockedBy(props.outcome.id))

const levelClass = computed(() => {
  const classes = {
    'Basic': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'Advanced': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'Highly advanced': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[props.outcome.level]
})
</script>
