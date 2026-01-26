<template>
  <Modal
    v-model="isOpen"
    title="Historique des modifications"
    icon="ph-clock-clockwise"
    size="xl"
    variant="primary"
  >
    <div class="space-y-4">
      <!-- Filters -->
      <div class="flex gap-3">
        <select
          v-model="filterAction"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Toutes les actions</option>
          <option value="status_change">Changement de statut</option>
          <option value="link_update">Mise à jour de lien</option>
          <option value="resource_add">Ajout de ressource</option>
          <option value="resource_remove">Suppression de ressource</option>
          <option value="description_edit">Édition de description</option>
        </select>

        <select
          v-model="filterYear"
          class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Toutes les années</option>
          <option value="L1">L1</option>
          <option value="L2">L2</option>
          <option value="L3">L3</option>
        </select>

        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher..."
          class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <!-- Timeline -->
      <div class="space-y-3 max-h-[500px] overflow-y-auto">
        <div
          v-for="log in filteredLogs"
          :key="log.id"
          class="relative pl-8 pb-4 border-l-2 border-gray-200 dark:border-gray-700 last:border-l-0"
        >
          <!-- Timeline Dot -->
          <div class="absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800" :class="actionColor(log.action)"></div>

          <!-- Log Content -->
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <UserAvatar :email="log.user" :size="20" />
                  <span class="font-medium text-sm text-gray-900 dark:text-white">
                    {{ log.user.split('@')[0] }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(log.timestamp) }}
                  </span>
                  <span v-if="log.year" class="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs rounded">
                    {{ log.year }}
                  </span>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ log.desc }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ log.targetId }}</p>
              </div>

              <button
                v-if="log.oldVal && log.newVal"
                @click="showDiff(log)"
                class="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/40 rounded transition"
              >
                <i class="ph ph-git-diff"></i>
                Diff
              </button>
            </div>

            <!-- Diff View -->
            <div v-if="selectedLog?.id === log.id && log.oldVal && log.newVal" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p class="font-medium text-red-600 dark:text-red-400 mb-1">Avant</p>
                  <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                    <code class="text-red-700 dark:text-red-300">{{ log.oldVal }}</code>
                  </div>
                </div>
                <div>
                  <p class="font-medium text-green-600 dark:text-green-400 mb-1">Après</p>
                  <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <code class="text-green-700 dark:text-green-300">{{ log.newVal }}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredLogs.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
          <i class="ph ph-clock-clockwise text-6xl mb-4"></i>
          <p>Aucune modification trouvée</p>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import { formatDate } from '@/utils/helpers'
import Modal from '@/components/common/Modal.vue'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import type { AuditLog } from '@/types'

const emit = defineEmits<{
  close: []
}>()

const competencesStore = useCompetencesStore()

const isOpen = ref(true)
const filterAction = ref('')
const filterYear = ref('')
const searchQuery = ref('')
const selectedLog = ref<AuditLog | null>(null)

const filteredLogs = computed(() => {
  let logs = competencesStore.auditLogs

  if (filterAction.value) {
    logs = logs.filter(log => log.action === filterAction.value)
  }

  if (filterYear.value) {
    logs = logs.filter(log => log.year === filterYear.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    logs = logs.filter(log =>
      log.desc.toLowerCase().includes(query) ||
      log.user.toLowerCase().includes(query) ||
      log.targetId.toLowerCase().includes(query)
    )
  }

  return logs
})

const actionColor = (action: string) => {
  const colors: Record<string, string> = {
    status_change: 'bg-blue-500',
    link_update: 'bg-purple-500',
    resource_add: 'bg-green-500',
    resource_remove: 'bg-red-500',
    description_edit: 'bg-yellow-500'
  }
  return colors[action] || 'bg-gray-500'
}

const showDiff = (log: AuditLog) => {
  if (selectedLog.value?.id === log.id) {
    selectedLog.value = null
  } else {
    selectedLog.value = log
  }
}

const close = () => {
  isOpen.value = false
  emit('close')
}
</script>
