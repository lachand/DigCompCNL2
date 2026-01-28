<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Statistiques</h1>
        <p class="text-gray-600 dark:text-gray-400">Vue détaillée de la progression</p>
      </div>

      <!-- Time Period -->
      <select
        v-model="timePeriod"
        class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="week">Cette semaine</option>
        <option value="month">Ce mois</option>
        <option value="quarter">Ce trimestre</option>
        <option value="all">Tout</option>
      </select>
    </div>

    <!-- Overview Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <i class="ph ph-list-checks text-xl text-indigo-600 dark:text-indigo-400"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total LOs</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ totalOutcomes }}</p>
          </div>
        </div>
      </div>

      <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
            <i class="ph ph-check-circle text-xl text-green-600 dark:text-green-400"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Validés</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ validatedCount }}</p>
          </div>
        </div>
      </div>

      <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <i class="ph ph-clock text-xl text-blue-600 dark:text-blue-400"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">En cours</p>
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ inProgressCount }}</p>
          </div>
        </div>
      </div>

      <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <i class="ph ph-hourglass text-xl text-gray-600 dark:text-gray-400"></i>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Non traités</p>
            <p class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ noneCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Progress by Year -->
      <div class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progression par année</h3>

        <div class="space-y-4">
          <div v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])" :key="year">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ year }}</span>
              <span class="text-sm text-gray-500">{{ getYearProgress(year) }}%</span>
            </div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="getProgressColor(getYearProgress(year))"
                :style="{ width: getYearProgress(year) + '%' }"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>{{ getYearValidatedCount(year) }} validés</span>
              <span>{{ totalOutcomes }} total</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Status Distribution -->
      <div class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribution des statuts</h3>

        <!-- Simple chart visualization -->
        <div class="flex items-end justify-center gap-4 h-48 mb-4">
          <div
            v-for="status in statusDistribution"
            :key="status.name"
            class="flex flex-col items-center"
          >
            <div
              class="w-16 rounded-t transition-all duration-500"
              :class="status.color"
              :style="{ height: (status.percentage * 1.5) + 'px' }"
            ></div>
            <span class="text-xs text-gray-500 mt-2">{{ status.name }}</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ status.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Domain Progress -->
    <div class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progression par domaine</h3>

      <div class="space-y-4">
        <div
          v-for="domain in domainStats"
          :key="domain.id"
          class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-3">
              <div
                class="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                :style="{ backgroundColor: domain.color }"
              >
                {{ domain.id }}
              </div>
              <span class="font-medium text-gray-900 dark:text-white">{{ domain.name }}</span>
            </div>
            <span class="text-sm text-gray-500">{{ domain.total }} LOs</span>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div v-for="year in (['L1', 'L2', 'L3'] as YearLevel[])" :key="year">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-gray-500">{{ year }}</span>
                <span class="text-gray-700 dark:text-gray-300">{{ domain.progress[year] }}%</span>
              </div>
              <div class="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="getProgressColor(domain.progress[year])"
                  :style="{ width: domain.progress[year] + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Level Distribution -->
    <div class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Distribution par niveau</h3>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="level in levelDistribution"
          :key="level.name"
          class="p-4 rounded-lg text-center"
          :class="level.bgClass"
        >
          <p class="text-3xl font-bold" :class="level.textClass">{{ level.count }}</p>
          <p class="text-sm" :class="level.textClass">{{ level.name }}</p>
          <p class="text-xs opacity-75" :class="level.textClass">{{ level.percentage }}%</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCompetencesStore } from '@/stores/competences'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'
import type { YearLevel, AuditLog } from '@/types'

const competencesStore = useCompetencesStore()

const timePeriod = ref<'week' | 'month' | 'quarter' | 'all'>('month')
const recentActivity = ref<any[]>([])

const totalOutcomes = computed(() => competencesStore.allOutcomes.length)

const validatedCount = computed(() => {
  let count = 0
  competencesStore.allOutcomes.forEach(o => {
    if (o.mappings.L1.status === 'validated') count++
    if (o.mappings.L2.status === 'validated') count++
    if (o.mappings.L3.status === 'validated') count++
  })
  return count
})

const inProgressCount = computed(() => {
  let count = 0
  competencesStore.allOutcomes.forEach(o => {
    if (['draft', 'review'].includes(o.mappings.L1.status)) count++
    if (['draft', 'review'].includes(o.mappings.L2.status)) count++
    if (['draft', 'review'].includes(o.mappings.L3.status)) count++
  })
  return count
})

const noneCount = computed(() => {
  let count = 0
  competencesStore.allOutcomes.forEach(o => {
    if (o.mappings.L1.status === 'none') count++
    if (o.mappings.L2.status === 'none') count++
    if (o.mappings.L3.status === 'none') count++
  })
  return count
})

const getYearProgress = (year: YearLevel) => {
  if (totalOutcomes.value === 0) return 0
  const validated = competencesStore.allOutcomes.filter(o => o.mappings[year].status === 'validated').length
  return Math.round((validated / totalOutcomes.value) * 100)
}

const getYearValidatedCount = (year: YearLevel) => {
  return competencesStore.allOutcomes.filter(o => o.mappings[year].status === 'validated').length
}

const getProgressColor = (progress: number) => {
  if (progress >= 80) return 'bg-green-500'
  if (progress >= 50) return 'bg-blue-500'
  if (progress >= 25) return 'bg-yellow-500'
  return 'bg-gray-400'
}

const statusDistribution = computed(() => {
  const total = totalOutcomes.value * 3
  const counts: Record<string, number> = {
    none: 0,
    draft: 0,
    review: 0,
    validated: 0,
    obsolete: 0
  }

  competencesStore.allOutcomes.forEach(o => {
    counts[o.mappings.L1.status]++
    counts[o.mappings.L2.status]++
    counts[o.mappings.L3.status]++
  })

  return [
    { name: 'Non traité', count: counts.none, percentage: Math.round((counts.none / total) * 100), color: 'bg-gray-400' },
    { name: 'Brouillon', count: counts.draft, percentage: Math.round((counts.draft / total) * 100), color: 'bg-yellow-400' },
    { name: 'En révision', count: counts.review, percentage: Math.round((counts.review / total) * 100), color: 'bg-blue-400' },
    { name: 'Validé', count: counts.validated, percentage: Math.round((counts.validated / total) * 100), color: 'bg-green-500' },
    { name: 'Obsolète', count: counts.obsolete, percentage: Math.round((counts.obsolete / total) * 100), color: 'bg-red-400' }
  ]
})

const domainStats = computed(() => {
  const colors: Record<string, string> = {
    '1': '#3b82f6',
    '2': '#10b981',
    '3': '#f59e0b',
    '4': '#ef4444',
    '5': '#8b5cf6'
  }

  return competencesStore.digCompData.domains.map(domain => {
    const outcomes = domain.competences.flatMap(c => c.outcomes)
    const total = outcomes.length

    const progress: Record<YearLevel, number> = {
      L1: 0,
      L2: 0,
      L3: 0
    }

    if (total > 0) {
      (['L1', 'L2', 'L3'] as YearLevel[]).forEach(year => {
        const validated = outcomes.filter(o => o.mappings[year].status === 'validated').length
        progress[year] = Math.round((validated / total) * 100)
      })
    }

    return {
      id: domain.id,
      name: domain.name,
      total,
      color: colors[domain.id] || '#6b7280',
      progress
    }
  })
})

const levelDistribution = computed(() => {
  const counts: Record<string, number> = {
    'Basic': 0,
    'Intermediate': 0,
    'Advanced': 0,
    'Highly advanced': 0
  }

  competencesStore.allOutcomes.forEach(o => {
    counts[o.level]++
  })

  const total = totalOutcomes.value || 1

  return [
    {
      name: 'Basic',
      count: counts['Basic'],
      percentage: Math.round((counts['Basic'] / total) * 100),
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      textClass: 'text-green-700 dark:text-green-400'
    },
    {
      name: 'Intermediate',
      count: counts['Intermediate'],
      percentage: Math.round((counts['Intermediate'] / total) * 100),
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      textClass: 'text-blue-700 dark:text-blue-400'
    },
    {
      name: 'Advanced',
      count: counts['Advanced'],
      percentage: Math.round((counts['Advanced'] / total) * 100),
      bgClass: 'bg-orange-100 dark:bg-orange-900/30',
      textClass: 'text-orange-700 dark:text-orange-400'
    },
    {
      name: 'Highly adv.',
      count: counts['Highly advanced'],
      percentage: Math.round((counts['Highly advanced'] / total) * 100),
      bgClass: 'bg-red-100 dark:bg-red-900/30',
      textClass: 'text-red-700 dark:text-red-400'
    }
  ]
})

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return 'À l\'instant'
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`

  return date.toLocaleDateString('fr-FR')
}

const loadRecentActivity = async () => {
  try {
    const q = query(
      collection(db, 'auditLog'),
      orderBy('timestamp', 'desc'),
      limit(10)
    )
    const snapshot = await getDocs(q)

    recentActivity.value = snapshot.docs.map(doc => {
      const data = doc.data() as AuditLog

      let icon = 'ph ph-pencil'
      let iconBg = 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'

      if (data.action === 'status') {
        if (data.newVal === 'validated') {
          icon = 'ph ph-check text-green-600'
          iconBg = 'bg-green-100 dark:bg-green-900/30'
        } else {
          icon = 'ph ph-arrow-right text-blue-600'
          iconBg = 'bg-blue-100 dark:bg-blue-900/30'
        }
      } else if (data.action === 'resource') {
        icon = 'ph ph-file-plus text-indigo-600'
        iconBg = 'bg-indigo-100 dark:bg-indigo-900/30'
      } else if (data.action === 'comment') {
        icon = 'ph ph-chat-circle text-purple-600'
        iconBg = 'bg-purple-100 dark:bg-purple-900/30'
      }

      return {
        id: doc.id,
        description: data.desc,
        user: data.user?.split('@')[0] || 'Utilisateur',
        timestamp: data.timestamp,
        icon,
        iconBg
      }
    })
  } catch (err) {
    console.error('Failed to load recent activity:', err)
  }
}

onMounted(() => {
  loadRecentActivity()
})
</script>
