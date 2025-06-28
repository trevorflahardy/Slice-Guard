import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/main.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './store/auth'
import { ws } from './services/ws'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
const auth = useAuthStore()
if (auth.apiKey) ws.connect(auth.apiKey)
app.use(router).mount('#app')
