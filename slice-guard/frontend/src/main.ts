import { createApp } from 'vue'
import './styles/main.css'
import App from './App.vue'
import router from './router'
import { authState } from './services/auth'
import { ws } from './services/ws'

if (authState.apiKey) ws.connect(authState.apiKey)

createApp(App).use(router).mount('#app')
