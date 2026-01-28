<template>
  <div class="relative">
    <!-- Mention Autocomplete Popup -->
    <div
      v-if="showMentionPopup && mentionSuggestions.length > 0"
      class="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-40"
    >
      <div class="p-2 space-y-1">
        <button
          v-for="user in mentionSuggestions"
          :key="user.email"
          @click="insertMention(user.email)"
          class="w-full text-left px-3 py-2 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 flex items-center gap-2 text-sm"
        >
          <div class="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs">
            {{ user.email.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ user.name || user.email }}</div>
            <div class="text-xs text-gray-500 truncate">{{ user.email }}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Text Area with mention support -->
    <textarea
      :value="modelValue"
      @input="handleInput"
      @keydown.enter.ctrl="$emit('send')"
      placeholder="Message avec @mentions... (Ctrl+Entrée pour envoyer)"
      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
      rows="3"
    />

    <!-- Mention preview -->
    <div v-if="displayedMentions.length > 0" class="mt-2 flex flex-wrap gap-2">
      <div v-for="mention in displayedMentions" :key="mention" class="inline-block px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-sm">
        {{ mention }}
        <i class="ph ph-at text-xs ml-0.5"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMentions } from '@/composables/useMentions'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'send': []
  'mentions-detected': [mentions: string[]]
}>()

const { getAutocompleteSuggestions, getMentionsForDisplay, findMentionedUsers } = useMentions()

const showMentionPopup = ref(false)
const currentMentionText = ref('')
const mentionStartIndex = ref(-1)

const mentionSuggestions = computed(() => {
  return getAutocompleteSuggestions(currentMentionText.value)
})

const displayedMentions = computed(() => {
  return getMentionsForDisplay(props.modelValue).map(m => m.full)
})

const handleInput = (e: Event) => {
  const text = (e.target as HTMLTextAreaElement).value
  const cursorPos = (e.target as HTMLTextAreaElement).selectionStart

  // Check for @ symbol and trigger autocomplete
  const beforeCursor = text.substring(0, cursorPos)
  const lastAtIndex = beforeCursor.lastIndexOf('@')

  if (lastAtIndex !== -1) {
    const afterAt = beforeCursor.substring(lastAtIndex + 1)
    
    // Check if we're typing a mention (no space after @)
    if (!afterAt.includes(' ')) {
      showMentionPopup.value = true
      currentMentionText.value = afterAt
      mentionStartIndex.value = lastAtIndex
    } else {
      showMentionPopup.value = false
    }
  } else {
    showMentionPopup.value = false
  }

  emit('update:modelValue', text)

  // Detect all mentions and emit them
  const mentions = findMentionedUsers(text)
  emit('mentions-detected', mentions)
}

const insertMention = (email: string) => {
  const text = props.modelValue
  const username = email.split('@')[0]
  
  // Replace the partial mention with the full one
  const before = text.substring(0, mentionStartIndex.value)
  const after = text.substring(mentionStartIndex.value + currentMentionText.value.length + 1)
  
  const newText = `${before}@${username} ${after}`
  emit('update:modelValue', newText)
  
  showMentionPopup.value = false
  currentMentionText.value = ''
  mentionStartIndex.value = -1
}
</script>
