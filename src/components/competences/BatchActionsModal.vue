<template>
  <Modal
    :model-value="true"
    title="Actions groupées"
    icon="ph-pencil-simple"
    size="lg"
    @update:model-value="$emit('close')"
  >
    <div class="space-y-6">
      <!-- Selection summary -->
      <div class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <p class="text-sm text-indigo-800 dark:text-indigo-300">
          <i class="ph ph-selection mr-2"></i>
          {{ outcomeIds.length }} Learning Outcome(s) sélectionné(s)
        </p>
      </div>

      <!-- Action Selection -->
      <div class="space-y-4">
        <h4 class="font-medium text-gray-900 dark:text-white">Choisir une action</h4>

        <!-- Status Change -->
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <label class="flex items-center gap-2">
              <input
                type="radio"
                v-model="selectedAction"
                value="status"
                class="w-4 h-4 text-indigo-600"
              />
              <span class="font-medium text-gray-900 dark:text-white">Changer le statut</span>
            </label>
          </div>

          <div v-if="selectedAction === 'status'" class="grid grid-cols-2 gap-4 mt-3">
            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Année(s)</label>
              <div class="flex gap-2">
                <button
                  v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])"
                  :key="year"
                  @click="toggleYear(year)"
                  class="px-3 py-1.5 rounded text-sm transition"
                  :class="targetYears.includes(year) ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'"
                >
                  {{ year }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Nouveau statut</label>
              <select
                v-model="targetStatus"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="none">Non traité</option>
                <option value="draft">Brouillon</option>
                <option value="review">En révision</option>
                <option value="validated">Validé</option>
                <option value="obsolete">Obsolète</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Add Tag -->
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <label class="flex items-center gap-2">
              <input
                type="radio"
                v-model="selectedAction"
                value="tag"
                class="w-4 h-4 text-indigo-600"
              />
              <span class="font-medium text-gray-900 dark:text-white">Ajouter un tag</span>
            </label>
          </div>

          <div v-if="selectedAction === 'tag'" class="mt-3">
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="tag in availableTags"
                :key="tag"
                @click="targetTag = tag"
                class="px-3 py-1.5 rounded text-sm transition"
                :class="targetTag === tag ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'"
              >
                {{ tag }}
              </button>
            </div>
            <input
              v-model="customTag"
              type="text"
              placeholder="Ou créer un nouveau tag..."
              class="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <!-- Assign -->
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <label class="flex items-center gap-2">
              <input
                type="radio"
                v-model="selectedAction"
                value="assign"
                class="w-4 h-4 text-indigo-600"
              />
              <span class="font-medium text-gray-900 dark:text-white">Assigner à</span>
            </label>
          </div>

          <div v-if="selectedAction === 'assign'" class="mt-3">
            <select
              v-model="targetAssignee"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Sélectionner un utilisateur...</option>
              <option v-for="user in authStore.users" :key="user.email" :value="user.email">
                {{ user.email }}
              </option>
            </select>
          </div>
        </div>

        <!-- Duplicate Content -->
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <label class="flex items-center gap-2">
              <input
                type="radio"
                v-model="selectedAction"
                value="duplicate"
                class="w-4 h-4 text-indigo-600"
              />
              <span class="font-medium text-gray-900 dark:text-white">Dupliquer le contenu</span>
            </label>
          </div>

          <div v-if="selectedAction === 'duplicate'" class="mt-3">
            <div class="flex items-center gap-4">
              <div>
                <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">De</label>
                <select
                  v-model="duplicateFrom"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="L3">L3</option>
                </select>
              </div>

              <i class="ph ph-arrow-right text-xl text-gray-400 mt-5"></i>

              <div>
                <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Vers</label>
                <select
                  v-model="duplicateTo"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="L3">L3</option>
                </select>
              </div>
            </div>

            <div class="mt-3 space-y-2">
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="duplicateOptions.status"
                  class="w-4 h-4 rounded text-indigo-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Statut</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="duplicateOptions.courseLink"
                  class="w-4 h-4 rounded text-indigo-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Lien de cours</span>
              </label>
              <label class="flex items-center gap-2">
                <input
                  type="checkbox"
                  v-model="duplicateOptions.resources"
                  class="w-4 h-4 rounded text-indigo-600"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">Ressources</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="$emit('close')"
          class="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          Annuler
        </button>
        <button
          @click="executeAction"
          :disabled="!canExecute || isExecuting"
          class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
        >
          <i v-if="isExecuting" class="ph ph-spinner animate-spin"></i>
          <span>{{ isExecuting ? 'Application...' : 'Appliquer' }}</span>
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'
import type { YearLevel, StatusType } from '@/types'

interface Props {
  outcomeIds: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'close': []
  'done': []
}>()

const competencesStore = useCompetencesStore()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const selectedAction = ref<'status' | 'tag' | 'assign' | 'duplicate'>('status')
const isExecuting = ref(false)

// Status change
const targetYears = ref<YearLevel[]>(['L1', 'L2', 'L3'])
const targetStatus = ref<StatusType>('draft')

// Tag
const targetTag = ref('')
const customTag = ref('')
const availableTags = computed(() => competencesStore.digCompData.tags || [])

// Assign
const targetAssignee = ref('')

// Duplicate
const duplicateFrom = ref<YearLevel>('L1')
const duplicateTo = ref<YearLevel>('L2')
const duplicateOptions = ref({
  status: true,
  courseLink: true,
  resources: true
})

const toggleYear = (year: YearLevel) => {
  const index = targetYears.value.indexOf(year)
  if (index === -1) {
    targetYears.value.push(year)
  } else if (targetYears.value.length > 1) {
    targetYears.value.splice(index, 1)
  }
}

const canExecute = computed(() => {
  switch (selectedAction.value) {
    case 'status':
      return targetYears.value.length > 0
    case 'tag':
      return targetTag.value || customTag.value
    case 'assign':
      return !!targetAssignee.value
    case 'duplicate':
      return duplicateFrom.value !== duplicateTo.value &&
        (duplicateOptions.value.status || duplicateOptions.value.courseLink || duplicateOptions.value.resources)
    default:
      return false
  }
})

const executeAction = async () => {
  isExecuting.value = true

  try {
    let count = 0

    for (const outcomeId of props.outcomeIds) {
      const outcome = competencesStore.getOutcomeById(outcomeId)
      if (!outcome) continue

      switch (selectedAction.value) {
        case 'status':
          for (const year of targetYears.value) {
            await competencesStore.updateStatus(outcomeId, year, targetStatus.value)
          }
          count++
          break

        case 'tag':
          const tag = customTag.value || targetTag.value
          await competencesStore.toggleTag(outcomeId, tag)
          count++
          break

        case 'assign':
          await competencesStore.toggleAssignee(outcomeId, targetAssignee.value)
          count++
          break

        case 'duplicate':
          const sourceMapping = outcome.mappings[duplicateFrom.value]
          const targetMapping = outcome.mappings[duplicateTo.value]

          if (duplicateOptions.value.status) {
            await competencesStore.updateStatus(outcomeId, duplicateTo.value, sourceMapping.status)
          }
          if (duplicateOptions.value.courseLink && sourceMapping.courseLink) {
            await competencesStore.updateCourseLink(outcomeId, duplicateTo.value, sourceMapping.courseLink)
          }
          if (duplicateOptions.value.resources && sourceMapping.resources) {
            for (const resource of sourceMapping.resources) {
              await competencesStore.addResource(outcomeId, duplicateTo.value, { ...resource })
            }
          }
          count++
          break
      }
    }

    success(`Action appliquée à ${count} LO(s)`)
    emit('done')
  } catch (err) {
    showError('Erreur lors de l\'application des actions')
    console.error(err)
  } finally {
    isExecuting.value = false
  }
}
</script>
