<template>
  <Modal
    v-model="isOpen"
    title="Assistant IA"
    icon="ph-magic-wand"
    size="xl"
    variant="primary"
  >
    <div class="space-y-6">
      <!-- Type Selection -->
      <div v-if="!selectedType">
        <div class="grid grid-cols-2 gap-4">
          <button
            v-for="type in generationTypes"
            :key="type.value"
            @click="selectType(type.value)"
            class="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 transition group"
          >
            <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
              <i class="ph text-2xl text-indigo-600 dark:text-indigo-400" :class="type.icon"></i>
            </div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">{{ type.label }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ type.description }}</p>
          </button>
        </div>

        <!-- History section -->
        <div v-if="outcomeHistory.length > 0" class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <i class="ph ph-clock-counter-clockwise"></i>
            Générations récentes pour ce LO
          </h4>
          <div class="space-y-2 max-h-32 overflow-y-auto">
            <button
              v-for="entry in outcomeHistory"
              :key="entry.id"
              @click="loadFromHistory(entry)"
              class="w-full p-2 text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-indigo-600 dark:text-indigo-400">{{ typeLabels[entry.type] }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(entry.timestamp) }}</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Generation -->
      <div v-else>
        <!-- Back Button -->
        <button
          @click="reset"
          class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition mb-4"
        >
          <i class="ph ph-arrow-left"></i>
          <span>Retour</span>
        </button>

        <!-- Selected Outcome Info -->
        <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
          <h4 class="font-semibold text-gray-900 dark:text-white mb-1">{{ outcome.id }}</h4>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ outcome.description }}</p>
          <span class="inline-block mt-2 px-2 py-1 text-xs rounded" :class="levelClass">
            {{ translateLevel(outcome.level) }}
          </span>
        </div>

        <!-- Model Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Modèle IA
          </label>
          <select
            v-model="selectedModel"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="model in AI_MODELS" :key="model.value" :value="model.value">
              {{ model.label }} - {{ model.description }}
            </option>
          </select>
        </div>

        <!-- Streaming toggle -->
        <div class="mb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="useStreaming"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Affichage en temps réel (streaming)</span>
          </label>
        </div>

        <!-- Generate Button -->
        <button
          v-if="!geminiResult && !geminiError && !isStreaming"
          @click="generate"
          :disabled="geminiLoading"
          class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
        >
          <i v-if="!geminiLoading" class="ph ph-sparkle"></i>
          <i v-else class="ph ph-spinner animate-spin"></i>
          <span>{{ geminiLoading ? 'Génération...' : 'Générer avec IA' }}</span>
        </button>

        <!-- Retry indicator -->
        <div v-if="retryCount > 0" class="text-center text-sm text-amber-600 dark:text-amber-400 mt-2">
          <i class="ph ph-arrow-clockwise animate-spin mr-1"></i>
          Tentative {{ retryCount + 1 }}/3 - Modèle surchargé, réessai automatique...
        </div>

        <!-- Streaming Display -->
        <div v-if="isStreaming || streamingText" class="space-y-4">
          <div class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto prose dark:prose-invert max-w-none">
            <div v-html="renderedStreamingMarkdown"></div>
            <span v-if="isStreaming" class="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1"></span>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="geminiError" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div class="flex items-start gap-3">
            <i class="ph ph-warning-circle text-2xl text-red-500 dark:text-red-400 flex-shrink-0"></i>
            <div class="flex-1">
              <h4 class="font-semibold text-red-800 dark:text-red-300 mb-1">Erreur de génération</h4>
              <p class="text-sm text-red-700 dark:text-red-400">{{ geminiError }}</p>
            </div>
          </div>
          <button
            @click="reset"
            class="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            <i class="ph ph-arrow-clockwise"></i>
            <span>Réessayer</span>
          </button>
        </div>

        <!-- Result -->
        <div v-if="geminiResult && !isStreaming" class="space-y-4">
          <div class="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto prose dark:prose-invert max-w-none">
            <div v-html="renderedMarkdown"></div>
          </div>

          <div class="flex gap-2 flex-wrap">
            <button
              @click="copyToClipboard"
              class="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition flex items-center justify-center gap-2"
            >
              <i class="ph ph-copy"></i>
              <span>Copier</span>
            </button>
            <button
              @click="downloadMarkdown"
              class="flex-1 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition flex items-center justify-center gap-2"
            >
              <i class="ph ph-download-simple"></i>
              <span>Télécharger</span>
            </button>
            <!-- GIFT Export for QCM -->
            <button
              v-if="selectedType === 'qcm'"
              @click="showGiftExport = true"
              class="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition flex items-center justify-center gap-2"
            >
              <i class="ph ph-graduation-cap"></i>
              <span>Moodle (GIFT)</span>
            </button>
            <button
              @click="reset"
              class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2"
            >
              <i class="ph ph-arrow-clockwise"></i>
              <span>Régénérer</span>
            </button>
          </div>

          <!-- GIFT Export Modal -->
          <GiftExportModal
            v-if="selectedType === 'qcm'"
            v-model="showGiftExport"
            :content="geminiResult"
            :outcome-id="outcome.id"
          />
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGemini } from '@/composables/useGemini'
import { useAICache } from '@/composables/useAICache'
import { useMarkdown } from '@/composables/useMarkdown'
import { useToast } from '@/composables/useToast'
import { copyToClipboard as copyText, downloadFile, formatDate, translateLevel } from '@/utils/helpers'
import Modal from '@/components/common/Modal.vue'
import GiftExportModal from '@/components/ai/GiftExportModal.vue'
import { AI_MODELS } from '@/types'
import type { LearningOutcome, AIGenerationType, AIHistoryEntry } from '@/types'

interface Props {
  outcome: LearningOutcome
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const {
  loading: geminiLoading,
  result: geminiResult,
  error: geminiError,
  streamingText,
  isStreaming,
  retryCount,
  generateContent
} = useGemini()
const { historyEntries, saveToHistory, getHistoryForOutcome } = useAICache()
const markdown = useMarkdown()
const { success, error: showError } = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedType = ref<AIGenerationType | null>(null)
const selectedModel = ref(authStore.userData?.aiModel || 'gemini-3-flash-preview')
const useStreaming = ref(true)
const showGiftExport = ref(false)

// Watch for model preference changes
watch(() => authStore.userData?.aiModel, (newModel) => {
  if (newModel) selectedModel.value = newModel
})

// Reset state when modal closes
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    selectedType.value = null
    geminiResult.value = ''
    geminiError.value = ''
    streamingText.value = ''
    showGiftExport.value = false
  }
})

const generationTypes = [
  { value: 'course' as AIGenerationType, label: 'Plan de cours', icon: 'ph-book-open', description: 'Générer un cours structuré' },
  { value: 'td' as AIGenerationType, label: 'TD / Exercices', icon: 'ph-pencil', description: 'Créer des exercices pratiques' },
  { value: 'qcm' as AIGenerationType, label: 'QCM', icon: 'ph-check-square', description: 'Générer un questionnaire' },
  { value: 'practice' as AIGenerationType, label: 'Mise en situation', icon: 'ph-briefcase', description: 'Cas pratique professionnel' }
]

const typeLabels: Record<AIGenerationType, string> = {
  course: 'Plan de cours',
  td: 'TD / Exercices',
  qcm: 'QCM',
  practice: 'Mise en situation'
}

const outcomeHistory = computed(() => {
  return historyEntries.value
    .filter(e => e.outcomeId === props.outcome.id)
    .slice(0, 5)
})

const levelClass = computed(() => {
  const classes = {
    'Basic': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'Advanced': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'Highly advanced': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[props.outcome.level]
})

const renderedMarkdown = computed(() => {
  return markdown.render(geminiResult.value)
})

const renderedStreamingMarkdown = computed(() => {
  return markdown.render(streamingText.value || geminiResult.value)
})

const selectType = (type: AIGenerationType) => {
  console.log('🔘 Type selected:', type)
  selectedType.value = type
}

const loadFromHistory = (entry: AIHistoryEntry) => {
  selectedType.value = entry.type
  geminiResult.value = entry.content
}

const generate = async () => {
  console.log('🎯 Generate clicked!')
  console.log('API Key:', authStore.userData?.apiKey ? 'Configurée ✓' : 'Manquante ✗')
  console.log('Selected type:', selectedType.value)
  console.log('Selected model:', selectedModel.value)
  console.log('Outcome:', props.outcome)

  if (!authStore.userData?.apiKey) {
    showError('Configurez votre clé API Gemini dans les paramètres')
    return
  }

  if (!selectedType.value) return

  try {
    console.log('📡 Calling Gemini API...')
    await generateContent(
      authStore.userData.apiKey,
      selectedModel.value,
      props.outcome,
      selectedType.value,
      useStreaming.value,
      (attempt, delay) => {
        console.log(`⏳ Retry attempt ${attempt}, waiting ${delay}ms...`)
      }
    )
    console.log('✅ Generation complete!')

    // Save to history
    await saveToHistory(
      props.outcome.id,
      props.outcome.description,
      selectedType.value,
      selectedModel.value,
      geminiResult.value
    )
  } catch (err) {
    console.error('❌ Error:', err)
    showError('Erreur lors de la génération: ' + (err instanceof Error ? err.message : 'Erreur inconnue'))
  }
}

const copyToClipboard = async () => {
  await copyText(geminiResult.value)
  success('Copié dans le presse-papier')
}

const downloadMarkdown = () => {
  const filename = `${props.outcome.id}_${selectedType.value}.md`
  downloadFile(geminiResult.value, filename, 'text/markdown')
  success('Fichier téléchargé')
}

const reset = () => {
  selectedType.value = null
  geminiResult.value = ''
  geminiError.value = ''
  streamingText.value = ''
}
</script>
