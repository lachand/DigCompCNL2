<template>
  <div
    draggable="true"
    @dragstart="onDragStart"
    class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 cursor-move hover:shadow-md transition group"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <div>
        <h4 class="font-semibold text-gray-900 dark:text-white text-sm">{{ outcome.id }}</h4>
        <span class="text-xs px-2 py-0.5 rounded" :class="levelClass">
          {{ translateLevel(outcome.level) }}
        </span>
      </div>
      <button
        @click="$emit('expand')"
        class="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
      >
        <i class="ph ph-arrows-out text-sm"></i>
      </button>
    </div>

    <!-- Description -->
    <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">
      {{ outcome.description }}
    </p>

    <!-- Meta -->
    <div class="flex items-center justify-between">
      <!-- Tags -->
      <div class="flex flex-wrap gap-1">
        <span
          v-for="tag in outcome.tags?.slice(0, 2)"
          :key="tag"
          class="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs rounded"
        >
          {{ tag }}
        </span>
        <span v-if="(outcome.tags?.length || 0) > 2" class="text-xs text-gray-500">
          +{{ (outcome.tags?.length || 0) - 2 }}
        </span>
      </div>

      <!-- Assignees -->
      <div class="flex -space-x-1">
        <template v-for="key in outcome.assignees?.slice(0, 2)" :key="key">
          <div
            v-if="key.startsWith('ext:')"
            class="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
            :style="{ width: '20px', height: '20px', backgroundColor: getExternalColor(key), fontSize: '8px' }"
            :title="getExternalName(key) + ' (externe)'"
          >
            {{ getExternalInitials(key) }}
          </div>
          <UserAvatar v-else :email="key" :size="20" />
        </template>
        <div
          v-if="(outcome.assignees?.length || 0) > 2"
          class="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium"
        >
          +{{ (outcome.assignees?.length || 0) - 2 }}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-3">
        <span v-if="outcome.mappings[year].courseLink" class="flex items-center gap-1">
          <i class="ph ph-link"></i>
          Cours
        </span>
        <span v-if="resourcesCount > 0" class="flex items-center gap-1">
          <i class="ph ph-paperclip"></i>
          {{ resourcesCount }}
        </span>
        <span v-if="commentsCount > 0" class="flex items-center gap-1">
          <i class="ph ph-chat-dots"></i>
          {{ commentsCount }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import { useAuthStore } from '@/stores/auth'
import { getUserColor, translateLevel } from '@/utils/helpers'
import type { LearningOutcome, YearLevel } from '@/types'

interface Props {
  outcome: LearningOutcome
  year: YearLevel
}

const props = defineProps<Props>()
const authStore = useAuthStore()

const emit = defineEmits<{
  dragStart: [e: DragEvent]
  expand: []
}>()

const levelClass = computed(() => {
  const classes = {
    'Basic': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'Advanced': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'Highly advanced': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[props.outcome.level]
})

const resourcesCount = computed(() => props.outcome.mappings[props.year].resources?.length || 0)
const commentsCount = computed(() => props.outcome.comments?.length || 0)

const getExternalName = (key: string): string => {
  const id = key.replace('ext:', '')
  const member = authStore.externalMembers.find(m => m.id === id)
  return member ? `${member.firstName} ${member.lastName}` : 'Membre inconnu'
}

const getExternalInitials = (key: string): string => {
  const id = key.replace('ext:', '')
  const member = authStore.externalMembers.find(m => m.id === id)
  if (member) return (member.firstName[0] + member.lastName[0]).toUpperCase()
  return '??'
}

const getExternalColor = (key: string): string => {
  return getUserColor(getExternalName(key))
}

const onDragStart = (e: DragEvent) => {
  emit('dragStart', e)
}
</script>
