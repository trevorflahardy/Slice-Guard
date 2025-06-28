<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from '../components/Button.vue'
import { authorizedFetch } from '../services/auth'

const name = ref('')
const description = ref('')
const imageUrl = ref('')
const error = ref('')
const router = useRouter()

async function submit() {
  error.value = ''
  try {
    const res = await authorizedFetch('/labs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.value, description: description.value || undefined, imageUrl: imageUrl.value || undefined }),
    })
    if (!res.ok) throw new Error()
    const lab = await res.json()
    router.push(`/lab/${lab.id}`)
  } catch (e: any) {
    error.value = e.message ?? 'Failed to create lab'
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-start bg-background text-foreground">
    <h1 class="text-3xl font-semibold mt-10 mb-6 text-black">Create a Lab</h1>
    <form @submit.prevent="submit" class="flex flex-col gap-3 w-full max-w-md text-sm text-gray-400">
      <input v-model="name" type="text" placeholder="Name" required
        class="bg-foreground shadow-md py-3 px-5 rounded-xl w-full focus:outline-main" />
      <input v-model="description" type="text" placeholder="Description"
        class="bg-foreground shadow-md py-3 px-5 rounded-xl w-full focus:outline-main" />
      <input v-model="imageUrl" type="url" placeholder="Image URL"
        class="bg-foreground shadow-md py-3 px-5 rounded-xl w-full focus:outline-main" />
      <p v-if="error" class="text-red-600 px-1">{{ error }}</p>
      <Button variant="primary" class="mt-2 py-2">Create Lab</Button>
    </form>
  </div>
</template>
