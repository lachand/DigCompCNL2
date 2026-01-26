<template>
  <div class="relative">
    <button
      v-if="compact"
      @click="isOpen = !isOpen"
      class="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
    >
      <i class="ph ph-tag"></i>
      <span>{{ outcome.tags?.length || 0 }}</span>
    </button>

    <div v-else class="flex flex-wrap items-center gap-2">
      <span
        v-for="tag in outcome.tags"
        :key="tag"
        class="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs rounded-full"
        :title="TAG_NAMES[tag]"
      >
        {{ tag }}
      </span>
      <button
        @click="isOpen = !isOpen"
        class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
        title="Gérer les composantes"
      >
        <i class="ph ph-plus text-sm"></i>
      </button>
    </div>

    <!-- Dropdown -->
    <div
      v-if="isOpen"
      v-click-away="() => isOpen = false"
      class="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10 max-h-96 overflow-y-auto"
    >
      <div class="p-3 border-b border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white">Composantes</h4>
      </div>

      <div class="p-2">
        <div
          v-for="(name, code) in TAG_NAMES"
          :key="code"
          @click="toggleTag(code)"
          class="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
        >
          <i
            class="ph text-lg mt-0.5 flex-shrink-0"
            :class="hasTag(code) ? 'ph-check-square text-purple-500' : 'ph-square text-gray-300 dark:text-gray-600'"
          ></i>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ code }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ name }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import { TAG_NAMES } from '@/types'
import type { LearningOutcome } from '@/types'

interface Props {
  outcome: LearningOutcome
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const competencesStore = useCompetencesStore()

const isOpen = ref(false)

const hasTag = (tag: string) => {
  return props.outcome.tags?.includes(tag) || false
}

const toggleTag = async (tag: string) => {
  await competencesStore.toggleTag(props.outcome.id, tag)
}
</script>
