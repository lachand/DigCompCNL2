<template>
  <Modal
    v-model="isOpen"
    title="Changer le mot de passe"
    icon="ph-lock-key"
    size="sm"
    variant="primary"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Mot de passe actuel -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          <i class="ph ph-lock mr-1"></i>Mot de passe actuel
        </label>
        <input
          v-model="currentPassword"
          type="password"
          required
          placeholder="••••••••"
          class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          :class="formError && formError.includes('actuel') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
        />
      </div>

      <!-- Nouveau mot de passe -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          <i class="ph ph-key mr-1"></i>Nouveau mot de passe
        </label>
        <input
          v-model="newPassword"
          type="password"
          required
          minlength="6"
          placeholder="Minimum 6 caractères"
          class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          :class="newPassword && newPassword.length < 6 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
        />
        <!-- Indicateur de force -->
        <div v-if="newPassword" class="mt-2">
          <div class="flex gap-1">
            <div
              v-for="i in 4"
              :key="i"
              class="h-1 flex-1 rounded-full transition-colors"
              :class="i <= passwordStrength ? strengthColor : 'bg-gray-200 dark:bg-gray-700'"
            ></div>
          </div>
          <p class="text-xs mt-1" :class="strengthTextColor">{{ strengthLabel }}</p>
        </div>
      </div>

      <!-- Confirmer -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          <i class="ph ph-check-circle mr-1"></i>Confirmer le nouveau mot de passe
        </label>
        <input
          v-model="confirmPassword"
          type="password"
          required
          placeholder="••••••••"
          class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          :class="confirmPassword && confirmPassword !== newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
        />
        <p v-if="confirmPassword && confirmPassword !== newPassword" class="text-xs text-red-500 mt-1">
          Les mots de passe ne correspondent pas
        </p>
      </div>

      <!-- Erreur -->
      <div v-if="formError" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div class="flex items-center text-red-700 dark:text-red-400">
          <i class="ph ph-warning-circle text-lg mr-2"></i>
          <span class="text-sm">{{ formError }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-2">
        <button
          type="button"
          @click="isOpen = false"
          class="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          :disabled="!canSubmit || isSubmitting"
          class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition flex items-center justify-center gap-2"
        >
          <i v-if="isSubmitting" class="ph ph-spinner animate-spin"></i>
          <i v-else class="ph ph-check"></i>
          <span>{{ isSubmitting ? 'Modification...' : 'Modifier' }}</span>
        </button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const isOpen = defineModel<boolean>({ required: true })

const authStore = useAuthStore()
const { success } = useToast()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const formError = ref('')
const isSubmitting = ref(false)

const canSubmit = computed(() => {
  return currentPassword.value.length > 0
    && newPassword.value.length >= 6
    && confirmPassword.value === newPassword.value
})

const passwordStrength = computed(() => {
  const p = newPassword.value
  if (!p) return 0
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/[0-9]/.test(p) || /[^a-zA-Z0-9]/.test(p)) score++
  return score
})

const strengthColor = computed(() => {
  const colors: Record<number, string> = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-green-500'
  }
  return colors[passwordStrength.value] || 'bg-gray-200'
})

const strengthTextColor = computed(() => {
  const colors: Record<number, string> = {
    1: 'text-red-500',
    2: 'text-orange-500',
    3: 'text-yellow-600 dark:text-yellow-400',
    4: 'text-green-500'
  }
  return colors[passwordStrength.value] || 'text-gray-400'
})

const strengthLabel = computed(() => {
  const labels: Record<number, string> = {
    1: 'Faible',
    2: 'Moyen',
    3: 'Bon',
    4: 'Fort'
  }
  return labels[passwordStrength.value] || ''
})

const resetForm = () => {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  formError.value = ''
  isSubmitting.value = false
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  formError.value = ''
  isSubmitting.value = true

  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    success('Mot de passe modifié avec succès')
    isOpen.value = false
  } catch (err: any) {
    formError.value = err.message || 'Erreur lors du changement de mot de passe'
  } finally {
    isSubmitting.value = false
  }
}

// Reset form when modal opens/closes
watch(isOpen, (val) => {
  if (val) resetForm()
})
</script>
