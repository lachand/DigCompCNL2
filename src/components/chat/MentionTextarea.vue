<template>
  <div class="relative">
    <!-- Mention Autocomplete Popup -->
    <div
      v-if="showMentionPopup && mentionSuggestions.length > 0"
      class="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-900/50 rounded-lg shadow-lg z-40 overflow-hidden"
    >
      <div class="bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
        <i class="ph ph-at"></i>
        Suggestions
      </div>
      <div class="p-2 space-y-1 max-h-40 overflow-y-auto">
        <button
          v-for="(user, idx) in mentionSuggestions"
          :key="user.email"
          @click="insertMention(user.email)"
          :class="idx === selectedIndex ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'"
          class="w-full text-left px-3 py-2 rounded flex items-center gap-2 text-sm transition"
        >
          <div class="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {{ user.name.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-gray-900 dark:text-white truncate">{{ user.name }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ user.email }}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Text Area with mention support -->
    <textarea
      :value="modelValue"
      @input="handleInput"
      @keydown.enter.ctrl="$emit('send')"
      @keydown.down.prevent="selectedIndex < mentionSuggestions.length - 1 && selectedIndex++"
      @keydown.up.prevent="selectedIndex > 0 && selectedIndex--"
      @keydown.enter.prevent="showMentionPopup && selectedIndex >= 0 ? insertMention(mentionSuggestions[selectedIndex].email) : $emit('send')"
      placeholder="Message avec @mentions... (Ctrl+Entrée pour envoyer)"
      class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
      rows="3"
    />

    <!-- Mention preview with tags -->
    <div v-if="displayedMentions.length > 0" class="mt-2 flex flex-wrap gap-2">
      <span v-for="mention in displayedMentions" :key="mention" class="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
        <i class="ph ph-at text-xs"></i>
        {{ mention }}
      </span>
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
const selectedIndex = ref(-1)

const mentionSuggestions = computed(() => {
  const suggestions = getAutocompleteSuggestions(currentMentionText.value)
  // Reset selected index when suggestions change
  if (selectedIndex.value >= suggestions.length) {
    selectedIndex.value = -1
  }
  return suggestions
})

const displayedMentions = computed(() => {
  return getMentionsForDisplay(props.modelValue).map(m => {
    const email = m.username
    return email.split('@')[0] || email
  })
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
    if (!afterAt.includes(' ') && !afterAt.includes('\n')) {
      showMentionPopup.value = true
      currentMentionText.value = afterAt
      mentionStartIndex.value = lastAtIndex
      selectedIndex.value = -1
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
  selectedIndex.value = -1
}
</script>
