<template>
  <div class="relative">
    <button
      v-if="compact"
      @click="isOpen = !isOpen"
      class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
    >
      <i class="ph ph-users"></i>
      <span>{{ outcome.assignees?.length || 0 }}</span>
    </button>

    <div v-else class="flex items-center gap-2">
      <div class="flex -space-x-2">
        <UserAvatar
          v-for="email in outcome.assignees?.slice(0, 3)"
          :key="email"
          :email="email"
          :size="28"
        />
        <button
          v-if="(outcome.assignees?.length || 0) > 3"
          @click="isOpen = !isOpen"
          class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium"
        >
          +{{ (outcome.assignees?.length || 0) - 3 }}
        </button>
      </div>
      <button
        @click="isOpen = !isOpen"
        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
        title="Gérer les assignations"
      >
        <i class="ph ph-plus text-sm"></i>
      </button>
    </div>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      v-click-away="() => isOpen = false"
      class="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10 max-h-80 overflow-y-auto"
    >
      <div class="p-3 border-b border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white">Assignations</h4>
      </div>

      <div class="p-2">
        <div
          v-for="user in authStore.users"
          :key="user.uid"
          @click="toggleAssignee(user.email)"
          class="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
        >
          <UserAvatar :email="user.email" :size="32" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ user.email.split('@')[0] }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ user.email }}</p>
          </div>
          <i
            class="ph text-lg"
            :class="isAssigned(user.email) ? 'ph-check-circle text-green-500' : 'ph-circle text-gray-300 dark:text-gray-600'"
          ></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompetencesStore } from '@/stores/competences'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import type { LearningOutcome } from '@/types'

interface Props {
  outcome: LearningOutcome
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const authStore = useAuthStore()
const competencesStore = useCompetencesStore()

const isOpen = ref(false)

const isAssigned = (email: string) => {
  return props.outcome.assignees?.includes(email) || false
}

const toggleAssignee = async (email: string) => {
  await competencesStore.toggleAssignee(props.outcome.id, email)
}
</script>
