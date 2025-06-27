<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authState, authorizedFetch } from '../services/auth'

const router = useRouter()

onMounted(async () => {
  if (!authState.apiKey) {
    router.replace('/login')
    return
  }
  try {
    const res = await authorizedFetch('/labs')
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
  <div class="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>
</template>
