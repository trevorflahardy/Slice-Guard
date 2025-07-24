<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { authorizedFetch } from '../../services/auth'
import type { PrintRequest, RequestTag } from '@shared/db/request'
import type { User } from '@shared/db/user'

interface RequestItem {
  request: PrintRequest
  user: User | null
  tags: RequestTag[]
}

const route = useRoute()
const labId = computed(() => Number(route.params.id))

const requests = ref<RequestItem[]>([])
const tags = ref<RequestTag[]>([])

const search = ref('')
const tagFilter = ref<number | null>(null)
const from = ref('')
const to = ref('')

async function fetchRequests() {
  const res = await authorizedFetch(`/labs/${labId.value}/requests`)
  if (res.ok) requests.value = await res.json()
}

async function fetchTags() {
  const res = await authorizedFetch(`/labs/${labId.value}/tags`)
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
    .sort((a, b) => new Date(b.request.created_at).getTime() - new Date(a.request.created_at).getTime())
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap gap-2 items-center">
      <input v-model="search" placeholder="Search" class="bg-surface-low px-2 py-1 rounded-md" />
      <select v-model.number="tagFilter" class="bg-surface-low px-2 py-1 rounded-md">
        <option :value="null">All Tags</option>
        <option v-for="t in tags" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
      <input type="date" v-model="from" class="bg-surface-low px-2 py-1 rounded-md" />
      <input type="date" v-model="to" class="bg-surface-low px-2 py-1 rounded-md" />
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
      </div>
    </div>
  </div>
</template>