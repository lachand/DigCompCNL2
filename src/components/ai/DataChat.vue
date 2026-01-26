<template>
  <Modal
    v-model="isOpen"
    title="Chat avec les données"
    icon="ph-chat-circle-dots"
    size="lg"
    variant="primary"
  >
    <div class="flex flex-col h-[500px]">
      <!-- Messages -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto space-y-4 mb-4">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="flex gap-3"
          :class="msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            :class="msg.role === 'user' ? 'bg-indigo-600' : 'bg-purple-600'"
          >
            <i class="ph text-white" :class="msg.role === 'user' ? 'ph-user' : 'ph-robot'"></i>
          </div>
          <div
            class="max-w-[80%] rounded-lg px-4 py-2"
            :class="msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'"
          >
            <div v-if="msg.role === 'assistant'" class="prose dark:prose-invert max-w-none text-sm" v-html="markdown.render(msg.content)"></div>
            <p v-else class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="gemini.loading" class="flex gap-3">
          <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
            <i class="ph ph-robot text-white"></i>
          </div>
          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
            <div class="flex gap-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="messages.length === 0" class="text-center py-12">
          <i class="ph ph-chat-circle-dots text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
          <p class="text-gray-600 dark:text-gray-400 mb-4">Posez des questions sur vos données DigComp</p>
          <div class="space-y-2">
            <button
              v-for="example in exampleQuestions"
              :key="example"
              @click="sendMessage(example)"
              class="block w-full px-4 py-2 text-sm text-left bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
            >
              {{ example }}
            </button>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="flex gap-2">
        <input
          v-model="question"
          @keyup.enter="sendMessage()"
          placeholder="Posez votre question..."
          class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          @click="sendMessage()"
          :disabled="!question.trim() || gemini.loading"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition"
        >
          <i class="ph ph-paper-plane-right"></i>
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompetencesStore } from '@/stores/competences'
import { useGemini } from '@/composables/useGemini'
import { useMarkdown } from '@/composables/useMarkdown'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/common/Modal.vue'

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const competencesStore = useCompetencesStore()
const gemini = useGemini()
const markdown = useMarkdown()
const { error: showError } = useToast()

const isOpen = ref(true)
const question = ref('')
const messages = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([])
const messagesContainer = ref<HTMLDivElement>()

const exampleQuestions = [
  'Combien de compétences sont validées en L1 ?',
  'Quelles compétences manquent de ressources ?',
  'Donne-moi un résumé de la couverture par domaine',
  'Quels sont les Learning Outcomes de niveau Advanced ?'
]

const sendMessage = async (text?: string) => {
  const messageText = text || question.value.trim()
  if (!messageText) return

  if (!authStore.userData?.apiKey) {
    showError('Configurez votre clé API Gemini dans les paramètres')
    return
  }

  messages.value.push({ role: 'user', content: messageText })
  question.value = ''

  scrollToBottom()

  try {
    const response = await gemini.chatWithData(
      authStore.userData.apiKey,
      messageText,
      competencesStore.digCompData
    )

    messages.value.push({ role: 'assistant', content: response })
    scrollToBottom()
  } catch (err) {
    showError('Erreur lors de la requête')
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const close = () => {
  isOpen.value = false
  emit('close')
}
</script>
