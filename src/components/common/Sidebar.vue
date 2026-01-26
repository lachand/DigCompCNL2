<template>
  <aside
    class="fixed left-0 top-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40"
    :class="isOpen ? 'w-64' : 'w-20'"
  >
    <!-- Logo & Toggle -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <div v-show="isOpen" class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center" :style="{ backgroundColor: accentColor }">
          <i class="ph ph-graduation-cap text-xl text-white"></i>
        </div>
        <span class="font-bold text-gray-900 dark:text-white">DigComp 3.0</span>
      </div>
      <button
        @click="toggleSidebar"
        class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        :class="!isOpen && 'mx-auto'"
      >
        <i class="ph text-xl" :class="isOpen ? 'ph-caret-left' : 'ph-caret-right'"></i>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="p-4 space-y-2 overflow-y-auto" style="max-height: calc(100vh - 200px)">
      <!-- Simple menu items -->
      <router-link
        v-for="item in simpleMenuItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-3 rounded-lg transition group"
        :class="isActive(item.path) ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
      >
        <i class="ph text-xl" :class="item.icon"></i>
        <span v-show="isOpen" class="font-medium">{{ item.label }}</span>
        <div v-if="item.badge && isOpen" class="ml-auto">
          <span class="px-2 py-1 bg-red-500 text-white text-xs rounded-full">{{ item.badge }}</span>
        </div>
      </router-link>

      <!-- Learning Outcomes with expandable submenu -->
      <div class="space-y-1">
        <button
          @click="toggleLOMenu"
          class="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition"
          :class="isLOActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
        >
          <i class="ph ph-list-checks text-xl"></i>
          <span v-show="isOpen" class="font-medium flex-1 text-left">Learning Outcomes</span>
          <i v-show="isOpen" class="ph text-sm" :class="loMenuExpanded ? 'ph-caret-up' : 'ph-caret-down'"></i>
        </button>

        <!-- LO Submenu -->
        <transition name="submenu">
          <div v-if="loMenuExpanded && isOpen" class="ml-4 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
            <router-link
              to="/outcomes"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition"
              :class="route.path === '/outcomes' && !route.params.domain ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'"
            >
              <i class="ph ph-grid-four"></i>
              <span>Vue d'ensemble</span>
            </router-link>

            <!-- Domain list -->
            <div v-for="domain in domains" :key="domain.id" class="space-y-1">
              <div class="flex items-center">
                <router-link
                  :to="`/outcomes/${encodeURIComponent(domain.id)}`"
                  class="flex-1 flex items-center gap-2 px-3 py-2 rounded-l-lg text-sm transition"
                  :class="isDomainActive(domain.id) ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'"
                >
                  <i class="ph ph-folder"></i>
                  <span class="flex-1 text-left truncate">{{ getDomainDisplayName(domain) }}</span>
                </router-link>
                <button
                  @click.stop="toggleDomain(domain.id)"
                  class="px-2 py-2 rounded-r-lg text-sm transition"
                  :class="isDomainActive(domain.id) ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'"
                >
                  <i class="ph text-xs" :class="expandedDomains.includes(domain.id) ? 'ph-caret-up' : 'ph-caret-down'"></i>
                </button>
              </div>

              <!-- Competences submenu -->
              <transition name="submenu">
                <div v-if="expandedDomains.includes(domain.id)" class="ml-4 space-y-1">
                  <router-link
                    v-for="comp in domain.competences"
                    :key="comp.id"
                    :to="`/outcomes/${encodeURIComponent(domain.id)}/${encodeURIComponent(comp.id)}`"
                    class="flex items-center gap-2 px-2 py-1.5 rounded text-xs transition"
                    :class="decodeURIComponent(String(route.params.competence || '')) === comp.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'"
                  >
                    <span class="truncate">{{ getCompetenceDisplayName(comp) }}</span>
                    <span class="ml-auto text-xs opacity-60">{{ comp.outcomes?.length || 0 }}</span>
                  </router-link>
                </div>
              </transition>
            </div>
          </div>
        </transition>
      </div>

      <!-- Other menu items -->
      <router-link
        v-for="item in bottomMenuItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-3 rounded-lg transition group"
        :class="isActive(item.path) ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
      >
        <i class="ph text-xl" :class="item.icon"></i>
        <span v-show="isOpen" class="font-medium">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- User Section -->
    <div class="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-3">
        <UserAvatar :email="authStore.userData?.email || ''" :size="40" />
        <div v-show="isOpen" class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ authStore.userData?.email?.split('@')[0] }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">En ligne</p>
        </div>
      </div>
      <button
        v-show="isOpen"
        @click="authStore.logout"
        class="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
      >
        <i class="ph ph-sign-out"></i>
        <span>Déconnexion</span>
      </button>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <div
    v-if="isOpen && isMobile"
    @click="closeSidebar"
    class="fixed inset-0 bg-black/50 z-30 md:hidden"
  ></div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useCompetencesStore } from '@/stores/competences'
import { useSidebar } from '@/composables/useSidebar'
import { useUserPreferences } from '@/composables/useUserPreferences'
import UserAvatar from '@/components/auth/UserAvatar.vue'

const route = useRoute()
const authStore = useAuthStore()
const chatStore = useChatStore()
const competencesStore = useCompetencesStore()
const { isOpen, toggle } = useSidebar()
const { view } = useUserPreferences()

const isMobile = ref(false)
const loMenuExpanded = ref(true)
const expandedDomains = ref<string[]>([])

// Accent color from preferences
const accentColor = computed(() => view.value.accentColor)

// Domains from store
const domains = computed(() => competencesStore.digCompData.domains)

const simpleMenuItems = computed(() => [
  { path: '/dashboard', label: 'Dashboard', icon: 'ph-chart-line' }
])

const bottomMenuItems = computed(() => [
  { path: '/overview', label: 'Vue d\'ensemble', icon: 'ph-eye' },
  { path: '/kanban', label: 'Kanban', icon: 'ph-kanban' },
  { path: '/comparison', label: 'Comparaison', icon: 'ph-columns' },
  { path: '/statistics', label: 'Statistiques', icon: 'ph-chart-bar' }
])

const isActive = (path: string) => route.path === path

const isLOActive = computed(() => {
  return route.path.startsWith('/outcomes') || route.path.startsWith('/l')
})

const isDomainActive = (domainId: string) => {
  const decodedDomain = decodeURIComponent(String(route.params.domain || ''))
  return decodedDomain === domainId
}

// Helper functions for display names
const getDomainDisplayName = (domain: any) => {
  // Extract a readable name from domain id (e.g., "CompetenceArea/1" -> "Domaine 1")
  const match = domain.id?.match(/\/(\d+)$/)
  if (match) {
    return `Domaine ${match[1]}`
  }
  return domain.title || domain.id
}

const getCompetenceDisplayName = (comp: any) => {
  // Extract a readable name from competence id
  const match = comp.id?.match(/(\d+\.\d+)/)
  if (match) {
    return `${match[1]} - ${comp.title || ''}`
  }
  return comp.title || comp.id
}

const toggleLOMenu = () => {
  loMenuExpanded.value = !loMenuExpanded.value
}

const toggleDomain = (domainId: string) => {
  const index = expandedDomains.value.indexOf(domainId)
  if (index > -1) {
    expandedDomains.value.splice(index, 1)
  } else {
    expandedDomains.value.push(domainId)
  }
}

const toggleSidebar = () => {
  toggle()
}

const closeSidebar = () => {
  if (isMobile.value) {
    isOpen.value = false
  }
}

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.submenu-enter-active,
.submenu-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  max-height: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
