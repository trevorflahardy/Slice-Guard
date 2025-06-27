import { createApp } from 'vue'
import './styles/main.css'
import App from './App.vue'
import router from './router'
import { tryRefresh } from './services/auth'

tryRefresh().catch(() => {})

createApp(App).use(router).mount('#app')
