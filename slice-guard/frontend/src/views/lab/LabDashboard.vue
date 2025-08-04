<script setup lang="ts">
import ThemeToggle from '../../components/ThemeToggle.vue';
import { ref } from 'vue'
import { apiFetch } from '../../services/api'
import Button from "../../components/Button.vue";

interface Props {
    lab: any | null
    error: string
    loading: boolean
}

const props = defineProps<Props>()

const tagName = ref('')

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

    <!-- Testing for theme -->
    <div class="flex flex-row gap-2 mt-6">
        <Button v-for="entry in ['surface-lowest', 'surface-low', 'surface', 'surface-high', 'surface-highest']"
            :key="entry" :class="`bg-${entry}`" class="drop-shadow-md">
            <span class=" text-fg-primary"> Foo bar </span>
        </Button>
    </div>

</template>
