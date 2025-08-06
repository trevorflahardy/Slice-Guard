<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { useLabsStore } from '../store/labs'

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

  const labsStore = useLabsStore()
  watch(
    () => labsStore.labs,
    (labs) => {
      if (labs.length > 0) router.replace(`/lab/${labs[0].lab.id}`)
      else router.replace('/nolabs')
    },
    { immediate: true }
  )
})
</script>

<template>
  <!--TODO: Very silly loading screen needed-->
  <div class="min-h-screen flex items-center justify-center bg-surface-lowest text-white">Loading...</div>
</template>
