<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <i class="ph ph-users"></i>
      Utilisateurs connectés ({{ onlineUsers.length }})
    </h3>

    <div class="space-y-2">
      <div
        v-for="user in sortedUsers"
        :key="user.uid"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        <!-- Avatar -->
        <div class="relative">
          <UserAvatar :email="user.email" :size="40" />
          <div
            class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
            :class="user.state === 'online' ? 'bg-green-500' : 'bg-gray-400'"
          ></div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 dark:text-white truncate">
            {{ user.email.split('@')[0] }}
          </p>
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span v-if="user.isTyping" class="flex items-center gap-1">
              <i class="ph ph-chat-dots animate-pulse"></i>
              est en train d'écrire...
            </span>
            <span v-else>
              {{ user.state === 'online' ? 'En ligne' : formatDate(user.lastSeen || 0) }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1">
          <button
            @click="$emit('startChat', user.email)"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
            title="Envoyer un message"
          >
            <i class="ph ph-chat-circle text-gray-600 dark:text-gray-400"></i>
          </button>
        </div>
      </div>

      <div v-if="sortedUsers.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        <i class="ph ph-user-slash text-4xl mb-2"></i>
        <p>Aucun utilisateur connecté</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/utils/helpers'
import UserAvatar from './UserAvatar.vue'
import type { User } from '@/types'

defineEmits<{
  startChat: [email: string]
}>()

const authStore = useAuthStore()

const onlineUsers = computed(() => {
  return authStore.users.filter(u => u.state === 'online' && u.uid !== authStore.currentUser?.uid)
})

const sortedUsers = computed(() => {
  return [...authStore.users]
    .filter(u => u.uid !== authStore.currentUser?.uid)
    .sort((a, b) => {
      // Online first
      if (a.state === 'online' && b.state !== 'online') return -1
      if (a.state !== 'online' && b.state === 'online') return 1

      // Then by last seen
      return (b.lastSeen || 0) - (a.lastSeen || 0)
    })
})
</script>
