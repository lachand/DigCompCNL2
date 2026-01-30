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

app.mount('#app')
