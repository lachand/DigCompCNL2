import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueFire, VueFireAuth } from 'vuefire'
import App from './App.vue'
import router from './router'
import { firebaseApp } from './firebase/config'
import { clickAway } from './directives/clickAway'
import './assets/main.css'


const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueFire, {
  firebaseApp,
  modules: [VueFireAuth()]
})

// Register global directives
app.directive('click-away', clickAway)

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[SW] Service Worker registered:', registration)
      })
      .catch(error => {
        console.log('[SW] Service Worker registration failed:', error)
      })
  })
}

app.mount('#app')
