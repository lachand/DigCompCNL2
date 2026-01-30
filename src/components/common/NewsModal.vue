<template>
  <Modal
    v-model="isOpen"
    title="Nouveautés"
    icon="ph-sparkle"
    icon-bg-class="bg-blue-100 dark:bg-blue-900"
    icon-color-class="text-blue-600 dark:text-blue-400"
    size="lg"
  >
    <div v-if="currentNews" class="space-y-4">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ formatDate(currentNews.date) }}
      </div>
      <div class="prose dark:prose-invert max-w-none">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {{ currentNews.title }}
        </h3>
        <div v-html="currentNewsContent" class="text-gray-700 dark:text-gray-300"></div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-between">
        <button
          v-if="hasMultipleNews"
          @click="previousNews"
          class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          Précédent
        </button>
        <div class="flex gap-2 ml-auto">
          <button
            @click="markAsRead"
            class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
          >
            Marquer comme lu
          </button>
          <button
            v-if="hasNextNews"
            @click="nextNews"
            class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
          >
            Suivant
          </button>
          <button
            v-else
            @click="closeModal"
            class="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { useNewsStore } from '@/stores/news'
import { useUserPreferences } from '@/composables/useUserPreferences'

const newsStore = useNewsStore()
const { view } = useUserPreferences()

const isOpen = ref(false)
const currentIndex = ref(0)

const unreadNews = computed(() => newsStore.unreadNews)
const currentNews = computed(() => unreadNews.value[currentIndex.value])
const hasMultipleNews = computed(() => unreadNews.value.length > 1)
const hasNextNews = computed(() => currentIndex.value < unreadNews.value.length - 1)

// Vérifier qu'il y a des news valides disponibles
const hasValidNews = computed(() => {
  return unreadNews.value.some(news => 
    news && news.title && news.content && news.title.trim() && news.content.trim()
  )
})

// Contenu avec l'icône appropriée selon le mode
const currentNewsContent = computed(() => {
  if (!currentNews.value) return ''
  
  const iconClass = view.value.firebaseMode === 'prod' ? 'ph-database' : 'ph-flask'
  const iconHtml = `<i class="ph ${iconClass} text-xl mr-2"></i>`
  
  return currentNews.value.content.replace('{ICON}', iconHtml)
})

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const nextNews = () => {
  if (hasNextNews.value) {
    currentIndex.value++
  }
}

const previousNews = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const markAsRead = async () => {
  if (currentNews.value) {
    await newsStore.markNewsAsRead(currentNews.value.id)
    if (hasNextNews.value) {
      nextNews()
    } else {
      closeModal()
    }
  }
}

const closeModal = () => {
  isOpen.value = false
  currentIndex.value = 0
}

// Ouvrir automatiquement si des nouveautés non lues et valides
watch(hasValidNews, (hasValid) => {
  if (hasValid && !isOpen.value) {
    isOpen.value = true
  } else if (!hasValid && isOpen.value) {
    // Fermer la modale si plus aucune news valide
    closeModal()
  }
}, { immediate: true })

// Exposer pour usage externe si nécessaire
defineExpose({
  open: () => { isOpen.value = true },
  close: closeModal
})
</script>