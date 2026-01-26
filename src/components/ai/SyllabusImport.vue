<template>
  <Modal
    v-model="isOpen"
    title="Import magique de syllabus"
    icon="ph-file-arrow-up"
    size="lg"
    variant="primary"
  >
    <div class="space-y-6">
      <!-- Info -->
      <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <i class="ph ph-magic-wand mr-2"></i>
          L'IA va analyser votre syllabus et identifier automatiquement les compétences DigComp correspondantes
        </p>
      </div>

      <!-- Step 1: Upload -->
      <div v-if="step === 1">
        <div
          @drop.prevent="handleDrop"
          @dragover.prevent
          class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-indigo-500 dark:hover:border-indigo-500 transition"
        >
          <i class="ph ph-upload-simple text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
          <p class="text-gray-600 dark:text-gray-400 mb-2">Glissez-déposez votre syllabus ici</p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">ou</p>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            accept=".pdf,.doc,.docx,.txt"
            @change="handleFileSelect"
          />
          <button
            @click="fileInput?.click()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            Choisir un fichier
          </button>
        </div>

        <div v-if="syllabusText" class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contenu du syllabus
          </label>
          <textarea
            v-model="syllabusText"
            rows="8"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          ></textarea>
          <button
            @click="analyzeWithAI"
            :disabled="gemini.loading"
            class="mt-3 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            <i v-if="!gemini.loading" class="ph ph-sparkle"></i>
            <i v-else class="ph ph-spinner animate-spin"></i>
            <span>{{ gemini.loading ? 'Analyse en cours...' : 'Analyser avec IA' }}</span>
          </button>
        </div>
      </div>

      <!-- Step 2: Results -->
      <div v-if="step === 2 && matches.length > 0">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-4">
          {{ matches.length }} compétences identifiées
        </h4>

        <div class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="(match, index) in matches"
            :key="index"
            class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex-1">
                <h5 class="font-semibold text-gray-900 dark:text-white">{{ match.outcome?.id }}</h5>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ match.outcome?.description }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded">
                  {{ match.confidence }}%
                </span>
                <input
                  v-model="match.selected"
                  type="checkbox"
                  class="w-4 h-4 text-indigo-600 rounded"
                />
              </div>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400 italic">{{ match.reasoning }}</p>
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Année
            </label>
            <select
              v-model="targetYear"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="L1">Licence 1</option>
              <option value="L2">Licence 2</option>
              <option value="L3">Licence 3</option>
            </select>
          </div>

          <button
            @click="applyMatches"
            :disabled="!hasSelectedMatches"
            class="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            <i class="ph ph-check-circle"></i>
            <span>Appliquer les {{ selectedMatchesCount }} compétences sélectionnées</span>
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompetencesStore } from '@/stores/competences'
import { useGemini } from '@/composables/useGemini'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'
import type { YearLevel, LearningOutcome } from '@/types'

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const competencesStore = useCompetencesStore()
const gemini = useGemini()
const { success, error: showError } = useToast()

const isOpen = ref(true)
const step = ref(1)
const fileInput = ref<HTMLInputElement>()
const syllabusText = ref('')
const targetYear = ref<YearLevel>('L1')
const matches = ref<Array<{
  outcomeId: string
  outcome?: LearningOutcome
  confidence: number
  reasoning: string
  selected: boolean
}>>([])

const hasSelectedMatches = computed(() => matches.value.some(m => m.selected))
const selectedMatchesCount = computed(() => matches.value.filter(m => m.selected).length)

const handleFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    readFile(file)
  }
}

const handleDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    readFile(file)
  }
}

const readFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    syllabusText.value = e.target?.result as string
  }
  reader.readAsText(file)
}

const analyzeWithAI = async () => {
  if (!authStore.userData?.apiKey) {
    showError('Configurez votre clé API Gemini dans les paramètres')
    return
  }

  const result = await gemini.analyzeSyllabus(
    authStore.userData.apiKey,
    syllabusText.value,
    competencesStore.allOutcomes
  )

  if (result?.matches) {
    matches.value = result.matches.map((m: any) => ({
      ...m,
      outcome: competencesStore.getOutcomeById(m.outcomeId),
      selected: m.confidence >= 70
    }))
    step.value = 2
  }
}

const applyMatches = async () => {
  for (const match of matches.value.filter(m => m.selected)) {
    await competencesStore.updateStatus(match.outcomeId, targetYear.value, 'draft')
  }
  success(`${selectedMatchesCount.value} compétences mises à jour`)
  close()
}

const close = () => {
  isOpen.value = false
  emit('close')
}
</script>
