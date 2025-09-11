<script setup lang="ts">
import { ref } from 'vue';
import { apiFetch } from '../services/api';

/** Props for {@link CreateInviteModal}. */
interface Props {
    /** ID of the lab to create the invite for. */
    labId: number;
}
const props = defineProps<Props>();
const emit = defineEmits(['close']);

const hours = ref<number | null>(null);
const maxUses = ref<number | null>(null);

/** Submit the invite creation request to the backend. */
async function createInvite(): Promise<void> {
    await apiFetch(`/labs/${props.labId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            maxUses: maxUses.value ?? null,
            expiresIn: hours.value !== null ? hours.value * 3600 : null,
        }),
    });
    emit('close');
}
</script>

<template>
    <Teleport to="body">
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            @click.self="emit('close')"
        >
            <div class="bg-surface-lowest w-80 space-y-4 rounded-xl p-6">
                <h2 class="text-fg-primary text-lg font-semibold">Create Invite</h2>
                <div class="space-y-1">
                    <label class="text-fg-secondary block text-sm">Valid for (hours)</label>
                    <input
                        v-model.number="hours"
                        type="number"
                        class="bg-surface-low text-fg-primary w-full rounded-md px-2 py-1"
                    />
                </div>
                <div class="space-y-1">
                    <label class="text-fg-secondary block text-sm">Max uses</label>
                    <input
                        v-model.number="maxUses"
                        type="number"
                        class="bg-surface-low text-fg-primary w-full rounded-md px-2 py-1"
                    />
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <button
                        class="bg-surface-high text-fg-primary rounded-md px-3 py-1"
                        @click="emit('close')"
                    >
                        Cancel
                    </button>
                    <button
                        class="bg-salem-800 rounded-md px-3 py-1 text-white"
                        @click="createInvite"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
