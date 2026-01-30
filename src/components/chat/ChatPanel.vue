<template>
  <div class="flex flex-col h-full theme-bg">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Chat d'équipe</h2>
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div class="flex -space-x-2">
            <UserAvatar
              v-for="user in onlineUsers.slice(0, 3)"
              :key="user.uid"
              :email="user.email"
              :size="24"
              :hasStar="user.uid === authStore.currentUser?.uid ? userHasGoldFrame : false"
            />
          </div>
          <span>{{ onlineUsers.length }} en ligne</span>
        </div>
      </div>
      <button
        @click="$emit('close')"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-600 dark:text-gray-300"
        title="Fermer le chat"
      >
        <i class="ph ph-x text-xl"></i>
      </button>
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <MessageBubble
        v-for="message in chatStore.sortedMessages"
        :key="message.id"
        :data-message-id="message.id"
        :message="message"
        :is-own="message.sender === authStore.currentUser?.email"
        @add-reaction="(emoji) => chatStore.addReaction(message.id!, emoji)"
        @edit="openEditModal(message)"
        @delete="deleteMessage(message.id!)"
      />

      <!-- Typing Indicator -->
      <TypingIndicator v-if="typingUsers.length > 0" :users="typingUsers" />

      <!-- Empty State -->
      <div v-if="chatStore.sortedMessages.length === 0" class="text-center py-12">
        <i class="ph ph-chat-circle-dots text-6xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <p class="text-gray-500 dark:text-gray-400">Aucun message pour le moment</p>
        <p class="text-sm text-gray-400 dark:text-gray-500">Soyez le premier à écrire!</p>
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <!-- File Preview -->
      <div v-if="attachmentPreview" class="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="ph ph-file text-2xl text-gray-600 dark:text-gray-400"></i>
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ attachmentPreview.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatFileSize(attachmentPreview.size) }}</p>
          </div>
        </div>
        <button @click="clearAttachment" class="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
          <i class="ph ph-x"></i>
        </button>
      </div>

      <form @submit.prevent="sendMessage" class="flex items-end gap-2">
        <!-- Attach Button -->
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          @change="handleFileSelect"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <button
          type="button"
          @click="fileInput?.click()"
          class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          title="Joindre un fichier"
        >
          <i class="ph ph-paperclip text-xl"></i>
        </button>

        <!-- Textarea with @mentions support -->
        <div class="flex-1">
          <MentionTextarea
            :model-value="messageText"
            @update:model-value="messageText = $event"
            @mentions-detected="detectedMentions = $event"
            @send="sendMessage"
          />
        </div>

        <!-- Send Button -->
        <button
          type="submit"
          :disabled="!canSend"
          class="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition"
        >
          <i class="ph ph-paper-plane-right text-xl"></i>
        </button>
      </form>

      <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
        Entrée pour envoyer • Shift+Entrée pour nouvelle ligne • @mention pour notifier
      </p>
    </div>

    <!-- Edit Message Modal -->
    <div
      v-if="editingMessage"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="editingMessage = null"
    >
      <div class="theme-surface rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Éditer le message</h3>
        
        <textarea
          v-model="editText"
          class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          rows="3"
          placeholder="Nouveau texte du message..."
        />

        <div class="mt-4 flex gap-2">
          <button
            @click="editingMessage = null"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
          <button
            @click="saveEdit"
            :disabled="editText.trim().length === 0"
            class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useExtendedGamificationStore } from '@/stores/extendedGamification'

const gamificationStore = useExtendedGamificationStore()
const { userInventory } = storeToRefs(gamificationStore)
const userHasGoldFrame = computed(() => {
  return userInventory.value?.items?.some(item => item.itemId === 'avatar-frame-gold')
})
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useToast } from '@/composables/useToast'
import { useMentions } from '@/composables/useMentions'
import { fileToBase64 } from '@/utils/helpers'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import MessageBubble from './MessageBubble.vue'
import TypingIndicator from './TypingIndicator.vue'
import MentionTextarea from './MentionTextarea.vue'
import type { ChatMessage } from '@/types'

defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const chatStore = useChatStore()
const { success, error: showError } = useToast()
const { findMentionedUsers: _findMentionedUsers } = useMentions()

const messageText = ref('')
const detectedMentions = ref<string[]>([])
const fileInput = ref<HTMLInputElement>()
const messagesContainer = ref<HTMLDivElement>()
const attachmentPreview = ref<File | null>(null)
const attachmentData = ref<string>('')

// Edit modal
const editingMessage = ref<ChatMessage | null>(null)
const editText = ref('')

const onlineUsers = computed(() => authStore.users.filter(u => u.state === 'online'))
const typingUsers = computed(() => authStore.users.filter(u => u.isTyping && u.uid !== authStore.currentUser?.uid))

const canSend = computed(() => messageText.value.trim().length > 0 || attachmentPreview.value)

const handleFileSelect = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    alert('Fichier trop volumineux (max 5MB)')
    return
  }

  attachmentPreview.value = file
  attachmentData.value = await fileToBase64(file)
}

const clearAttachment = () => {
  attachmentPreview.value = null
  attachmentData.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const sendMessage = async () => {
  if (!canSend.value) return

  const attachment = attachmentPreview.value
    ? {
        data: attachmentData.value,
        name: attachmentPreview.value.name,
        type: attachmentPreview.value.type
      }
    : undefined

  await chatStore.sendMessage(messageText.value, attachment)

  messageText.value = ''
  clearAttachment()
  scrollToBottom()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}


const openEditModal = (message: ChatMessage) => {
  editingMessage.value = message
  editText.value = message.text
}

const saveEdit = async () => {
  if (!editingMessage.value) return
  
  try {
    await chatStore.editMessage(editingMessage.value.id!, editText.value)
    success('Message édité avec succès')
    editingMessage.value = null
    editText.value = ''
  } catch (err) {
    showError('Erreur lors de l\'édition du message')
  }
}

const deleteMessage = async (messageId: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce message?')) return
  
  try {
    await chatStore.deleteMessage(messageId)
    success('Message supprimé')
  } catch (err) {
    showError('Erreur lors de la suppression du message')
  }
}
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// Scroll to first unread message on open, or bottom if no unread
const scrollToFirstUnread = () => {
  nextTick(() => {
    if (!messagesContainer.value) return

    // Find first unread message
    const messageElements = messagesContainer.value.querySelectorAll('[data-message-id]')
    const firstUnreadIndex = chatStore.sortedMessages.findIndex(
      m => m.timestamp > chatStore.lastReadTimestamp
    )

    if (firstUnreadIndex > 0 && messageElements[firstUnreadIndex]) {
      messageElements[firstUnreadIndex].scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      scrollToBottom()
    }
  })
}

  watch(() => chatStore.sortedMessages.length, (_newLen, oldLen) => {
  // Only scroll to bottom for new messages, not initial load
  if (oldLen > 0) {
    scrollToBottom()
  }
})

onMounted(() => {
  chatStore.setChatOpen(true)
  scrollToFirstUnread()
})

onUnmounted(() => {
  chatStore.setChatOpen(false)
})
</script>
