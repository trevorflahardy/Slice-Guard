<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '../components/Button.vue';
import { apiFetch } from '../services/api';

const name = ref('');
const description = ref('');
const iconUrl = ref('');
const error = ref('');
const router = useRouter();

async function submit() {
    error.value = '';
    try {
        const res = await apiFetch('/labs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name.value,
                description: description.value || undefined,
                iconUrl: iconUrl.value || undefined,
            }),
        });
        if (!res.ok) {
            throw new Error();
        }
        const lab = await res.json();
        router.push(`/lab/${lab.id}`);
    } catch (e: any) {
        error.value = e.message ?? 'Failed to create lab';
    }
}
</script>

<template>
    <div class="bg-surface-lowest flex min-h-screen flex-col items-center justify-start text-white">
        <h1 class="mt-10 mb-6 text-3xl font-semibold text-black">Create a Lab</h1>

        <form
            class="flex w-full max-w-md flex-col gap-3 text-sm"
            @submit.prevent="submit"
        >
            <input
                v-model="name"
                type="text"
                placeholder="Name"
                required
                class="bg-surface-low focus:outline-salem-800 placeholder-fg-secondary w-full rounded-xl px-5 py-3 shadow-md"
            />
            <input
                v-model="description"
                type="text"
                placeholder="Description"
                class="bg-surface-low focus:outline-salem-800 placeholder-fg-secondary w-full rounded-xl px-5 py-3 shadow-md"
            />
            <input
                v-model="iconUrl"
                type="url"
                placeholder="Icon URL"
                class="bg-surface-low focus:outline-salem-800 placeholder-fg-secondary w-full rounded-xl px-5 py-3 shadow-md"
            />
            <p
                v-if="error"
                class="px-1 text-red-600"
            >
                {{ error }}
            </p>

            <Button
                variant="primary"
                class="mt-2 py-2"
                >Create Lab</Button
            >
        </form>
    </div>
</template>
