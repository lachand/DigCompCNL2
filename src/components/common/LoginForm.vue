<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <!-- Logo & Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
          <i class="ph ph-graduation-cap text-3xl text-white"></i>
        </div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">DigComp 3.0</h1>
        <p class="text-gray-600 dark:text-gray-400">Plateforme de gestion pédagogique</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <i class="ph ph-envelope mr-2"></i>
            Email
          </label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="votre@email.fr"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <!-- Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <i class="ph ph-lock mr-2"></i>
            Mot de passe
          </label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <!-- Error Message -->
        <div v-if="authStore.error" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div class="flex items-center text-red-700 dark:text-red-400">
            <i class="ph ph-warning-circle text-xl mr-2"></i>
            <span class="text-sm">{{ authStore.error }}</span>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          <i v-if="!authStore.loading" class="ph ph-sign-in"></i>
          <i v-else class="ph ph-spinner animate-spin"></i>
          <span>{{ authStore.loading ? 'Connexion...' : 'Se connecter' }}</span>
        </button>
      </form>

      <!-- Info -->
      <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p class="text-sm text-blue-800 dark:text-blue-300 text-center">
          <i class="ph ph-info mr-1"></i>
          Utilisez vos identifiants universitaires
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value)
  } catch (error) {
    // Error is already set in the store
  }
}
</script>
