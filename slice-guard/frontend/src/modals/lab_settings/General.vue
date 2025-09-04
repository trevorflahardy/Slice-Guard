<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { apiFetch } from '../../services/api';
import { useLabsStore } from '../../store/labs';
import Button from '../../components/Button.vue';

const labs = useLabsStore();
const route = useRoute();

const labId = Number(route.params.id);
const lab = labs.getLab(labId);
const name = ref(lab?.name || '');
const description = ref(lab?.description || '');
const iconUrl = ref(lab?.icon_url || '');

async function save() {
    await apiFetch(`/labs/${labId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name.value,
            description: description.value || null,
            iconUrl: iconUrl.value || undefined,
        }),
    });
}

async function handleFile(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
        return;
    }
    const form = new FormData();
    form.append('file', file);
    const res = await apiFetch(`/labs/${labId}/icon`, { method: 'POST', body: form });
    if (res.ok) {
        const updated = await res.json();
        labs.updateLab(updated);
        iconUrl.value = updated.icon_url || '';
    }
}
</script>
<template>
    <div class="flex flex-col gap-4">
        <label class="flex flex-col gap-1">
            <h2 class="text-fg-primary font-semibold">Name</h2>
            <input
                v-model="name"
                class="bg-surface text-fg-secondary rounded p-2"
            />
        </label>
        <label class="flex flex-col gap-1">
            <h2 class="text-fg-primary font-semibold">Description</h2>
            <textarea
                v-model="description"
                class="bg-surface text-fg-secondary rounded p-2"
            />
        </label>
        <div class="flex items-center gap-4">
            <img
                v-if="iconUrl"
                :src="iconUrl"
                class="h-16 w-16 rounded-full object-cover"
            />
            <div
                v-else
                class="bg-surface-high text-fg-primary flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
            >
                {{ name.charAt(0) }}
            </div>

            <input
                type="file"
                class="text-fg-secondary"
                @change="handleFile"
            />
        </div>
        <Button
            variant="primary"
            class="w-32"
            @click="save"
            >Save</Button
        >
    </div>
</template>
