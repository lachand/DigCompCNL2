<template>
  <Transition
    enter-active-class="transition-transform duration-300"
    enter-from-class="-translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-300"
    leave-from-class="translate-x-0"
    leave-to-class="-translate-x-full"
  >
    <div
      v-if="isOpen"
      class="fixed left-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl z-40 flex flex-col"
    >
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <i class="ph ph-clock-counter-clockwise"></i>
          Historique d'activité
        </h2>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <i class="ph ph-x"></i>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200 dark:border-gray-700">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex-1 py-3 text-sm font-medium transition border-b-2"
          :class="activeTab === tab.id
            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
            : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'"
        >
          <i :class="tab.icon" class="mr-1"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- Activity Feed Tab -->
      <div v-if="activeTab === 'activity'" class="flex-1 overflow-y-auto p-4">
        <div class="space-y-3">
          <div
            v-for="activity in activities"
            :key="activity.id"
            class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer"
          >
            <UserAvatar :email="activity.user" :size="32" />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900 dark:text-white">
                <span class="font-medium">{{ activity.user.split('@')[0] }}</span>
                <span class="text-gray-600 dark:text-gray-400"> {{ activity.action }}</span>
              </p>
              <p class="text-xs text-gray-600 dark:text-gray-400 truncate">{{ activity.detail }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">{{ formatDate(activity.date) }}</p>
            </div>
            <i class="ph ph-dot text-2xl" :class="activityColor(activity.action)"></i>
          </div>

          <div v-if="activities.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            <i class="ph ph-activity text-4xl mb-2"></i>
            <p>Aucune activité récente</p>
          </div>
        </div>

        <button
          v-if="activities.length >= limitCount"
          @click="loadMore"
          class="w-full mt-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
        >
          Charger plus
        </button>
      </div>

      <!-- Audit Log Tab -->
      <div v-if="activeTab === 'audit'" class="flex-1 overflow-y-auto p-4">
        <!-- Filters -->
        <div class="flex gap-2 mb-4">
          <select
            v-model="auditFilter"
            class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Tous les types</option>
            <option value="status_change">Changement de statut</option>
            <option value="link_update">Modification de lien</option>
            <option value="resource_add">Ajout de ressource</option>
            <option value="resource_remove">Suppression de ressource</option>
          </select>
        </div>

        <div class="space-y-3">
          <div
            v-for="log in filteredAuditLogs"
            :key="log.id"
            class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4"
            :class="auditBorderColor(log.action)"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{{ log.action.replace('_', ' ') }}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(log.timestamp) }}</span>
            </div>
            <p class="text-sm text-gray-900 dark:text-white">{{ log.desc }}</p>
            <div class="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{{ log.user.split('@')[0] }}</span>
              <span v-if="log.year" class="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">{{ log.year }}</span>
              <span class="font-mono">{{ log.targetId }}</span>
            </div>
            <!-- Diff view -->
            <div v-if="log.oldVal || log.newVal" class="mt-2 text-xs">
              <div v-if="log.oldVal" class="text-red-600 dark:text-red-400">
                - {{ log.oldVal }}
              </div>
              <div v-if="log.newVal" class="text-green-600 dark:text-green-400">
                + {{ log.newVal }}
              </div>
            </div>
          </div>

          <div v-if="filteredAuditLogs.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            <i class="ph ph-clipboard-text text-4xl mb-2"></i>
            <p>Aucun log d'audit</p>
          </div>
        </div>
      </div>

      <!-- AI History Tab -->
      <div v-if="activeTab === 'ai'" class="flex-1 overflow-y-auto p-4">
        <div class="space-y-3">
          <div
            v-for="entry in aiHistory"
            :key="entry.id"
            @click="selectedAIEntry = entry"
            class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="px-2 py-0.5 text-xs rounded bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
                {{ typeLabels[entry.type] }}
              </span>
              <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(entry.timestamp) }}</span>
            </div>
            <p class="text-sm font-mono text-gray-900 dark:text-white">{{ entry.outcomeId }}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{{ entry.outcomeDescription }}</p>
            <div class="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{{ entry.user.split('@')[0] }}</span>
              <span>{{ entry.model }}</span>
            </div>
          </div>

          <div v-if="aiHistory.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            <i class="ph ph-sparkle text-4xl mb-2"></i>
            <p>Aucune génération IA</p>
          </div>
        </div>
      </div>

      <!-- AI Entry Preview Modal -->
      <div
        v-if="selectedAIEntry"
        class="absolute inset-0 bg-white dark:bg-gray-800 flex flex-col"
      >
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ typeLabels[selectedAIEntry.type] }} - {{ selectedAIEntry.outcomeId }}
          </h3>
          <button
            @click="selectedAIEntry = null"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-4 prose dark:prose-invert max-w-none">
          <div v-html="renderMarkdown(selectedAIEntry.content)"></div>
        </div>
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            @click="copyContent(selectedAIEntry.content)"
            class="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition flex items-center justify-center gap-2"
          >
            <i class="ph ph-copy"></i>
            Copier
          </button>
          <button
            @click="deleteAIEntry(selectedAIEntry.id)"
            class="px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition"
          >
            <i class="ph ph-trash"></i>
          </button>
        </div>
      </div>

      <!-- Stats Footer -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-lg font-bold text-indigo-600 dark:text-indigo-400">{{ activities.length }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Activités</p>
          </div>
          <div>
            <p class="text-lg font-bold text-purple-600 dark:text-purple-400">{{ competencesStore.auditLogs.length }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Audits</p>
          </div>
          <div>
            <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ aiHistory.length }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Générations IA</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useCompetencesStore } from '@/stores/competences'
import { useAICache } from '@/composables/useAICache'
import { useMarkdown } from '@/composables/useMarkdown'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/utils/helpers'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import type { ActivityFeed, AIHistoryEntry, AIGenerationType } from '@/types'

interface Props {
  isOpen: boolean
}

defineProps<Props>()
defineEmits<{ close: [] }>()

const competencesStore = useCompetencesStore()
const { historyEntries: aiHistory, loadHistory, deleteEntry } = useAICache()
const markdown = useMarkdown()
const { success } = useToast()

const activeTab = ref<'activity' | 'audit' | 'ai'>('activity')
const activities = ref<ActivityFeed[]>([])
const limitCount = ref(20)
const auditFilter = ref('')
const selectedAIEntry = ref<AIHistoryEntry | null>(null)

const tabs = [
  { id: 'activity' as const, label: 'Activité', icon: 'ph ph-activity' },
  { id: 'audit' as const, label: 'Audit', icon: 'ph ph-clipboard-text' },
  { id: 'ai' as const, label: 'IA', icon: 'ph ph-sparkle' }
]

const typeLabels: Record<AIGenerationType, string> = {
  course: 'Plan de cours',
  td: 'TD / Exercices',
  qcm: 'QCM',
  practice: 'Mise en situation'
}

const filteredAuditLogs = computed(() => {
  if (!auditFilter.value) return competencesStore.auditLogs
  return competencesStore.auditLogs.filter(log => log.action === auditFilter.value)
})

const activityColor = (action: string) => {
  if (action.includes('ajout') || action.includes('créé')) return 'text-green-500'
  if (action.includes('supprim') || action.includes('retiré')) return 'text-red-500'
  if (action.includes('modifi') || action.includes('changé')) return 'text-blue-500'
  return 'text-gray-500'
}

const auditBorderColor = (action: string) => {
  const colors: Record<string, string> = {
    'status_change': 'border-blue-500',
    'link_update': 'border-purple-500',
    'resource_add': 'border-green-500',
    'resource_remove': 'border-red-500',
    'description_edit': 'border-orange-500'
  }
  return colors[action] || 'border-gray-300'
}

const renderMarkdown = (content: string) => markdown.render(content)

const copyContent = async (content: string) => {
  await navigator.clipboard.writeText(content)
  success('Contenu copié')
}

const deleteAIEntry = async (id: string) => {
  await deleteEntry(id)
  selectedAIEntry.value = null
  success('Entrée supprimée')
}

const loadActivities = () => {
  const q = query(
    collection(db, 'activity_feed'),
    orderBy('date', 'desc'),
    limit(limitCount.value)
  )

  onSnapshot(q, (snapshot) => {
    activities.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActivityFeed))
  })
}

const loadMore = () => {
  limitCount.value += 20
  loadActivities()
}

onMounted(() => {
  loadActivities()
  loadHistory()
})
</script>
