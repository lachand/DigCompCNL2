<template>
  <div class="flex gap-3" :class="isOwn ? 'flex-row-reverse' : 'flex-row'">
    <!-- Avatar -->
    <div v-if="!isOwn" class="flex-shrink-0">
      <UserAvatar :email="message.sender" :size="36" />
    </div>

    <!-- Message Content -->
    <div class="flex-1 max-w-[70%]" :class="isOwn ? 'flex flex-col items-end' : ''">
      <!-- Sender Name -->
      <p v-if="!isOwn" class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {{ message.sender.split('@')[0] }}
      </p>

      <!-- Bubble -->
      <div
        class="group relative rounded-2xl px-4 py-2"
        :class="isOwn ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'"
      >
        <!-- Text -->
        <p class="whitespace-pre-wrap break-words" v-html="linkify(message.text)"></p>

        <!-- Attachment -->
        <div v-if="message.attachment" class="mt-2 pt-2 border-t" :class="isOwn ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-600'">
          <!-- Image -->
          <img
            v-if="message.attachmentType?.startsWith('image/')"
            :src="message.attachment"
            :alt="message.attachmentName"
            class="max-w-full rounded-lg cursor-pointer"
            @click="openAttachment"
          />
          <!-- File -->
          <a
            v-else
            :href="message.attachment"
            :download="message.attachmentName"
            class="flex items-center gap-2 p-2 rounded-lg hover:opacity-80 transition"
            :class="isOwn ? 'bg-indigo-700' : 'bg-gray-200 dark:bg-gray-600'"
          >
            <i class="ph ph-file text-xl"></i>
            <span class="text-sm truncate">{{ message.attachmentName }}</span>
            <i class="ph ph-download-simple"></i>
          </a>
        </div>

        <!-- Timestamp -->
        <p class="text-xs mt-1 opacity-70">
          {{ formatDate(message.timestamp) }}
        </p>

        <!-- Reaction Button -->
        <button
          @click="showReactionPicker = !showReactionPicker"
          class="absolute -bottom-2 opacity-0 group-hover:opacity-100 transition p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full shadow-lg"
          :class="isOwn ? 'left-0' : 'right-0'"
        >
          <i class="ph ph-smiley text-sm"></i>
        </button>

        <!-- Reaction Picker -->
        <div
          v-if="showReactionPicker"
          v-click-away="() => showReactionPicker = false"
          class="absolute z-10 flex gap-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl"
          :class="isOwn ? 'left-0 top-full mt-2' : 'right-0 top-full mt-2'"
        >
          <button
            v-for="emoji in REACTIONS"
            :key="emoji"
            @click="addReaction(emoji)"
            class="text-xl hover:scale-125 transition"
          >
            {{ emoji }}
          </button>
        </div>
      </div>

      <!-- Reactions -->
      <div v-if="hasReactions" class="flex flex-wrap gap-1 mt-1">
        <button
          v-for="(users, emoji) in message.reactions"
          :key="emoji"
          @click="addReaction(emoji)"
          class="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-sm transition"
          :class="users.includes(authStore.currentUser?.email || '') ? 'ring-2 ring-indigo-500' : ''"
          :title="users.join(', ')"
        >
          <span>{{ emoji }}</span>
          <span class="text-xs text-gray-600 dark:text-gray-400">{{ users.length }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { formatDate, linkify } from '@/utils/helpers'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import type { ChatMessage } from '@/types'

interface Props {
  message: ChatMessage
  isOwn: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addReaction: [emoji: string]
}>()

const authStore = useAuthStore()

const showReactionPicker = ref(false)

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🚀', '👀']

const hasReactions = computed(() => {
  return props.message.reactions && Object.keys(props.message.reactions).length > 0
})

const addReaction = (emoji: string) => {
  emit('addReaction', emoji)
  showReactionPicker.value = false
}

const openAttachment = () => {
  window.open(props.message.attachment, '_blank')
}
</script>
