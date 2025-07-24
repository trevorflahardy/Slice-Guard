<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { apiFetch } from '../services/api'

const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  if (!auth.apiKey) {
    const stored = localStorage.getItem('apiKey')
    if (stored) auth.apiKey = stored
  }

  if (!auth.apiKey) {
    router.replace('/login')
    return
  }

  try {
    const res = await apiFetch('/labs')

    if (!res.ok) throw new Error()
    const labs = await res.json()

    if (labs.length > 0) {
      router.replace(`/lab/${labs[0].id}`)
    } else {
      router.replace('/nolabs')
    }
  } catch {
    router.replace('/nolabs')
  }
})
</script>

<template>
  <!--TODO: Very silly loading screen needed-->
  <div class="min-h-screen flex items-center justify-center bg-surface-lowest text-white">Loading...</div>
</template>
