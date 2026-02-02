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
        <template v-for="key in outcome.assignees?.slice(0, 3)" :key="key">
          <!-- External member avatar -->
          <div
            v-if="key.startsWith('ext:')"
            class="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-white dark:ring-gray-800"
            :style="{ width: '28px', height: '28px', backgroundColor: getColor(key), fontSize: '11px' }"
            :title="resolveDisplayName(key) + ' (externe)'"
          >
            {{ getExternalInitials(key) }}
          </div>
          <!-- Registered user avatar -->
          <UserAvatar v-else :email="key" :size="28" />
        </template>
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
      class="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10 max-h-96 overflow-y-auto"
    >
      <div class="p-3 border-b border-gray-200 dark:border-gray-700">
        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Assignations</h4>
        <!-- Search -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher..."
          class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <!-- Registered users -->
      <div class="p-2">
        <p class="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Utilisateurs inscrits</p>
        <div
          v-for="user in filteredUsers"
          :key="user.uid"
          @click="user.email && toggleAssignee(user.email)"
          class="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
        >
          <UserAvatar :email="user.email" :size="32" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ user.email ? user.email.split('@')[0] : 'Utilisateur inconnu' }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ user.email || 'Email non défini' }}</p>
          </div>
          <i
            class="ph text-lg"
            :class="(user.email && isAssigned(user.email)) ? 'ph-check-circle text-green-500' : 'ph-circle text-gray-300 dark:text-gray-600'"
          ></i>
        </div>
        <p v-if="filteredUsers.length === 0" class="px-2 py-2 text-xs text-gray-400">Aucun utilisateur trouvé</p>
      </div>

      <!-- External members -->
      <div v-if="authStore.externalMembers.length > 0 || searchQuery" class="p-2 border-t border-gray-200 dark:border-gray-700">
        <p class="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Membres externes</p>
        <div
          v-for="member in filteredExternalMembers"
          :key="member.id"
          @click="toggleAssignee('ext:' + member.id)"
          class="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
        >
          <div
            class="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 relative"
            :style="{ width: '32px', height: '32px', backgroundColor: getColor('ext:' + member.id), fontSize: '12px' }"
          >
            {{ (member.firstName[0] + member.lastName[0]).toUpperCase() }}
            <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-400 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
              <i class="ph ph-user text-white" style="font-size: 7px"></i>
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ member.firstName }} {{ member.lastName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Membre externe</p>
          </div>
          <i
            class="ph text-lg"
            :class="isAssigned('ext:' + member.id) ? 'ph-check-circle text-green-500' : 'ph-circle text-gray-300 dark:text-gray-600'"
          ></i>
        </div>
        <p v-if="filteredExternalMembers.length === 0 && authStore.externalMembers.length > 0" class="px-2 py-2 text-xs text-gray-400">Aucun membre externe trouvé</p>
      </div>

      <!-- Add external member form -->
      <div class="p-3 border-t border-gray-200 dark:border-gray-700">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Ajouter un membre externe</p>
        <div class="flex gap-2">
          <input
            v-model="newFirstName"
            type="text"
            placeholder="Prénom"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
          />
          <input
            v-model="newLastName"
            type="text"
            placeholder="Nom"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
        <button
          @click="addAndAssignExternal"
          :disabled="!newFirstName.trim() || !newLastName.trim() || isAdding"
          class="mt-2 w-full py-1.5 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-1"
        >
          <i v-if="isAdding" class="ph ph-spinner animate-spin"></i>
          <i v-else class="ph ph-user-plus"></i>
          <span>{{ isAdding ? 'Ajout...' : 'Ajouter et assigner' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCompetencesStore } from '@/stores/competences'
import { useToast } from '@/composables/useToast'
import { getUserColor } from '@/utils/helpers'
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
const { success } = useToast()

const isOpen = ref(false)
const searchQuery = ref('')
const newFirstName = ref('')
const newLastName = ref('')
const isAdding = ref(false)

const filteredUsers = computed(() => {
  // Filtrer d'abord les utilisateurs avec email valide
  const validUsers = authStore.users.filter(u => u.email && u.email.trim())
  
  if (!searchQuery.value) return validUsers
  const q = searchQuery.value.toLowerCase()
  return validUsers.filter(u => u.email.toLowerCase().includes(q))
})

const filteredExternalMembers = computed(() => {
  if (!searchQuery.value) return authStore.externalMembers
  const q = searchQuery.value.toLowerCase()
  return authStore.externalMembers.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
  )
})

const isAssigned = (key: string) => {
  return props.outcome.assignees?.includes(key) || false
}

const toggleAssignee = async (key: string) => {
  await competencesStore.toggleAssignee(props.outcome.id, key)
}

const resolveDisplayName = (key: string): string => {
  if (key.startsWith('ext:')) {
    const id = key.replace('ext:', '')
    const member = authStore.externalMembers.find(m => m.id === id)
    return member ? `${member.firstName} ${member.lastName}` : 'Membre inconnu'
  }
  return key ? key.split('@')[0] : 'Utilisateur inconnu'
}

const getExternalInitials = (key: string): string => {
  const id = key.replace('ext:', '')
  const member = authStore.externalMembers.find(m => m.id === id)
  if (member) {
    return (member.firstName[0] + member.lastName[0]).toUpperCase()
  }
  return '??'
}

const getColor = (key: string): string => {
  if (key.startsWith('ext:')) {
    const name = resolveDisplayName(key)
    return getUserColor(name)
  }
  return getUserColor(key)
}

const addAndAssignExternal = async () => {
  if (!newFirstName.value.trim() || !newLastName.value.trim()) return

  isAdding.value = true
  try {
    const docId = await authStore.addExternalMember(newFirstName.value, newLastName.value)
    await competencesStore.toggleAssignee(props.outcome.id, `ext:${docId}`)
    success(`${newFirstName.value} ${newLastName.value} ajouté et assigné`)
    newFirstName.value = ''
    newLastName.value = ''
  } catch (err) {
    console.error('Error adding external member:', err)
  } finally {
    isAdding.value = false
  }
}
</script>
