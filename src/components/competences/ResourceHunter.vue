<template>
  <Modal
    v-model="isOpen"
    title="Resource Hunter"
    icon="ph-magnifying-glass"
    size="xl"
    variant="primary"
  >
    <div class="space-y-6">
      <!-- LO Info -->
      <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <div class="flex items-start gap-3">
          <span class="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold rounded">
            {{ outcome.id }}
          </span>
          <p class="text-sm text-gray-700 dark:text-gray-300 flex-1">{{ outcome.description }}</p>
        </div>
      </div>

      <!-- Year Selection -->
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Ajouter pour :</label>
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

      <!-- Quick Search Links (always visible) -->
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <i class="ph ph-link text-indigo-500"></i>
          Recherche rapide
        </h4>
        <div class="grid grid-cols-3 gap-3">
          <a
            :href="youtubeSearchUrl"
            target="_blank"
            class="flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg transition"
          >
            <i class="ph ph-youtube-logo text-xl"></i>
            <span class="text-sm font-medium">YouTube</span>
          </a>
          <a
            :href="googleSearchUrl"
            target="_blank"
            class="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg transition"
          >
            <i class="ph ph-google-logo text-xl"></i>
            <span class="text-sm font-medium">Google</span>
          </a>
          <a
            :href="scholarSearchUrl"
            target="_blank"
            class="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg transition"
          >
            <i class="ph ph-graduation-cap text-xl"></i>
            <span class="text-sm font-medium">Scholar</span>
          </a>
        </div>
      </div>

      <!-- Manual Resource Add -->
      <div class="space-y-3">
        <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <i class="ph ph-plus-circle text-green-500"></i>
          Ajouter une ressource manuellement
        </h4>
        <div class="flex gap-2">
          <input
            v-model="manualUrl"
            type="url"
            placeholder="https://..."
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <input
            v-model="manualTitle"
            type="text"
            placeholder="Titre (optionnel)"
            class="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
          <button
            @click="addManualResource"
            :disabled="!manualUrl"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition"
          >
            <i class="ph ph-plus"></i>
          </button>
        </div>
      </div>

      <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <!-- AI-powered search (if API key available) -->
        <div v-if="hasApiKey">
          <h4 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <i class="ph ph-sparkle text-yellow-500"></i>
            Suggestions IA
          </h4>

          <!-- Step 1: Generate Search Terms -->
          <div v-if="step === 1">
            <button
              v-if="!geminiError"
              @click="handleGenerateSearchTerms"
              :disabled="geminiLoading"
              class="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition flex items-center justify-center gap-2"
            >
              <i v-if="!geminiLoading" class="ph ph-magic-wand"></i>
              <i v-else class="ph ph-spinner animate-spin"></i>
              <span>{{ geminiLoading ? 'Génération...' : 'Générer des suggestions' }}</span>
            </button>

            <div v-if="geminiError" class="mt-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-700 dark:text-red-400">{{ geminiError }}</p>
              <button @click="clearError" class="mt-2 text-sm text-red-600 hover:underline">
                Réessayer
              </button>
            </div>
          </div>

          <!-- Step 2: Show AI Suggestions -->
          <div v-if="step === 2 && searchTerms" class="space-y-4">
            <button
              @click="restart"
              class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <i class="ph ph-arrow-left mr-1"></i>
              Retour
            </button>

            <!-- YouTube suggestions -->
            <div>
              <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <i class="ph ph-youtube-logo text-red-500 mr-1"></i>
                Vidéos suggérées
              </h5>
              <div class="space-y-2">
                <div
                  v-for="term in searchTerms.youtube"
                  :key="term"
                  class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <a
                    :href="`https://youtube.com/results?search_query=${encodeURIComponent(term)}`"
                    target="_blank"
                    class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex-1"
                  >
                    {{ term }}
                  </a>
                  <button
                    @click="addSuggestedResource(term, 'youtube')"
                    class="ml-2 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded"
                  >
                    <i class="ph ph-plus"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Google suggestions -->
            <div>
              <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <i class="ph ph-google-logo text-blue-500 mr-1"></i>
                Documents suggérés
              </h5>
              <div class="space-y-2">
                <div
                  v-for="term in searchTerms.google"
                  :key="term"
                  class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <a
                    :href="`https://google.com/search?q=${encodeURIComponent(term)}`"
                    target="_blank"
                    class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex-1"
                  >
                    {{ term }}
                  </a>
                  <button
                    @click="addSuggestedResource(term, 'google')"
                    class="ml-2 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded"
                  >
                    <i class="ph ph-plus"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Wikipedia suggestions -->
            <div v-if="searchTerms.wikipedia?.length">
              <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <i class="ph ph-article text-gray-500 mr-1"></i>
                Articles Wikipedia
              </h5>
              <div class="space-y-2">
                <div
                  v-for="term in searchTerms.wikipedia"
                  :key="term"
                  class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                >
                  <a
                    :href="`https://fr.wikipedia.org/wiki/${encodeURIComponent(term.replace(/ /g, '_'))}`"
                    target="_blank"
                    class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex-1"
                  >
                    {{ term }}
                  </a>
                  <button
                    @click="addSuggestedResource(term, 'wikipedia')"
                    class="ml-2 px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded"
                  >
                    <i class="ph ph-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No API key message -->
        <div v-else class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p class="text-sm text-yellow-800 dark:text-yellow-300">
            <i class="ph ph-info mr-2"></i>
            Configurez une clé API Gemini dans vos paramètres utilisateur pour des suggestions personnalisées par l'IA.
          </p>
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
import type { YearLevel, HunterSearchTerms, ResourceType } from '@/types'

interface Props {
  outcome: any
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const competencesStore = useCompetencesStore()
const { loading: geminiLoading, error: geminiError, generateSearchTerms: geminiGenerateSearchTerms } = useGemini()
const { success, error: showError } = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const step = ref(1)
const selectedYear = ref<YearLevel>('L1')
const searchTerms = ref<HunterSearchTerms | null>(null)
const manualUrl = ref('')
const manualTitle = ref('')

// Check if API key is available
const hasApiKey = computed(() => !!authStore.userData?.apiKey)

// Generate search query from outcome
const searchQuery = computed(() => {
  if (!props.outcome) return ''
  // Extract key terms from description
  const desc = props.outcome.description || ''
  // Remove common words and create a search query
  return desc.substring(0, 100)
})

// Search URLs
const youtubeSearchUrl = computed(() =>
  `https://youtube.com/results?search_query=${encodeURIComponent(searchQuery.value + ' tutoriel')}`
)

const googleSearchUrl = computed(() =>
  `https://google.com/search?q=${encodeURIComponent(searchQuery.value + ' cours PDF')}`
)

const scholarSearchUrl = computed(() =>
  `https://scholar.google.com/scholar?q=${encodeURIComponent(searchQuery.value)}`
)

// Reset state when modal closes
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    step.value = 1
    searchTerms.value = null
    manualUrl.value = ''
    manualTitle.value = ''
    geminiError.value = ''
  }
})

const handleGenerateSearchTerms = async () => {
  if (!authStore.userData?.apiKey) {
    showError('Configurez votre clé API Gemini dans les paramètres')
    return
  }

  if (!props.outcome) return

  const terms = await geminiGenerateSearchTerms(authStore.userData.apiKey, props.outcome)
  if (terms) {
    searchTerms.value = terms
    step.value = 2
  }
}

const addManualResource = async () => {
  if (!manualUrl.value) return

  const title = manualTitle.value || new URL(manualUrl.value).hostname
  const type: ResourceType = manualUrl.value.includes('youtube') || manualUrl.value.includes('youtu.be')
    ? 'video'
    : 'document'

  await competencesStore.addResource(props.outcome.id, selectedYear.value, {
    title,
    url: manualUrl.value,
    type
  })

  success(`Ressource ajoutée pour ${selectedYear.value}`)
  manualUrl.value = ''
  manualTitle.value = ''
}

const addSuggestedResource = async (term: string, source: 'youtube' | 'google' | 'wikipedia') => {
  let url: string
  let type: ResourceType
  let title: string

  switch (source) {
    case 'youtube':
      url = `https://youtube.com/results?search_query=${encodeURIComponent(term)}`
      type = 'video'
      title = `Vidéo: ${term}`
      break
    case 'google':
      url = `https://google.com/search?q=${encodeURIComponent(term)}`
      type = 'document'
      title = `Document: ${term}`
      break
    case 'wikipedia':
      url = `https://fr.wikipedia.org/wiki/${encodeURIComponent(term.replace(/ /g, '_'))}`
      type = 'document'
      title = `Wikipedia: ${term}`
      break
  }

  await competencesStore.addResource(props.outcome.id, selectedYear.value, {
    title,
    url,
    type
  })

  success(`Ressource ajoutée pour ${selectedYear.value}`)
}

const restart = () => {
  step.value = 1
  searchTerms.value = null
  geminiError.value = ''
}

const clearError = () => {
  geminiError.value = ''
}
</script>
