<script setup lang="ts">
import { ref } from 'vue'
import { apiFetch } from '../services/api'

interface Props {
  labId: number
}
const props = defineProps<Props>()
const emit = defineEmits(['close'])

const hours = ref<number | null>(null)
const maxUses = ref<number | null>(null)

async function createInvite() {
  await apiFetch(`/labs/${props.labId}/invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      maxUses: maxUses.value ?? null,
      expiresIn: hours.value != null ? hours.value * 3600 : null,
    }),
  })
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="emit('close')">
      <div class="bg-surface-lowest rounded-xl p-6 w-80 space-y-4">
        <h2 class="text-fg-primary text-lg font-semibold">Create Invite</h2>
        <div class="space-y-1">
          <label class="block text-sm text-fg-secondary">Valid for (hours)</label>
          <input type="number" v-model.number="hours"
            class="w-full bg-surface-low px-2 py-1 rounded-md text-fg-primary" />
        </div>
        <div class="space-y-1">
          <label class="block text-sm text-fg-secondary">Max uses</label>
          <input type="number" v-model.number="maxUses"
            class="w-full bg-surface-low px-2 py-1 rounded-md text-fg-primary" />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button @click="emit('close')" class="px-3 py-1 bg-surface-high rounded-md text-fg-primary">Cancel</button>
          <button @click="createInvite" class="px-3 py-1 bg-salem-800 text-white rounded-md">Create</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
