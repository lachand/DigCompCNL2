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
      class="fixed left-0 top-0 h-full w-96 theme-surface border-r border-gray-200 dark:border-gray-700 shadow-xl z-40 flex flex-col"
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
          class="flex-1 py-3 text-xs font-medium transition border-b-2"
          :class="activeTab === tab.id
            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
            : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'"
        >
          <i :class="tab.icon" class="mr-1"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- Activity Feed Tab -->
      <div v-if="activeTab === 'activity'" class="flex-1 overflow-y-auto flex flex-col">
        <!-- Filters -->
        <div class="p-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
          <div class="flex gap-2">
            <div class="relative flex-1">
              <i class="ph ph-magnifying-glass absolute left-2.5 top-2.5 text-gray-400 text-sm"></i>
              <input
                v-model="activitySearch"
                type="text"
                placeholder="Rechercher..."
                class="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              @click="showActivityFilters = !showActivityFilters"
              class="px-2.5 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              :class="hasActiveFilters ? 'text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-600' : 'text-gray-600 dark:text-gray-400'"
            >
              <i class="ph ph-funnel"></i>
            </button>
          </div>
          <div v-if="showActivityFilters" class="space-y-2">
            <select
              v-model="activityUserFilter"
              class="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Tous les utilisateurs</option>
              <option v-for="user in uniqueUsers" :key="user" :value="user">{{ user.split('@')[0] }}</option>
            </select>
            <select
              v-model="activityActionFilter"
              class="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Toutes les actions</option>
              <option value="changé">Changement de statut</option>
              <option value="ajouté">Ajout</option>
              <option value="supprim">Suppression</option>
              <option value="modifi">Modification</option>
            </select>
            <div class="flex gap-2">
              <input
                v-model="activityDateFrom"
                type="date"
                class="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                v-model="activityDateTo"
                type="date"
                class="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              v-if="hasActiveFilters"
              @click="clearActivityFilters"
              class="w-full py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            >
              Effacer les filtres
            </button>
          </div>
        </div>

        <!-- Summary Stats -->
        <div v-if="filteredActivities.length > 0" class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span class="flex items-center gap-1"><i class="ph ph-list-bullets"></i> {{ filteredActivities.length }} résultats</span>
          <span v-if="activityStatsSummary.changes" class="flex items-center gap-1 text-blue-500"><i class="ph ph-dot"></i> {{ activityStatsSummary.changes }} statuts</span>
          <span v-if="activityStatsSummary.adds" class="flex items-center gap-1 text-green-500"><i class="ph ph-dot"></i> {{ activityStatsSummary.adds }} ajouts</span>
        </div>

        <!-- Timeline grouped by day -->
        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="filteredActivities.length > 0" class="relative">
            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>

            <template v-for="(group, gIdx) in groupedActivities" :key="gIdx">
              <!-- Day header -->
              <div class="relative pl-10 pb-3">
                <div class="absolute left-1.5 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <i class="ph ph-calendar-blank text-indigo-600 dark:text-indigo-400 text-xs"></i>
                </div>
                <p class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide pt-0.5">
                  {{ group.label }}
                </p>
              </div>

              <!-- Events in day -->
              <div
                v-for="activity in group.items"
                :key="activity.id"
                class="relative pl-10 pb-4 last:pb-2 cursor-pointer"
                @click="navigateToLO(activity.detail)"
              >
                <div
                  class="absolute left-2.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
                  :class="activityDotColor(activity.action)"
                ></div>
                <div class="p-2.5 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                  <div class="flex items-center gap-2">
                    <UserAvatar :email="activity.user" :size="22" />
                    <span class="text-xs font-medium text-gray-900 dark:text-white">{{ activity.user.split('@')[0] }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 ml-auto">{{ formatTime(activity.date) }}</span>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {{ activity.action }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5 font-mono">{{ activity.detail }}</p>
                </div>
              </div>
            </template>
          </div>

          <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            <i class="ph ph-activity text-4xl mb-2"></i>
            <p>{{ hasActiveFilters || activitySearch ? 'Aucun résultat pour ces filtres' : 'Aucune activité récente' }}</p>
          </div>

          <button
            v-if="activities.length >= limitCount"
            @click="loadMore"
            class="w-full mt-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
          >
            Charger plus
          </button>
        </div>
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
              <button
                class="font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
                @click="selectLOTimeline(log.targetId)"
              >
                {{ log.targetId }}
              </button>
            </div>
            <!-- Enhanced Diff view -->
            <div v-if="log.oldVal || log.newVal" class="mt-2 text-xs font-mono rounded overflow-hidden border border-gray-200 dark:border-gray-600">
              <div v-if="log.oldVal && log.newVal && isLongDiff(log.oldVal, log.newVal)" class="p-2 bg-gray-100 dark:bg-gray-800">
                <div
                  v-for="(segment, i) in computeWordDiff(log.oldVal, log.newVal)"
                  :key="i"
                  class="inline"
                >
                  <span
                    v-if="segment.type === 'equal'"
                    class="text-gray-600 dark:text-gray-400"
                  >{{ segment.text }}</span>
                  <span
                    v-else-if="segment.type === 'removed'"
                    class="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 line-through"
                  >{{ segment.text }}</span>
                  <span
                    v-else-if="segment.type === 'added'"
                    class="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                  >{{ segment.text }}</span>
                </div>
              </div>
              <template v-else>
                <div v-if="log.oldVal" class="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                  - {{ log.oldVal }}
                </div>
                <div v-if="log.newVal" class="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                  + {{ log.newVal }}
                </div>
              </template>
            </div>
          </div>

          <div v-if="filteredAuditLogs.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            <i class="ph ph-clipboard-text text-4xl mb-2"></i>
            <p>Aucun log d'audit</p>
          </div>
        </div>
      </div>

      <!-- Per-LO Timeline Tab -->
      <div v-if="activeTab === 'lo'" class="flex-1 overflow-y-auto flex flex-col">
        <!-- LO Selector -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <select
            v-model="selectedLO"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Sélectionner un LO...</option>
            <option v-for="lo in availableLOs" :key="lo.id" :value="lo.id">
              {{ lo.id }} - {{ lo.description?.substring(0, 40) }}{{ (lo.description?.length || 0) > 40 ? '...' : '' }}
            </option>
          </select>
        </div>

        <!-- LO Timeline -->
        <div v-if="selectedLO" class="flex-1 overflow-y-auto p-4">
          <!-- LO Info Header -->
          <div class="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p class="text-sm font-mono font-bold text-indigo-700 dark:text-indigo-300">{{ selectedLO }}</p>
            <p v-if="selectedLOData" class="text-xs text-indigo-600 dark:text-indigo-400 mt-1">{{ selectedLOData.description }}</p>
            <div v-if="selectedLOData" class="flex gap-2 mt-2">
              <span
                v-for="year in (['L1', 'L2', 'L3'] as const)"
                :key="year"
                class="px-2 py-0.5 text-xs rounded"
                :class="statusBadgeClass(selectedLOData.mappings[year]?.status)"
              >
                {{ year }}: {{ selectedLOData.mappings[year]?.status || 'N/A' }}
              </span>
            </div>
          </div>

          <!-- Timeline -->
          <div v-if="loTimeline.length > 0" class="relative">
            <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>
            <div
              v-for="(event, index) in loTimeline"
              :key="index"
              class="relative pl-10 pb-6 last:pb-0"
            >
              <!-- Timeline dot -->
              <div
                class="absolute left-2.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
                :class="timelineDotColor(event.action)"
              ></div>
              <!-- Event card -->
              <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-medium px-2 py-0.5 rounded" :class="timelineBadgeClass(event.action)">
                    {{ timelineTypeLabel(event.action) }}
                  </span>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(event.timestamp) }}</span>
                </div>
                <p class="text-sm text-gray-900 dark:text-white">{{ event.desc }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{{ event.user.split('@')[0] }}</span>
                  <span v-if="event.year" class="ml-2 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">{{ event.year }}</span>
                </p>
                <!-- Inline diff -->
                <div v-if="event.oldVal || event.newVal" class="mt-2 text-xs font-mono rounded overflow-hidden border border-gray-200 dark:border-gray-600">
                  <div v-if="event.oldVal && event.newVal && isLongDiff(event.oldVal, event.newVal)" class="p-2 bg-gray-100 dark:bg-gray-800">
                    <span
                      v-for="(segment, i) in computeWordDiff(event.oldVal, event.newVal)"
                      :key="i"
                    >
                      <span
                        v-if="segment.type === 'equal'"
                        class="text-gray-600 dark:text-gray-400"
                      >{{ segment.text }}</span>
                      <span
                        v-else-if="segment.type === 'removed'"
                        class="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 line-through"
                      >{{ segment.text }}</span>
                      <span
                        v-else-if="segment.type === 'added'"
                        class="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                      >{{ segment.text }}</span>
                    </span>
                  </div>
                  <template v-else>
                    <div v-if="event.oldVal" class="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                      - {{ event.oldVal }}
                    </div>
                    <div v-if="event.newVal" class="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                      + {{ event.newVal }}
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            <i class="ph ph-timeline text-4xl mb-2"></i>
            <p>Aucun historique pour ce LO</p>
          </div>
        </div>

        <!-- No LO selected -->
        <div v-else class="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div class="text-center">
            <i class="ph ph-git-diff text-4xl mb-2"></i>
            <p>Sélectionner un Learning Outcome</p>
            <p class="text-xs mt-1">pour voir son historique de modifications</p>
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
        <div class="grid grid-cols-4 gap-2 text-center">
          <div>
            <p class="text-lg font-bold text-indigo-600 dark:text-indigo-400">{{ activities.length }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Activités</p>
          </div>
          <div>
            <p class="text-lg font-bold text-purple-600 dark:text-purple-400">{{ competencesStore.auditLogs.length }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Audits</p>
          </div>
          <div>
            <p class="text-lg font-bold text-orange-600 dark:text-orange-400">{{ loCount }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">LOs modifiés</p>
          </div>
          <div>
            <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ aiHistory.length }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">IA</p>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { useCompetencesStore } from '@/stores/competences'
import { useAuthStore } from '@/stores/auth'
import { useAICache } from '@/composables/useAICache'
import { useMarkdown } from '@/composables/useMarkdown'
import { useToast } from '@/composables/useToast'
import { formatDate } from '@/utils/helpers'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import type { ActivityFeed, AIHistoryEntry, AIGenerationType, AuditLog } from '@/types'

interface Props {
  isOpen: boolean
  initialLO?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const competencesStore = useCompetencesStore()
const authStore = useAuthStore()
const { historyEntries: aiHistory, loadHistory, deleteEntry } = useAICache()
const markdown = useMarkdown()
const { success } = useToast()

const activeTab = ref<'activity' | 'audit' | 'lo' | 'ai'>('activity')
const activities = ref<ActivityFeed[]>([])
const limitCount = ref(20)
const auditFilter = ref('')
const selectedAIEntry = ref<AIHistoryEntry | null>(null)
const selectedLO = ref('')

// --- Activity filters ---
const activitySearch = ref('')
const activityUserFilter = ref('')
const activityActionFilter = ref('')
const activityDateFrom = ref('')
const activityDateTo = ref('')
const showActivityFilters = ref(false)

const uniqueUsers = computed(() => {
  const users = new Set(activities.value.map(a => a.user))
  return [...users].sort()
})

const hasActiveFilters = computed(() => {
  return !!(activityUserFilter.value || activityActionFilter.value || activityDateFrom.value || activityDateTo.value)
})

const clearActivityFilters = () => {
  activityUserFilter.value = ''
  activityActionFilter.value = ''
  activityDateFrom.value = ''
  activityDateTo.value = ''
  activitySearch.value = ''
}

const filteredActivities = computed(() => {
  let list = activities.value

  if (activitySearch.value) {
    const q = activitySearch.value.toLowerCase()
    list = list.filter(a =>
      a.action.toLowerCase().includes(q) ||
      a.detail.toLowerCase().includes(q) ||
      a.user.toLowerCase().includes(q)
    )
  }

  if (activityUserFilter.value) {
    list = list.filter(a => a.user === activityUserFilter.value)
  }

  if (activityActionFilter.value) {
    list = list.filter(a => a.action.includes(activityActionFilter.value))
  }

  if (activityDateFrom.value) {
    const from = new Date(activityDateFrom.value).getTime()
    list = list.filter(a => a.date >= from)
  }

  if (activityDateTo.value) {
    const to = new Date(activityDateTo.value).getTime() + 86400000 // end of day
    list = list.filter(a => a.date <= to)
  }

  return list
})

const activityStatsSummary = computed(() => {
  const items = filteredActivities.value
  return {
    changes: items.filter(a => a.action.includes('changé')).length,
    adds: items.filter(a => a.action.includes('ajouté') || a.action.includes('créé')).length
  }
})

interface ActivityGroup {
  label: string
  items: ActivityFeed[]
}

const groupedActivities = computed((): ActivityGroup[] => {
  const groups: Map<string, ActivityFeed[]> = new Map()
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toDateString()
  const yesterdayStr = yesterday.toDateString()

  for (const a of filteredActivities.value) {
    const d = new Date(a.date)
    const dateStr = d.toDateString()
    let label: string
    if (dateStr === todayStr) label = "Aujourd'hui"
    else if (dateStr === yesterdayStr) label = 'Hier'
    else label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

    if (!groups.has(label)) groups.set(label, [])
    groups.get(label)!.push(a)
  }

  return [...groups.entries()].map(([label, items]) => ({ label, items }))
})

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const activityDotColor = (action: string) => {
  if (action.includes('ajout') || action.includes('créé')) return 'bg-green-500'
  if (action.includes('supprim') || action.includes('retiré')) return 'bg-red-500'
  if (action.includes('changé')) return 'bg-blue-500'
  if (action.includes('modifi')) return 'bg-orange-500'
  return 'bg-gray-400'
}

const navigateToLO = (detail: string) => {
  // Extract outcomeId from detail string (e.g., "1.1.1 (L1) : draft")
  const match = detail.match(/^([\d.]+)/)
  if (match) {
    selectedLO.value = match[1]
    activeTab.value = 'lo'
  }
}

const tabs = [
  { id: 'activity' as const, label: 'Activité', icon: 'ph ph-activity' },
  { id: 'audit' as const, label: 'Audit', icon: 'ph ph-clipboard-text' },
  { id: 'lo' as const, label: 'Par LO', icon: 'ph ph-git-diff' },
  { id: 'ai' as const, label: 'IA', icon: 'ph ph-sparkle' }
]

const typeLabels: Record<AIGenerationType, string> = {
  course: 'Plan de cours',
  td: 'TD / Exercices',
  qcm: 'QCM',
  practice: 'Mise en situation'
}

// --- Audit filters ---
const filteredAuditLogs = computed(() => {
  if (!auditFilter.value) return competencesStore.auditLogs
  return competencesStore.auditLogs.filter(log => log.action === auditFilter.value)
})

// --- LO Timeline ---
const availableLOs = computed(() => competencesStore.allOutcomes)

const selectedLOData = computed(() => {
  if (!selectedLO.value) return null
  return competencesStore.getOutcomeById(selectedLO.value)
})

const loTimeline = computed((): AuditLog[] => {
  if (!selectedLO.value) return []
  return competencesStore.auditLogs
    .filter(log => log.targetId === selectedLO.value)
    .sort((a, b) => b.timestamp - a.timestamp)
})

const loCount = computed(() => {
  const ids = new Set(competencesStore.auditLogs.map(l => l.targetId))
  return ids.size
})

const selectLOTimeline = (loId: string) => {
  selectedLO.value = loId
  activeTab.value = 'lo'
}

// Watch for initialLO prop
watch(() => props.initialLO, (val) => {
  if (val) {
    selectedLO.value = val
    activeTab.value = 'lo'
  }
})

// --- Word-level diff ---
interface DiffSegment {
  type: 'equal' | 'added' | 'removed'
  text: string
}

const isLongDiff = (oldVal: string, newVal: string): boolean => {
  return oldVal.length > 20 || newVal.length > 20
}

const computeWordDiff = (oldVal: string, newVal: string): DiffSegment[] => {
  const oldWords = oldVal.split(/(\s+)/)
  const newWords = newVal.split(/(\s+)/)

  // Simple LCS-based word diff
  const m = oldWords.length
  const n = newWords.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find diff
  const result: DiffSegment[] = []
  let i = m, j = n
  const stack: DiffSegment[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      stack.push({ type: 'equal', text: oldWords[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({ type: 'added', text: newWords[j - 1] })
      j--
    } else {
      stack.push({ type: 'removed', text: oldWords[i - 1] })
      i--
    }
  }

  // Reverse and merge consecutive segments of same type
  for (let k = stack.length - 1; k >= 0; k--) {
    const seg = stack[k]
    if (result.length > 0 && result[result.length - 1].type === seg.type) {
      result[result.length - 1].text += seg.text
    } else {
      result.push({ ...seg })
    }
  }

  return result
}

// --- Status badge helper ---
const statusBadgeClass = (status?: string) => {
  const classes: Record<string, string> = {
    'introduced': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'reinforced': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    'mastered': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'not_pianned': 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
  }
  return classes[status || ''] || 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
}

// --- Timeline visual helpers ---
const timelineDotColor = (action: string) => {
  const colors: Record<string, string> = {
    'status_change': 'bg-blue-500',
    'link_update': 'bg-purple-500',
    'resource_add': 'bg-green-500',
    'resource_remove': 'bg-red-500',
    'description_edit': 'bg-orange-500',
    'comment_add': 'bg-cyan-500'
  }
  return colors[action] || 'bg-gray-400'
}

const timelineBadgeClass = (action: string) => {
  const classes: Record<string, string> = {
    'status_change': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    'link_update': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'resource_add': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'resource_remove': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    'description_edit': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    'comment_add': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
  }
  return classes[action] || 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
}

const timelineTypeLabel = (action: string) => {
  const labels: Record<string, string> = {
    'status_change': 'Statut',
    'link_update': 'Lien',
    'resource_add': 'Ressource +',
    'resource_remove': 'Ressource -',
    'description_edit': 'Description',
    'comment_add': 'Commentaire'
  }
  return labels[action] || action.replace('_', ' ')
}

// --- Existing helpers ---
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
  if (props.initialLO) {
    selectedLO.value = props.initialLO
    activeTab.value = 'lo'
  }
})
</script>
