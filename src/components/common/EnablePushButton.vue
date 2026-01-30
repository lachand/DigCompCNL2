<template>
  <div class="flex flex-col items-end gap-2">
    <button
      @click="subscribePush"
      class="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60"
      :disabled="loading"
    >
      <span v-if="loading">Chargement du service de notifications...</span>
      <span v-else>Activer les notifications</span>
    </button>
    <span v-if="error" class="text-sm text-red-500">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const loading = ref(true)
const error = ref('')

onMounted(() => {
  // Vérifie si le SDK est prêt toutes les 300ms
  const interval = setInterval(() => {
    // @ts-ignore
    if (window.OneSignal && window.OneSignal.User && window.OneSignal.User.Push) {
      loading.value = false
      clearInterval(interval)
    }
  }, 300)
  setTimeout(() => {
    if (loading.value) {
      error.value = 'Le service de notifications est long à charger ou indisponible.'
      loading.value = false
    }
  }, 8000)
})

function subscribePush() {
  error.value = ''
  // @ts-ignore
  if (window.OneSignal && window.OneSignal.User && window.OneSignal.User.Push) {
    // @ts-ignore
    window.OneSignal.User.Push.subscribe();
  } else if (window.OneSignalDeferred) {
    // @ts-ignore
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.User.Push.subscribe();
    });
    error.value = 'Le service de notifications n\'est pas encore prêt. Réessayez dans quelques secondes.'
  } else {
    error.value = 'Le service de notifications n\'est pas disponible.'
  }
}
</script>
