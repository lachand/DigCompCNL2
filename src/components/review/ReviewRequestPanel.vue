<template>
  <transition name="slide-left">
    <div
      v-if="isOpen"
      class="fixed right-0 top-0 h-screen w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-30 flex flex-col"
    >
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <i class="ph ph-checks text-indigo-500"></i>
          Reviews
        </h2>
        <button
          @click="emit('close')"
          class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <i class="ph ph-x text-lg"></i>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200 dark:border-gray-700">
        <button
          @click="activeTab = 'pending'"
          class="flex-1 py-3 text-sm font-medium text-center transition border-b-2"
          :class="activeTab === 'pending'
            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        >
          A reviewer
          <span
            v-if="pendingForMe.length > 0"
            class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white"
          >
            {{ pendingForMe.length }}
          </span>
        </button>
        <button
          @click="activeTab = 'mine'"
          class="flex-1 py-3 text-sm font-medium text-center transition border-b-2"
          :class="activeTab === 'mine'
            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        >
          Mes demandes
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Pending for me tab -->
        <div v-if="activeTab === 'pending'">
          <div v-if="pendingForMe.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
            <i class="ph ph-checks text-4xl mb-2"></i>
            <p>Aucune review en attente</p>
          </div>
          <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <div
              v-for="request in pendingForMe"
              :key="request.id"
              class="p-4 space-y-3"
            >
              <!-- Request info -->
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <i class="ph ph-user text-indigo-600 dark:text-indigo-400"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ request.requestedBy.split('@')[0] }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ request.outcomeId }} ({{ request.year }})
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ formatDate(request.createdAt) }}
                  </p>
                </div>
                <span class="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  En attente
                </span>
              </div>

              <!-- Request comment -->
              <p v-if="request.requestComment" class="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded p-2 italic">
                "{{ request.requestComment }}"
              </p>

              <!-- Review comment input -->
              <textarea
                v-model="reviewComments[request.id!]"
                rows="2"
                placeholder="Commentaire (obligatoire pour rejeter)..."
                class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              ></textarea>

              <!-- Action buttons -->
              <div class="flex gap-2">
                <button
                  @click="handleReject(request.id!)"
                  :disabled="!reviewComments[request.id!]"
                  class="flex-1 py-1.5 text-sm bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg transition flex items-center justify-center gap-1"
                >
                  <i class="ph ph-x-circle"></i>
                  Rejeter
                </button>
                <button
                  @click="handleApprove(request.id!)"
                  class="flex-1 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 rounded-lg transition flex items-center justify-center gap-1"
                >
                  <i class="ph ph-check-circle"></i>
                  Approuver
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- My requests tab -->
        <div v-if="activeTab === 'mine'">
          <div v-if="myRequests.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
            <i class="ph ph-paper-plane-tilt text-4xl mb-2"></i>
            <p>Aucune demande envoyee</p>
          </div>
          <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
            <div
              v-for="request in sortedMyRequests"
              :key="request.id"
              class="p-4 space-y-2"
            >
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="request.status === 'approved'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : request.status === 'rejected'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-yellow-100 dark:bg-yellow-900/30'"
                >
                  <i class="ph"
                    :class="request.status === 'approved'
                      ? 'ph-check-circle text-green-600 dark:text-green-400'
                      : request.status === 'rejected'
                        ? 'ph-x-circle text-red-600 dark:text-red-400'
                        : 'ph-hourglass text-yellow-600 dark:text-yellow-400'"
                  ></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ request.outcomeId }} ({{ request.year }})
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Reviewer : {{ request.reviewer.split('@')[0] }}
                  </p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ formatDate(request.createdAt) }}
                  </p>
                </div>
                <span
                  class="px-2 py-0.5 text-xs rounded-full"
                  :class="statusBadgeClass(request.status)"
                >
                  {{ statusLabel(request.status) }}
                </span>
              </div>

              <!-- Reviewer comment -->
              <div v-if="request.comment && request.status !== 'pending'" class="text-sm p-2 rounded"
                :class="request.status === 'approved'
                  ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400'"
              >
                <i class="ph ph-chat-circle text-xs mr-1"></i>
                "{{ request.comment }}"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useReviewRequests } from '@/composables/useReviewRequests'
import type { ReviewStatus } from '@/types'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { pendingForMe, myRequests, approveReview, rejectReview } = useReviewRequests()

const activeTab = ref<'pending' | 'mine'>('pending')
const reviewComments = reactive<Record<string, string>>({})

const sortedMyRequests = computed(() => {
  return [...myRequests.value].sort((a, b) => b.createdAt - a.createdAt)
})

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function statusBadgeClass(status: ReviewStatus): string {
  const classes: Record<ReviewStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }
  return classes[status]
}

function statusLabel(status: ReviewStatus): string {
  const labels: Record<ReviewStatus, string> = {
    pending: 'En attente',
    approved: 'Approuvee',
    rejected: 'Rejetee'
  }
  return labels[status]
}

async function handleApprove(requestId: string) {
  await approveReview(requestId, reviewComments[requestId] || undefined)
  delete reviewComments[requestId]
}

async function handleReject(requestId: string) {
  if (!reviewComments[requestId]) return
  await rejectReview(requestId, reviewComments[requestId])
  delete reviewComments[requestId]
}
</script>
