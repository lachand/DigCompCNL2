<template>
  <div class="animate-pulse">
    <!-- Text skeleton -->
    <template v-if="type === 'text'">
      <div
        v-for="i in lines"
        :key="i"
        class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"
        :class="i === lines ? 'w-3/4' : 'w-full'"
      ></div>
    </template>

    <!-- Card skeleton -->
    <template v-else-if="type === 'card'">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div class="flex-1">
            <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- List skeleton -->
    <template v-else-if="type === 'list'">
      <div class="space-y-3">
        <div v-for="i in lines" :key="i" class="flex items-center gap-3">
          <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div class="flex-1">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- AI Content skeleton (simulates streaming text) -->
    <template v-else-if="type === 'ai-content'">
      <div class="space-y-4">
        <!-- Title -->
        <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>

        <!-- Paragraph 1 -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>

        <!-- Subtitle -->
        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-4"></div>

        <!-- Paragraph 2 -->
        <div class="space-y-2">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>

        <!-- List items -->
        <div class="space-y-2 ml-4">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Table skeleton -->
    <template v-else-if="type === 'table'">
      <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <!-- Header -->
        <div class="bg-gray-100 dark:bg-gray-700 p-3 flex gap-4">
          <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
        </div>
        <!-- Rows -->
        <div v-for="i in lines" :key="i" class="p-3 flex gap-4 border-t border-gray-200 dark:border-gray-700">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    </template>

    <!-- Default block skeleton -->
    <template v-else>
      <div
        class="bg-gray-200 dark:bg-gray-700 rounded"
        :style="{ width, height }"
      ></div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'text' | 'card' | 'list' | 'ai-content' | 'table' | 'block'
  lines?: number
  width?: string
  height?: string
}

withDefaults(defineProps<Props>(), {
  type: 'block',
  lines: 3,
  width: '100%',
  height: '1rem'
})
</script>
