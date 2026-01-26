<template>
  <Modal
    v-model="isOpen"
    title="Machine à remonter le temps"
    icon="ph-clock-counter-clockwise"
    size="lg"
    variant="primary"
  >
    <div class="space-y-6">
      <!-- Create Snapshot -->
      <div class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <h4 class="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Créer un snapshot</h4>
        <div class="flex gap-2">
          <input
            v-model="newSnapshotName"
            type="text"
            placeholder="Nom du snapshot..."
            class="flex-1 px-3 py-2 border border-indigo-300 dark:border-indigo-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            @click="createSnapshot"
            :disabled="!newSnapshotName.trim()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center gap-2"
          >
            <i class="ph ph-floppy-disk"></i>
            <span>Créer</span>
          </button>
        </div>
      </div>

      <!-- Snapshots List -->
      <div>
        <h4 class="font-semibold text-gray-900 dark:text-white mb-3">
          Snapshots disponibles ({{ competencesStore.snapshots.length }})
        </h4>

        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="snapshot in competencesStore.snapshots"
            :key="snapshot.id"
            class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <i class="ph ph-clock-counter-clockwise text-indigo-600 dark:text-indigo-400"></i>
                  <h5 class="font-semibold text-gray-900 dark:text-white">{{ snapshot.name }}</h5>
                </div>
                <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span class="flex items-center gap-1">
                    <i class="ph ph-user"></i>
                    {{ snapshot.user.split('@')[0] }}
                  </span>
                  <span class="flex items-center gap-1">
                    <i class="ph ph-calendar"></i>
                    {{ formatDate(snapshot.date) }}
                  </span>
                  <span class="flex items-center gap-1">
                    <i class="ph ph-database"></i>
                    {{ snapshot.data.length }} domaines
                  </span>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  @click="previewSnapshot(snapshot)"
                  class="p-2 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition"
                  title="Prévisualiser"
                >
                  <i class="ph ph-eye"></i>
                </button>
                <button
                  @click="restoreSnapshot(snapshot.id!)"
                  class="p-2 hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg transition"
                  title="Restaurer"
                >
                  <i class="ph ph-arrow-counter-clockwise"></i>
                </button>
              </div>
            </div>

            <!-- Preview -->
            <div v-if="previewedSnapshot?.id === snapshot.id" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div v-for="domain in snapshot.data" :key="domain.id" class="p-2 bg-white dark:bg-gray-800 rounded">
                  <p class="font-medium text-gray-900 dark:text-white">{{ domain.name }}</p>
                  <p class="text-gray-600 dark:text-gray-400">{{ domain.competences.length }} compétences</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="competencesStore.snapshots.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            <i class="ph ph-clock-counter-clockwise text-4xl mb-2"></i>
            <p>Aucun snapshot</p>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import { formatDate } from '@/utils/helpers'
import Modal from '@/components/common/Modal.vue'
import type { Snapshot } from '@/types'

const emit = defineEmits<{
  close: []
}>()

const competencesStore = useCompetencesStore()

const isOpen = ref(true)
const newSnapshotName = ref('')
const previewedSnapshot = ref<Snapshot | null>(null)

const createSnapshot = async () => {
  if (!newSnapshotName.value.trim()) return

  await competencesStore.createSnapshot(newSnapshotName.value)
  newSnapshotName.value = ''
}

const previewSnapshot = (snapshot: Snapshot) => {
  if (previewedSnapshot.value?.id === snapshot.id) {
    previewedSnapshot.value = null
  } else {
    previewedSnapshot.value = snapshot
  }
}

const restoreSnapshot = async (snapshotId: string) => {
  if (confirm('Êtes-vous sûr de vouloir restaurer ce snapshot ? Les données actuelles seront écrasées.')) {
    await competencesStore.restoreSnapshot(snapshotId)
    close()
  }
}

const close = () => {
  isOpen.value = false
  emit('close')
}
</script>
