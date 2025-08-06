<script setup lang="ts">
import ThemeToggle from '../../components/ThemeToggle.vue';
import { ref, computed } from 'vue'
import { apiFetch } from '../../services/api'
import Button from "../../components/Button.vue";
import { useLabsStore } from '../../store/labs'

interface Props {
    lab: any | null
    error: string
    loading: boolean
}

const props = defineProps<Props>()
const labs = useLabsStore()

const tagName = ref('')

const invites = computed(() => {
    if (!props.lab) return []
    return labs.getLab(props.lab.id)?.invites ?? []
})

async function createTag() {
    if (!props.lab) return
    await apiFetch(`/labs/${props.lab.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName.value }),
    })
    tagName.value = ''
}

async function createMockRequest() {
    if (!props.lab) return
    await apiFetch(`/labs/${props.lab.id}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: btoa('mock'), metadata: {}, description: 'Mock request' }),
    })
}


</script>

<template>
    <div class="space-y-4">
        <div v-if="error" class="text-red-600">{{ error }}</div>
        <div v-if="lab">
            <h1 class="text-fg-primary text-2xl font-semibold">{{ lab.name }}</h1>
            <p v-if="lab.description" class="text-fg-secondary">{{ lab.description }}</p>
        </div>
        <div v-else-if="loading" class="text-fg-secondary">Loading...</div>
    </div>

    <!-- Theme Toggle Button -->
    <ThemeToggle class="mt-4" variant="secondary" />

    <!-- Development helpers -->
    <div class="mt-6 space-y-2">
        <h2 class="text-fg-primary font-semibold">Dev Tools</h2>
        <div class="flex gap-2 items-center">
            <input v-model="tagName" placeholder="Tag name"
                class="bg-surface-low px-2 py-1 rounded-md text-fg-primary" />
            <button @click="createTag" class="bg-salem-800 text-white px-2 py-1 rounded-md">Create Tag</button>
        </div>
        <button @click="createMockRequest" class="bg-surface-low px-2 py-1 rounded-md text-fg-primary">Create Mock
            Request</button>
    </div>

    <!-- Debug invites -->
    <div class="mt-6 space-y-2">
        <h2 class="text-fg-primary font-semibold">Invites (debug)</h2>
        <table class="w-full text-sm">
            <thead class="text-fg-secondary">
                <tr>
                    <th class="text-left">Code</th>
                    <th class="text-left">Uses</th>
                    <th class="text-left">Max</th>
                    <th class="text-left">Expires</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="i in invites" :key="i.id" class="text-fg-primary">
                    <td>{{ i.code }}</td>
                    <td>{{ i.uses }}</td>
                    <td>{{ i.max_uses ?? '∞' }}</td>
                    <td>{{ i.expires_at ? new Date(i.expires_at).toLocaleString() : 'never' }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Testing for theme -->
    <div class="flex flex-row gap-2 mt-6">
        <Button v-for="entry in ['surface-lowest', 'surface-low', 'surface', 'surface-high', 'surface-highest']"
            :key="entry" :class="`bg-${entry}`" class="drop-shadow-md">
            <span class=" text-fg-primary"> Foo bar </span>
        </Button>
    </div>

</template>
