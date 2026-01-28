import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useMentions() {
  const allUsers = ref<Array<{ email: string; name: string }>>([])

  // Parse mentions in text (@user)
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\S+)/g
    const matches = text.match(mentionRegex) || []
    return matches.map(m => m.slice(1)) // Remove @
  }

  // Get mentions with @ symbol for display
  const getMentionsForDisplay = (text: string) => {
    const regex = /@(\S+)/g
    const mentions: Array<{ full: string; username: string; index: number }> = []
    let match

    while ((match = regex.exec(text)) !== null) {
      mentions.push({
        full: match[0],
        username: match[1],
        index: match.index
      })
    }

    return mentions
  }

  // Highlight mentions in text (for display)
  const highlightMentions = (text: string): string => {
    return text.replace(/@(\S+)/g, '<span class="text-blue-600 dark:text-blue-400 font-semibold">@$1</span>')
  }

  // Get autocomplete suggestions based on partial mention
  const getAutocompleteSuggestions = (partial: string) => {
    if (!partial || partial.length < 1) return []

    return allUsers.value.filter(user =>
      user.email.toLowerCase().includes(partial.toLowerCase()) ||
      user.name.toLowerCase().includes(partial.toLowerCase())
    ).slice(0, 5)
  }

  // Find mentions in text that should trigger notifications
  const findMentionedUsers = (text: string): string[] => {
    const mentions = extractMentions(text)
    const authStore = useAuthStore()
    const currentUserEmail = authStore.currentUser?.email || ''

    return allUsers.value
      .filter(user =>
        mentions.some(m => user.email.includes(m)) &&
        user.email !== currentUserEmail
      )
      .map(u => u.email)
  }

  // Format mention to standard form
  const formatMention = (userEmail: string): string => {
    const user = allUsers.value.find(u => u.email === userEmail)
    return `@${user?.email.split('@')[0] || userEmail}`
  }

  return {
    allUsers,
    extractMentions,
    getMentionsForDisplay,
    highlightMentions,
    getAutocompleteSuggestions,
    findMentionedUsers,
    formatMention
  }
}
