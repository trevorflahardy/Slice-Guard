<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLabsStore } from '../../../store/labs';
import { apiFetch } from '../../../services/api';
import type { Message } from '@shared/db/message';
import type { MessageCreatePayload } from '@shared/payloads';

import ChannelMessage from '../../../components/channels/ChannelMessage.vue';

const route = useRoute();
const labs = useLabsStore();
const channelId = computed(() => Number(route.params.channelId));

const messages = computed(() => labs.getMessages(channelId.value) || []);

const content = ref('');
const loadingMore = ref(false);
const messagesContainer = ref<HTMLElement>();
const wasAtBottom = ref(true);

// Check if user is scrolled to bottom
function checkScrollPosition() {
    if (!messagesContainer.value) {
        return;
    }
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
    wasAtBottom.value = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
}

// Scroll to bottom
async function scrollToBottom(smooth = false) {
    await nextTick();
    if (!messagesContainer.value) {
        return;
    }

    messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant',
    });
}

// Auto-scroll to bottom when new messages arrive (only if user was at bottom)
watch(messages, async (newMessages, oldMessages) => {
    if (newMessages.length > (oldMessages?.length || 0) && wasAtBottom.value) {
        await scrollToBottom(true);
    }
});

async function ensureHistory() {
    if (labs.hasMessages(channelId.value)) {
        return;
    }
    const res = await apiFetch(`/channels/${channelId.value}/messages?limit=50`);
    if (res.ok) {
        const messages: Message[] = await res.json();
        console.log(messages);
        labs.setMessages(channelId.value, messages);
        // Scroll to bottom after loading initial messages
        await scrollToBottom();
    }
}

async function loadMore() {
    if (loadingMore.value) {
        return;
    }
    loadingMore.value = true;

    // Get the oldest message (first in the original array)
    const oldest = messages.value[0];
    const before = oldest ? `&before=${oldest.id}` : '';
    const res = await apiFetch(`/channels/${channelId.value}/messages?limit=50${before}`);

    if (res.ok) {
        const data: { messages: Message[] } = await res.json();
        // Store current scroll position
        const container = messagesContainer.value;
        const previousScrollHeight = container?.scrollHeight || 0;

        // Prepend older messages to maintain chronological order
        labs.setMessages(channelId.value, [...data.messages, ...messages.value]);

        // Restore scroll position (prevent jumping)
        await nextTick();
        if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - previousScrollHeight;
        }
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

    // Scroll to bottom after sending
    wasAtBottom.value = true;
    await scrollToBottom(true);
}

onMounted(() => {
    ensureHistory();
});
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- Messages container with scroll handling -->
        <div
            ref="messagesContainer"
            class="flex-1 space-y-2 overflow-y-auto px-2 py-2"
            @scroll="checkScrollPosition"
        >
            <!-- Load more button at TOP -->
            <button
                v-if="!loadingMore && messages.length > 0"
                class="text-fg-secondary hover:text-fg-primary w-full py-2 text-xs transition-colors"
                @click="loadMore"
            >
                Load Older Messages
            </button>

            <div
                v-if="loadingMore"
                class="text-fg-secondary py-2 text-center text-xs"
            >
                Loading...
            </div>

            <!-- Messages displayed in chronological order (oldest to newest) -->
            <div
                v-for="m in messages"
                :key="m.id"
                class="hover:bg-surface-low rounded p-2 transition-colors"
            >
                <ChannelMessage
                    :message="m"
                    :author="null"
                >
                </ChannelMessage>
                <div class="flex items-baseline gap-2">
                    <span class="text-fg-secondary text-xs font-medium">
                        User {{ m.user_id }}
                    </span>
                    <span class="text-fg-tertiary text-xs">
                        {{ new Date(m.created_at).toLocaleTimeString() }}
                    </span>
                </div>
                <div class="text-fg-primary mt-1 text-sm whitespace-pre-wrap">
                    {{ m.content }}
                </div>
            </div>

            <!-- Empty state -->
            <div
                v-if="messages.length === 0"
                class="text-fg-secondary py-8 text-center text-sm"
            >
                No messages yet. Be the first to say something!
            </div>
        </div>

        <!-- Message input -->
        <form
            class="mx-2 mt-2 mb-2 flex"
            @submit.prevent="send"
        >
            <input
                v-model="content"
                placeholder="Type a message..."
                class="bg-surface-low text-fg-primary border-surface focus:border-surface-high flex-1 rounded-xl border px-3 py-2 shadow-md transition-colors outline-none"
            />
        </form>

        <!-- Scroll to bottom button (appears when not at bottom) -->
        <Transition name="fade">
            <button
                v-if="!wasAtBottom && messages.length > 0"
                class="bg-accent hover:bg-accent/80 absolute right-4 bottom-20 rounded-full p-2 text-white shadow-lg transition-all"
                @click="scrollToBottom(true)"
            >
                <svg
                    class="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                    />
                </svg>
            </button>
        </Transition>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}
</style>
