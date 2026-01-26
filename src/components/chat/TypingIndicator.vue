<template>
  <div class="flex items-center gap-3">
    <div class="flex -space-x-2">
      <UserAvatar
        v-for="user in users"
        :key="user.uid"
        :email="user.email"
        :size="24"
      />
    </div>
    <div class="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-2xl">
      <span class="text-sm text-gray-600 dark:text-gray-400">
        {{ usersText }} {{ users.length > 1 ? 'sont' : 'est' }} en train d'écrire
      </span>
      <div class="flex gap-1 ml-2">
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import type { User } from '@/types'

interface Props {
  users: User[]
}

const props = defineProps<Props>()

const usersText = computed(() => {
  if (props.users.length === 0) return ''
  if (props.users.length === 1) return props.users[0].email.split('@')[0]
  if (props.users.length === 2) {
    return `${props.users[0].email.split('@')[0]} et ${props.users[1].email.split('@')[0]}`
  }
  return `${props.users.length} personnes`
})
</script>
