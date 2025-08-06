import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/main.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './store/auth'
import { ws } from './services/ws'
import { useLabsStore } from './store/labs'
import { WsEvent } from '@shared/payloads/ws'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
const auth = useAuthStore()
const labs = useLabsStore()

ws.addListener(WsEvent.HELLO, ({ labs: labStates }) => labs.setInitial(labStates))
ws.addListener(WsEvent.REQUEST_CREATED, d => labs.addRequest(d.request.lab_id, d))
ws.addListener(WsEvent.REQUEST_UPDATED, d => labs.updateRequest(d.request.lab_id, d))
ws.addListener(WsEvent.REQUEST_DELETED, d => labs.removeRequest(d.labId, d.requestId))
ws.addListener(WsEvent.TAG_CREATED, ({ tag }) => labs.addTag(tag.lab_id, tag))
ws.addListener(WsEvent.TAG_UPDATED, ({ tag }) => labs.updateTag(tag.lab_id, tag))
ws.addListener(WsEvent.TAG_DELETED, ({ labId, tagId }) => labs.removeTag(labId, tagId))
ws.addListener(WsEvent.MEMBER_JOINED, d => labs.addMember(d.labId, d))
ws.addListener(WsEvent.MEMBER_LEFT, d => labs.removeMember(d.labId, d.userId))

if (auth.apiKey) ws.connect(auth.apiKey)
app.use(router).mount('#app')
