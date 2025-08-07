<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLabsStore } from '../../store/labs'
import { apiFetch } from '../../services/api'
import type { Message } from '@shared/db/message'
import type { MessageCreatePayload } from '@shared/payloads'

const route = useRoute()
const labs = useLabsStore()
const channelId = computed(() => Number(route.params.channelId))
const channel = computed(() => labs.getChannel(channelId.value))
const labId = computed(() => channel.value?.lab_id ?? null)

const messages = computed(() => labs.getMessages(channelId.value))
const content = ref('')
const loadingMore = ref(false)

async function ensureHistory() {
  if (labs.hasMessages(channelId.value)) return
  const res = await apiFetch(`/channels/${channelId.value}/messages?limit=50`)
  if (res.ok) {
    const data: Message[] = await res.json()
    labs.setMessages(channelId.value, data)
  }
}

async function loadMore() {
  if (loadingMore.value) return
  loadingMore.value = true
  const first = messages.value[0]
  const before = first ? `&before=${first.id}` : ''
  const res = await apiFetch(`/channels/${channelId.value}/messages?limit=50${before}`)
  if (res.ok) {
    const data: Message[] = await res.json()
    labs.setMessages(channelId.value, [...data, ...messages.value])
  }
  loadingMore.value = false
}

async function send() {
  if (!content.value.trim()) return
  const payload: MessageCreatePayload = { content: content.value }
  content.value = ''
  await apiFetch(`/channels/${channelId.value}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' }
  })
}

onMounted(() => {
  ensureHistory()
})
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="flex-1 overflow-y-auto space-y-2">
      <button v-if="!loadingMore" class="text-xs text-fg-secondary" @click="loadMore">Load Older</button>
      <div v-for="m in messages" :key="m.id" class="p-1 rounded hover:bg-surface-low">
        <span class="text-sm text-fg-secondary mr-2">{{ m.user_id }}</span>
        <span class="text-sm text-fg-primary whitespace-pre-wrap">{{ m.content }}</span>
      </div>
    </div>
    <form class="mt-2 flex" @submit.prevent="send">
      <input v-model="content" placeholder="Message" class="flex-1 bg-surface-low rounded-l px-2 py-1 text-fg-primary outline-none" />
      <button type="submit" class="px-3 py-1 bg-accent text-white rounded-r">Send</button>
    </form>
  </div>
</template>
