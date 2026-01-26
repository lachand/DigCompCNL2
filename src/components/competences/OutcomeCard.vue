<template>
  <div
    class="bg-white dark:bg-gray-800 border rounded-lg shadow-sm hover:shadow-md transition"
    :class="[
      isLocked ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700',
      isPinned ? 'ring-2 ring-yellow-400' : '',
      selected ? 'ring-2 ring-indigo-500' : ''
    ]"
  >
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-2">
            <!-- Checkbox for selection -->
            <input
              v-if="selectable"
              type="checkbox"
              :checked="selected"
              @change="$emit('toggle-select')"
              class="w-4 h-4 rounded text-indigo-600 mr-1"
              @click.stop
            />
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ outcome.id }}</h3>
            <span class="px-2 py-1 text-xs font-medium rounded" :class="levelClass">
              {{ outcome.level }}
            </span>
            <i
              v-if="isPinned"
              class="ph-fill ph-push-pin text-yellow-500"
              title="Épinglé"
            ></i>
          </div>
          <p class="text-gray-700 dark:text-gray-300">{{ outcome.description }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1">
          <button
            @click="showAIAssistant = true"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title="Assistant IA"
          >
            <i class="ph ph-magic-wand"></i>
          </button>
          <button
            @click="showResourceHunter = true"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title="Resource Hunter"
          >
            <i class="ph ph-magnifying-glass"></i>
          </button>
          <button
            @click="authStore.togglePin(outcome.id)"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            :title="isPinned ? 'Désépingler' : 'Épingler'"
          >
            <i class="ph" :class="isPinned ? 'ph-fill ph-push-pin' : 'ph-push-pin'"></i>
          </button>
          <button
            @click="expanded = !expanded"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <i class="ph" :class="expanded ? 'ph-caret-up' : 'ph-caret-down'"></i>
          </button>
        </div>
      </div>

      <!-- Tags & Assignees -->
      <div class="flex items-center gap-3 mt-3">
        <TagManager :outcome="outcome" compact />
        <AssigneeManager :outcome="outcome" compact />
      </div>
    </div>

    <!-- Year Mappings -->
    <div v-if="outcome.mappings" class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
      <div
        v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])"
        :key="year"
        class="p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-semibold text-gray-900 dark:text-white">{{ year }}</h4>
          <StatusDropdown
            :status="outcome.mappings[year]?.status || 'none'"
            :outcome-id="outcome.id"
            :year="year"
          />
        </div>

        <!-- Course Link -->
        <div v-if="outcome.mappings[year]?.courseLink" class="mb-3">
          <a
            :href="outcome.mappings[year].courseLink"
            target="_blank"
            class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <i class="ph ph-link"></i>
            Lien vers le cours
          </a>
        </div>

        <!-- Resources -->
        <ResourceList
          :resources="outcome.mappings[year]?.resources || []"
          :outcome-id="outcome.id"
          :year="year"
        />
      </div>
    </div>

    <!-- Expanded Section -->
    <div v-if="expanded" class="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <!-- Comments -->
      <CommentsList :outcome="outcome" />

      <!-- Lock Warning -->
      <div v-if="lockedBy" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div class="flex items-center gap-2 text-red-700 dark:text-red-400">
          <i class="ph ph-lock-key"></i>
          <span class="text-sm">Verrouillé par <strong>{{ lockedBy }}</strong></span>
        </div>
      </div>
    </div>

    <!-- AI Assistant Modal -->
    <AIAssistant v-model="showAIAssistant" :outcome="outcome" />

    <!-- Resource Hunter Modal -->
    <ResourceHunter v-model="showResourceHunter" :outcome="outcome" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompetencesStore } from '@/stores/competences'
import StatusDropdown from './StatusDropdown.vue'
import ResourceList from './ResourceList.vue'
import CommentsList from './CommentsList.vue'
import TagManager from './TagManager.vue'
import AssigneeManager from './AssigneeManager.vue'
import AIAssistant from '@/components/ai/AIAssistant.vue'
import ResourceHunter from './ResourceHunter.vue'
import type { LearningOutcome, YearLevel } from '@/types'

interface Props {
  outcome: LearningOutcome
  selected?: boolean
  selectable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  selectable: true
})

defineEmits<{
  'toggle-select': []
}>()

const authStore = useAuthStore()
const competencesStore = useCompetencesStore()

const expanded = ref(false)
const showAIAssistant = ref(false)
const showResourceHunter = ref(false)

const isPinned = computed(() => authStore.isPinned(props.outcome.id))
const isLocked = computed(() => competencesStore.isLocked(props.outcome.id))
const lockedBy = computed(() => competencesStore.getLockedBy(props.outcome.id))

const levelClass = computed(() => {
  const classes = {
    'Basic': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    'Intermediate': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    'Advanced': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    'Highly advanced': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }
  return classes[props.outcome.level]
})
</script>
