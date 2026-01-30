<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm flex flex-col items-center">
      <div class="text-4xl mb-2">📲</div>
      <h2 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">Installer DigComp 3.0</h2>
      <p class="text-gray-700 dark:text-gray-300 mb-4 text-center">Ajoutez l'application à votre écran d'accueil pour une expérience optimale, même hors ligne.</p>
      <button @click="install" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition mb-2">Installer</button>
      <button @click="close" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">Plus tard</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const visible = ref(false)
let deferredPrompt: any = null

function show() {
  visible.value = true
}
function close() {
  visible.value = false
}
function install() {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(() => {
      close()
      deferredPrompt = null
    })
  }
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault()
    deferredPrompt = e
    show()
  })
})
</script>

<style scoped>
/* Simple modal styles */
</style>
