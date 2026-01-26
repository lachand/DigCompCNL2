<template>
  <Modal
    v-model="isOpen"
    title="Resource Hunter"
    icon="ph-magnifying-glass"
    size="xl"
    variant="primary"
  >
    <div class="space-y-6">
      <!-- Info -->
      <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p class="text-sm text-blue-800 dark:text-blue-300">
          <i class="ph ph-magic-wand mr-2"></i>
          L'IA va chercher des ressources pédagogiques pertinentes pour vous
        </p>
      </div>

      <!-- Year Selection -->
      <div class="flex items-center gap-3">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Année :</label>
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

      <!-- Step 1: Generate Search Terms -->
      <div v-if="step === 1">
        <button
          v-if="!geminiError"
          @click="handleGenerateSearchTerms"
          :disabled="geminiLoading"
          class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
        >
          <i v-if="!geminiLoading" class="ph ph-sparkle"></i>
          <i v-else class="ph ph-spinner animate-spin"></i>
          <span>{{ geminiLoading ? 'Génération...' : 'Générer les termes de recherche' }}</span>
        </button>

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
            @click="clearError"
            class="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            <i class="ph ph-arrow-clockwise"></i>
            <span>Réessayer</span>
          </button>
        </div>
      </div>

      <!-- Step 2: Show Search Terms -->
      <div v-if="step === 2 && searchTerms">
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
              <i class="ph ph-youtube-logo text-red-500 mr-2"></i>
              YouTube
            </h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="term in searchTerms.youtube"
                :key="term"
                class="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm"
              >
                {{ term }}
              </span>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
              <i class="ph ph-google-logo text-blue-500 mr-2"></i>
              Google
            </h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="term in searchTerms.google"
                :key="term"
                class="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm"
              >
                {{ term }}
              </span>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
              <i class="ph ph-article text-gray-500 mr-2"></i>
              Wikipedia
            </h4>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="term in searchTerms.wikipedia"
                :key="term"
                class="px-3 py-1 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                {{ term }}
              </span>
            </div>
          </div>

          <button
            @click="searchResources"
            class="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center justify-center gap-2"
          >
            <i class="ph ph-magnifying-glass"></i>
            <span>Lancer la recherche</span>
          </button>
        </div>
      </div>

      <!-- Step 3: Show Results -->
      <div v-if="step === 3">
        <!-- Restart Button -->
        <div class="mb-4">
          <button
            @click="restart"
            class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <i class="ph ph-arrow-clockwise"></i>
            <span>Nouvelle recherche</span>
          </button>
        </div>

        <div class="space-y-4 max-h-96 overflow-y-auto">
          <!-- Videos -->
          <div v-if="results.videos && results.videos.length > 0">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
              <i class="ph ph-video-camera text-red-500 mr-2"></i>
              Vidéos ({{ results.videos.length }})
            </h4>
            <div class="space-y-2">
              <div
                v-for="(video, index) in results.videos"
                :key="index"
                class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-start justify-between gap-3"
              >
                <div class="flex-1">
                  <a :href="video.url" target="_blank" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    {{ video.title }}
                  </a>
                </div>
                <button
                  @click="addResource(video, 'video')"
                  class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition"
                >
                  <i class="ph ph-plus"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Documents -->
          <div v-if="results.docs && results.docs.length > 0">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-2">
              <i class="ph ph-file-text text-blue-500 mr-2"></i>
              Documents ({{ results.docs.length }})
            </h4>
            <div class="space-y-2">
              <div
                v-for="(doc, index) in results.docs"
                :key="index"
                class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-start justify-between gap-3"
              >
                <div class="flex-1">
                  <a :href="doc.url" target="_blank" class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                    {{ doc.title }}
                  </a>
                </div>
                <button
                  @click="addResource(doc, 'document')"
                  class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded transition"
                >
                  <i class="ph ph-plus"></i>
                </button>
              </div>
            </div>
          </div>

          <div v-if="(!results.videos || results.videos.length === 0) && (!results.docs || results.docs.length === 0)" class="text-center py-8 text-gray-500 dark:text-gray-400">
            <i class="ph ph-magnifying-glass-minus text-4xl mb-2"></i>
            <p>Aucune ressource trouvée</p>
          </div>
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
import type { YearLevel, HunterSearchTerms, HunterResult, ResourceType } from '@/types'

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
const results = ref<HunterResult>({})

// Reset state when modal closes
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    step.value = 1
    searchTerms.value = null
    results.value = {}
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

const searchResources = () => {
  // Simulate search results (in real app, would call APIs)
  results.value = {
    videos: searchTerms.value?.youtube.map((term) => ({
      title: `Vidéo tutoriel : ${term}`,
      url: `https://youtube.com/search?q=${encodeURIComponent(term)}`
    })) || [],
    docs: searchTerms.value?.google.map((term) => ({
      title: `Guide : ${term}`,
      url: `https://google.com/search?q=${encodeURIComponent(term)}`
    })) || []
  }
  step.value = 3
}

const addResource = async (resource: { title: string; url: string }, type: ResourceType) => {
  await competencesStore.addResource(props.outcome.id, selectedYear.value, {
    title: resource.title,
    url: resource.url,
    type
  })
  success(`Ressource ajoutée pour ${selectedYear.value}`)
}

const restart = () => {
  step.value = 1
  searchTerms.value = null
  results.value = {}
  geminiError.value = ''
}

const clearError = () => {
  geminiError.value = ''
}
</script>
