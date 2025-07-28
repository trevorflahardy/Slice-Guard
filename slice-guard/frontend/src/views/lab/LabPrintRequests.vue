<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../../services/api'
import type { PrintRequest, RequestTag } from '@shared/db/request'
import type { User } from '@shared/db/user'
import { useAuthStore } from '../../store/auth'

interface RequestItem {
  request: PrintRequest
  user: User | null
  tags: RequestTag[]
}

const route = useRoute()
const labId = computed(() => Number(route.params.id))

const requests = ref<RequestItem[]>([])
const tags = ref<RequestTag[]>([])
const auth = useAuthStore()

const search = ref('')
const tagFilter = ref<number | null>(null)
const from = ref('')
const to = ref('')
const stateFilter = ref<'all' | 'open' | 'closed'>('all')

async function fetchRequests() {
  const q = stateFilter.value === 'all' ? '' : `?state=${stateFilter.value}`
  const res = await apiFetch(`/labs/${labId.value}/requests${q}`)
  if (res.ok) requests.value = await res.json()
}

async function fetchTags() {
  const res = await apiFetch(`/labs/${labId.value}/tags`)
  if (res.ok) tags.value = await res.json()
}

onMounted(() => {
  fetchRequests()
  fetchTags()
})
watch(labId, () => {
  fetchRequests()
  fetchTags()
})
watch(stateFilter, fetchRequests)

const filtered = computed(() => {
  return requests.value
    .filter(r =>
      !search.value ||
      r.request.description?.toLowerCase().includes(search.value.toLowerCase()) ||
      r.user?.name?.toLowerCase().includes(search.value.toLowerCase())
    )
    .filter(r => !tagFilter.value || r.tags.some(t => t.id === tagFilter.value))
    .filter(r => {
      if (from.value && new Date(r.request.created_at) < new Date(from.value)) return false
      if (to.value && new Date(r.request.created_at) > new Date(to.value)) return false
      return true
    })
    .filter(r => {
      if (stateFilter.value === 'open') return !r.request.is_closed
      if (stateFilter.value === 'closed') return r.request.is_closed
      return true
    })
    .sort((a, b) => {
      if (a.request.is_closed !== b.request.is_closed) return a.request.is_closed ? 1 : -1
      return new Date(b.request.created_at).getTime() - new Date(a.request.created_at).getTime()
    })
})

async function toggleState(item: RequestItem) {
  const res = await apiFetch(`/labs/${labId.value}/requests/${item.request.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isClosed: !item.request.is_closed })
  })
  if (res.ok) {
    item.request.is_closed = !item.request.is_closed
  }
}

const selectClass = "bg-surface-low px-2 py-1 rounded-md text-fg-primary"
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-fg-primary text-2xl font-semibold">Print Requests</h1>
      <p class="text-fg-secondary">Manage and track all print requests.</p>
    </div>

    <!-- The search bar. Spans the entire width of the element and allows you to easily search many things -->
    <div class="w-full bg-surface-low rounded-lg px-3 py-2 flex items-center gap-2">
      <svg class="h-5 w-5 text-fg-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>

      <input
        v-model="search"
        placeholder="Search requests, users, descriptions..."
        class="flex-1 bg-transparent text-fg-primary placeholder-fg-secondary outline-none"
      />
    </div>

    <div class="flex flex-wrap gap-2 items-center">

      <select v-model.number="tagFilter" :class="selectClass">
        <option :value="null">All Tags</option>
        <option v-for="t in tags" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>

      <input type="date" v-model="from" :class="selectClass" />
      <input type="date" v-model="to" :class="selectClass" />

      <select v-model="stateFilter" :class="selectClass">
        <option value="all">All</option>
        <option value="open">Open</option>
        <option value="closed">Closed</option>
      </select>
    </div>
    <div class="space-y-2">
      <div
        v-for="item in filtered"
        :key="item.request.id"
        class="bg-surface shadow px-4 py-2 rounded-lg cursor-pointer hover:shadow-md"
      >
        <div class="text-sm font-medium text-fg-primary">{{ item.user?.name || item.user?.email }}</div>
        <div class="text-xs text-fg-secondary">{{ item.request.description }}</div>
        <div class="text-xs text-fg-tertiary">{{ new Date(item.request.created_at).toLocaleString() }}</div>
        <button
          v-if="auth.user?.id === item.request.user_id"
          @click.stop="toggleState(item)"
          class="text-xs text-salem-800 underline"
        >
          {{ item.request.is_closed ? 'Reopen' : 'Close' }}
        </button>
      </div>
    </div>
  </div>
</template>