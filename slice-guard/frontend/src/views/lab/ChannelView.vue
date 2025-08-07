<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useLabsStore } from '../../store/labs';
import { apiFetch } from '../../services/api';
import type { Message } from '@shared/db/message';
import type { MessageCreatePayload } from '@shared/payloads';

const route = useRoute();
const labs = useLabsStore();
const channelId = computed(() => Number(route.params.channelId));
// const channel = computed(() => labs.getChannel(channelId.value))
// const labId = computed(() => channel.value?.lab_id ?? null)

const messages = computed(() => labs.getMessages(channelId.value));
const content = ref('');
const loadingMore = ref(false);

async function ensureHistory() {
    if (labs.hasMessages(channelId.value)) {
        return;
    }
    const res = await apiFetch(`/channels/${channelId.value}/messages?limit=50`);
    if (res.ok) {
        const data: Message[] = await res.json();
        console.log(data);
        labs.setMessages(channelId.value, data);
    }
}

async function loadMore() {
    if (loadingMore.value) {
        return;
    }
    loadingMore.value = true;
    const first = messages.value[0];
    const before = first ? `&before=${first.id}` : '';
    const res = await apiFetch(`/channels/${channelId.value}/messages?limit=50${before}`);
    if (res.ok) {
        const data: Message[] = await res.json();
        labs.setMessages(channelId.value, [...data, ...(messages.value || [])]);
    }
    loadingMore.value = false;
}

async function send() {
    if (!content.value.trim()) {
        return;
    }
    const payload: MessageCreatePayload = { content: content.value };
    content.value = '';
    await apiFetch(`/channels/${channelId.value}/messages`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
    });
}

onMounted(() => {
    ensureHistory();
});
</script>

<template>
    <div class="flex h-full flex-col">
        <div class="flex-1 space-y-2 overflow-y-auto">
            <button
                v-if="!loadingMore"
                class="text-fg-secondary text-xs"
                @click="loadMore"
            >
                Load Older
            </button>

            <div
                v-for="m in messages"
                :key="m.id"
                class="hover:bg-surface-low rounded p-1"
            >
                <span class="text-fg-secondary mr-2 text-sm">{{ m.user_id }}</span>
                <span class="text-fg-primary text-sm whitespace-pre-wrap">{{ m.content }}</span>
            </div>
        </div>

        <form
            class="mt-2 flex"
            @submit.prevent="send"
        >
            <input
                v-model="content"
                placeholder="Message"
                class="bg-surface-low text-fg-primary flex-1 rounded-l px-2 py-1 outline-none"
            />
            <button
                type="submit"
                class="bg-accent rounded-r px-3 py-1 text-white"
            >
                Send
            </button>
        </form>
    </div>
</template>
