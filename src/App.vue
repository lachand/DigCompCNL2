<template>
  <div v-if="!authStore.currentUser" class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-95 p-4">
    <LoginForm />
  </div>

  <div v-else class="flex h-screen overflow-hidden relative theme-bg theme-text" @keydown="handleKeydown">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content -->
    <div
      class="flex-1 flex flex-col overflow-hidden transition-all duration-300"
      :style="{
        marginLeft: sidebarIsOpen ? '16rem' : '5rem',
        marginRight: (isChatOpen || isReferentialOpen || isReviewPanelOpen) ? '24rem' : '0'
      }"
    >
      <!-- Header -->
      <Header
        :video-active="videoConference?.isActive?.value ?? false"
        @toggle-chat="isChatOpen = !isChatOpen"
        @toggle-video="toggleVideo"
        @toggle-history="isHistoryOpen = !isHistoryOpen"
        @toggle-magic-import="isMagicImportOpen = true"
        @toggle-export="isExportOpen = true"
        @toggle-referential="isReferentialOpen = !isReferentialOpen"
        @toggle-reviews="isReviewPanelOpen = !isReviewPanelOpen"
      />

      <!-- Router View -->
      <main class="flex-1 overflow-y-auto theme-surface p-6">
        <RouterView />
      </main>
    </div>

    <!-- Chat Panel -->
    <transition name="slide-left">
      <div
        v-if="isChatOpen"
        class="fixed right-0 top-0 h-screen w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-30"
      >
        <ChatPanel @close="isChatOpen = false" />
      </div>
    </transition>

    <!-- Activity History Panel -->
    <ActivityHistoryPanel
      :is-open="isHistoryOpen"
      @close="isHistoryOpen = false"
    />

    <!-- Referential Panel -->
    <ReferentialPanel
      :is-open="isReferentialOpen"
      @close="isReferentialOpen = false"
    />

    <!-- Review Request Panel -->
    <ReviewRequestPanel
      :is-open="isReviewPanelOpen"
      @close="isReviewPanelOpen = false"
    />

    <!-- Magic Import Modal -->
    <MagicImport v-model="isMagicImportOpen" />

    <!-- Export Modal -->
    <ExportModal v-model="isExportOpen" />

    <!-- Toasts -->
    <ToastContainer />

    <!-- Video Conference -->
    <VideoConference ref="videoConference" />

    <!-- Onboarding Tour -->
    <OnboardingTour v-if="authStore.currentUser" />

    <!-- News Modal -->
    <NewsModal v-if="authStore.currentUser && newsStore.unreadNews.some(news => news && news.title && news.content && news.title.trim() && news.content.trim())" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useCompetencesStore } from './stores/competences'
import { useChatStore } from './stores/chat'
import { useNotificationsStore } from './stores/notifications'
import { useNewsStore } from './stores/news'
import { useSidebar } from './composables/useSidebar'
import { useAICache } from './composables/useAICache'
import { requestNotificationPermission } from './utils/helpers'
import LoginForm from './components/common/LoginForm.vue'
import Sidebar from './components/common/Sidebar.vue'
import Header from './components/common/Header.vue'
import ChatPanel from './components/chat/ChatPanel.vue'
import ToastContainer from './components/common/ToastContainer.vue'
import VideoConference from './components/video/VideoConference.vue'
import ActivityHistoryPanel from './components/history/ActivityHistoryPanel.vue'
import ReferentialPanel from './components/common/ReferentialPanel.vue'
import MagicImport from './components/ai/MagicImport.vue'
import ExportModal from './components/common/ExportModal.vue'
import OnboardingTour from './components/common/OnboardingTour.vue'
import ReviewRequestPanel from './components/review/ReviewRequestPanel.vue'
import NewsModal from './components/common/NewsModal.vue'
import { useReviewRequests } from './composables/useReviewRequests'
import { useGamification } from './composables/useGamification'

const authStore = useAuthStore()
const competencesStore = useCompetencesStore()
const chatStore = useChatStore()
const notificationsStore = useNotificationsStore()
const newsStore = useNewsStore()
const { isOpen: sidebarIsOpen } = useSidebar()
const { loadHistory, cleanup: cleanupAICache } = useAICache()

const { loadReviewRequests, cleanup: cleanupReviews } = useReviewRequests()
const { loadStats: loadGamification, cleanup: cleanupGamification } = useGamification()

const isChatOpen = ref(false)
const isHistoryOpen = ref(false)
const isReferentialOpen = ref(false)
const isReviewPanelOpen = ref(false)
const isMagicImportOpen = ref(false)
const isExportOpen = ref(false)
const videoConference = ref<InstanceType<typeof VideoConference>>()

const toggleVideo = () => {
  if (videoConference.value) {
    videoConference.value.open()
  }
}

// Global keyboard shortcuts
const handleKeydown = (e: KeyboardEvent) => {
  // Escape closes panels
  if (e.key === 'Escape') {
    if (isMagicImportOpen.value) {
      isMagicImportOpen.value = false
    } else if (isExportOpen.value) {
      isExportOpen.value = false
    } else if (isReviewPanelOpen.value) {
      isReviewPanelOpen.value = false
    } else if (isReferentialOpen.value) {
      isReferentialOpen.value = false
    } else if (isHistoryOpen.value) {
      isHistoryOpen.value = false
    } else if (isChatOpen.value) {
      isChatOpen.value = false
    }
  }

  // Ctrl/Cmd shortcuts
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'h': // History
        e.preventDefault()
        isHistoryOpen.value = !isHistoryOpen.value
        break
      case 'i': // Magic Import
        e.preventDefault()
        isMagicImportOpen.value = true
        break
      case 'e': // Export
        if (e.shiftKey) {
          e.preventDefault()
          isExportOpen.value = true
        }
        break
      case 'r': // Reviews or Referential
        if (e.shiftKey) {
          e.preventDefault()
          isReferentialOpen.value = !isReferentialOpen.value
        } else {
          e.preventDefault()
          isReviewPanelOpen.value = !isReviewPanelOpen.value
        }
        break
    }
  }
}

onMounted(() => {
  authStore.initAuth()
  competencesStore.loadData()
  chatStore.loadMessages()
  notificationsStore.loadNotifications()
  loadReviewRequests()
  loadGamification()
  loadHistory()
  requestNotificationPermission()

  // Add global keydown listener
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  competencesStore.cleanup()
  chatStore.cleanup()
  notificationsStore.cleanup()
  cleanupReviews()
  cleanupGamification()
  cleanupAICache()

  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(100%);
}
</style>
