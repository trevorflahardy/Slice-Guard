<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiFetch } from '../services/api';
import { useLabsStore } from '../store/labs';
import type { LabState } from '@shared/payloads/ws';
import Button from '../components/Button.vue';

const emit = defineEmits(['close']);
const code = ref('');
const status = ref<'idle' | 'invalid'>('idle');
const router = useRouter();
const labs = useLabsStore();

async function join() {
    status.value = 'idle';
    try {
        const res = await apiFetch(`/invites/${code.value}`, { method: 'POST' });
        if (!res.ok) {
            throw new Error();
        }
        const { lab } = (await res.json()) as { lab: LabState };
        labs.addLab(lab);
        router.push(`/lab/${lab.lab.id}`);
        emit('close');
    } catch {
        status.value = 'invalid';
    }
}
</script>

<template>
    <Teleport to="body">
        <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 shadow-xl backdrop-blur-sm"
            @click.self="emit('close')"
        >
            <div class="bg-surface-lowest w-80 rounded-2xl p-6">
                <h2 class="text-fg-primary mb-3 text-lg font-semibold">Join a Lab</h2>

                <input
                    v-model="code"
                    type="text"
                    placeholder="Invite Code"
                    class="bg-surface-low text-fg-primary w-full rounded-lg p-2 shadow-md"
                    @keyup.enter="join"
                />

                <p
                    v-if="status === 'invalid'"
                    class="mt-1 text-sm text-red-500"
                >
                    Invalid code
                </p>

                <div class="mt-4 flex justify-end gap-2">
                    <Button
                        variant="secondary"
                        @click="emit('close')"
                        >Cancel</Button
                    >
                    <Button
                        variant="primary"
                        @click="join"
                        >Join</Button
                    >
                </div>
            </div>
        </div>
    </Teleport>
</template>
