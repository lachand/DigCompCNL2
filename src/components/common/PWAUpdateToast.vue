<template>
  <div v-if="visible" class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
    <span>Nouvelle version disponible&nbsp;!</span>
    <button @click="refresh" class="ml-4 px-3 py-1 bg-white text-indigo-600 rounded font-semibold hover:bg-gray-100 transition">Mettre à jour</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const visible = ref(false)
function refresh() {
  window.location.reload()
}
onMounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      visible.value = true
    })
  }
})
</script>

<style scoped>
</style>
