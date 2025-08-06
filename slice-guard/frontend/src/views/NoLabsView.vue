<script setup lang="ts">
import Button from '../components/Button.vue'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { apiFetch } from '../services/api'
import { useLabsStore } from '../store/labs'
import type { LabState } from '@shared/payloads/ws'

const router = useRouter()
const showJoin = ref(false)
const code = ref('')
const status = ref<'idle' | 'valid' | 'invalid'>('idle')
const labs = useLabsStore()

async function join() {
  status.value = 'idle'
  try {
    const res = await apiFetch(`/invites/${code.value}`, { method: 'POST' })
    if (!res.ok) throw new Error()
    const { lab } = await res.json() as { lab: LabState }
    labs.addLab(lab)
    status.value = 'valid'
    router.push(`/lab/${lab.lab.id}`)
  } catch {
    status.value = 'invalid'
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-surface-lowest text-white">
    <h1 class="text-3xl font-semibold mb-4 text-black">Welcome to Slice Guard</h1>
    <p class="text-fg-secondary mb-6">You are not a member of any labs yet.</p>
    <Button variant="primary" @click="router.push('/lab/create')">Create a Lab</Button>
    <Button v-if="!showJoin" variant="secondary" class="mt-3" @click="showJoin = true">Join a Lab</Button>
    <div v-else class="mt-4 flex flex-col items-center gap-2 w-full max-w-xs">
      <input
        v-model="code"
        type="text"
        placeholder="Invite Code"
        @input="status = 'idle'"
        @keyup.enter="join"
        class="bg-surface-low shadow-md py-3 px-5 rounded-xl w-full focus:outline-none placeholder-fg-secondary"
        :class="status === 'invalid' ? 'outline outline-2 outline-red-600' : status === 'valid' ? 'outline outline-2 outline-green-600' : 'outline outline-2 outline-transparent'"
      />
      <Button variant="primary" class="w-full" @click="join">Join</Button>
    </div>
  </div>
</template>
