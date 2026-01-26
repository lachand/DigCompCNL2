<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <i class="ph ph-activity"></i>
        Activité récente
      </h3>
      <button
        @click="loadMore"
        class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        Voir plus
      </button>
    </div>

    <div class="space-y-3 max-h-96 overflow-y-auto">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
      >
        <UserAvatar :email="activity.user" :size="32" />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-900 dark:text-white">
            <span class="font-medium">{{ activity.user.split('@')[0] }}</span>
            <span class="text-gray-600 dark:text-gray-400"> {{ activity.action }}</span>
          </p>
          <p class="text-xs text-gray-600 dark:text-gray-400 truncate">{{ activity.detail }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">{{ formatDate(activity.date) }}</p>
        </div>
        <i class="ph ph-dot text-2xl" :class="activityColor(activity.action)"></i>
      </div>

      <div v-if="activities.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
        <i class="ph ph-activity text-4xl mb-2"></i>
        <p>Aucune activité récente</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { formatDate } from '@/utils/helpers'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import type { ActivityFeed } from '@/types'

const activities = ref<ActivityFeed[]>([])
const limitCount = ref(10)

const activityColor = (action: string) => {
  if (action.includes('ajout') || action.includes('créé')) return 'text-green-500'
  if (action.includes('supprim') || action.includes('retiré')) return 'text-red-500'
  if (action.includes('modifi') || action.includes('changé')) return 'text-blue-500'
  return 'text-gray-500'
}

const loadActivities = () => {
  const q = query(
    collection(db, 'activity_feed'),
    orderBy('date', 'desc'),
    limit(limitCount.value)
  )

  onSnapshot(q, (snapshot) => {
    activities.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ActivityFeed))
  })
}

const loadMore = () => {
  limitCount.value += 10
  loadActivities()
}

onMounted(() => {
  loadActivities()
})
</script>
