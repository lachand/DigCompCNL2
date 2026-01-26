<template>
  <Modal
    v-model="isOpen"
    title="Import Magique"
    icon="ph-magic-wand"
    size="xl"
    variant="primary"
  >
    <div class="space-y-6">
      <!-- Info -->
      <div class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
        <p class="text-sm text-indigo-800 dark:text-indigo-300">
          <i class="ph ph-sparkle mr-2"></i>
          Collez une URL et l'IA analysera automatiquement la ressource pour identifier les compétences DigComp correspondantes.
        </p>
      </div>

      <!-- Step 1: URL Input -->
      <div v-if="step === 1">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL de la ressource
            </label>
            <input
              v-model="url"
              type="url"
              placeholder="https://..."
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              @keyup.enter="analyze"
            />
          </div>

          <!-- Quick paste buttons -->
          <div class="flex flex-wrap gap-2">
            <button
              @click="pasteFromClipboard"
              class="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
            >
              <i class="ph ph-clipboard"></i>
              Coller
            </button>
          </div>

          <!-- Error display -->
          <div v-if="geminiError" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div class="flex items-start gap-3">
              <i class="ph ph-warning-circle text-xl text-red-500"></i>
              <div>
                <p class="font-medium text-red-800 dark:text-red-300">Erreur d'analyse</p>
                <p class="text-sm text-red-700 dark:text-red-400">{{ geminiError }}</p>
              </div>
            </div>
          </div>

          <button
            @click="analyze"
            :disabled="!url || geminiLoading"
            class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            <i v-if="!geminiLoading" class="ph ph-magnifying-glass"></i>
            <i v-else class="ph ph-spinner animate-spin"></i>
            <span>{{ geminiLoading ? 'Analyse en cours...' : 'Analyser avec l\'IA' }}</span>
          </button>

          <!-- Retry info -->
          <div v-if="retryCount > 0" class="text-center text-sm text-amber-600 dark:text-amber-400">
            <i class="ph ph-arrow-clockwise animate-spin mr-1"></i>
            Tentative {{ retryCount + 1 }}/3...
          </div>
        </div>
      </div>

      <!-- Step 2: Results -->
      <div v-if="step === 2 && analysisResult">
        <!-- Back button -->
        <button
          @click="reset"
          class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4"
        >
          <i class="ph ph-arrow-left"></i>
          Nouvelle analyse
        </button>

        <!-- Resource Info -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-1">{{ analysisResult.title }}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ analysisResult.summary }}</p>
          <div class="flex items-center gap-2">
            <span class="px-2 py-1 text-xs rounded bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
              {{ resourceTypeLabel }}
            </span>
            <a :href="analysisResult.url" target="_blank" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-xs">
              {{ analysisResult.url }}
            </a>
          </div>
        </div>

        <!-- Year Selection -->
        <div class="flex items-center gap-3 mb-4">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Année cible :</label>
          <div class="flex gap-2">
            <button
              v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])"
              :key="year"
              @click="selectedYear = year"
              class="px-4 py-2 rounded-lg transition"
              :class="selectedYear === year
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
            >
              {{ year }}
            </button>
          </div>
        </div>

        <!-- Matching Outcomes -->
        <div class="space-y-3">
          <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <i class="ph ph-target"></i>
            Compétences correspondantes ({{ analysisResult.matches.length }})
          </h4>

          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="match in analysisResult.matches"
              :key="match.outcomeId"
              class="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {{ match.outcomeId }}
                    </span>
                    <span
                      class="px-2 py-0.5 text-xs rounded-full"
                      :class="confidenceClass(match.confidence)"
                    >
                      {{ match.confidence }}%
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ match.reasoning }}</p>
                </div>
                <button
                  @click="addToOutcome(match.outcomeId)"
                  :disabled="addedOutcomes.includes(match.outcomeId)"
                  class="px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1"
                  :class="addedOutcomes.includes(match.outcomeId)
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'"
                >
                  <i :class="addedOutcomes.includes(match.outcomeId) ? 'ph ph-check' : 'ph ph-plus'"></i>
                  {{ addedOutcomes.includes(match.outcomeId) ? 'Ajouté' : 'Ajouter' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Add to all button -->
          <button
            v-if="analysisResult.matches.length > 1"
            @click="addToAllOutcomes"
            :disabled="addedOutcomes.length === analysisResult.matches.length"
            class="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            <i class="ph ph-checks"></i>
            Ajouter à toutes les compétences
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompetencesStore } from '@/stores/competences'
import { useGemini } from '@/composables/useGemini'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'
import type { YearLevel, MagicImportResult } from '@/types'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const competencesStore = useCompetencesStore()
const { loading: geminiLoading, error: geminiError, retryCount, analyzeUrl } = useGemini()
const { success, error: showError } = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const step = ref(1)
const url = ref('')
const selectedYear = ref<YearLevel>('L1')
const analysisResult = ref<MagicImportResult | null>(null)
const addedOutcomes = ref<string[]>([])

// Reset state when modal closes
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    reset()
  }
})

const resourceTypeLabel = computed(() => {
  const labels = {
    video: 'Vidéo',
    document: 'Document',
    file: 'Fichier'
  }
  return labels[analysisResult.value?.suggestedType || 'document']
})

const confidenceClass = (confidence: number) => {
  if (confidence >= 80) return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
  if (confidence >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
  return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
}

const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    if (text.startsWith('http')) {
      url.value = text
    }
  } catch {
    showError('Impossible d\'accéder au presse-papier')
  }
}

const analyze = async () => {
  if (!url.value) return

  if (!authStore.userData?.apiKey) {
    showError('Configurez votre clé API Gemini dans les paramètres')
    return
  }

  const result = await analyzeUrl(
    authStore.userData.apiKey,
    url.value,
    competencesStore.allOutcomes
  )

  if (result) {
    analysisResult.value = result
    step.value = 2
  }
}

const addToOutcome = async (outcomeId: string) => {
  if (!analysisResult.value) return

  try {
    await competencesStore.addResource(outcomeId, selectedYear.value, {
      title: analysisResult.value.title,
      url: analysisResult.value.url,
      type: analysisResult.value.suggestedType
    })
    addedOutcomes.value.push(outcomeId)
    success(`Ressource ajoutée à ${outcomeId} pour ${selectedYear.value}`)
  } catch {
    showError('Erreur lors de l\'ajout')
  }
}

const addToAllOutcomes = async () => {
  if (!analysisResult.value) return

  for (const match of analysisResult.value.matches) {
    if (!addedOutcomes.value.includes(match.outcomeId)) {
      await addToOutcome(match.outcomeId)
    }
  }
}

const reset = () => {
  step.value = 1
  url.value = ''
  analysisResult.value = null
  addedOutcomes.value = []
  geminiError.value = ''
}
</script>
