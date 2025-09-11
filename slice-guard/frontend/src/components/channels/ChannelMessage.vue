<script setup lang="ts">
import { computedAsync } from '@vueuse/core';

import type { Message } from '@shared/db/message';
import type { User } from '@shared/db/user';

import { apiFetch } from '../../services/api';
import { useLabsStore } from '../../store/labs';
import UserAvatar from '../UserAvatar.vue';

/** Props for {@link ChannelMessage}. */
export interface ChannelMessageProps {
    /** Message record to display. */
    message: Message;
    /** Optional author; fetched if not provided. */
    author: User | null;
}

const props = defineProps<ChannelMessageProps>();
const labStore = useLabsStore();

/**
 * Resolve the message author, fetching the user if necessary.
 */
async function resolveAuthor(): Promise<User | null> {
    if (props.author) {
        return props.author;
    }

    const authorId = props.message.user_id;
    const res = await apiFetch(`/users/${authorId}`);
    if (!res.ok) {
        console.error('[labs] fetchUser failed', res);
        return null;
    }

    const fetched: User = await res.json();
    // Store fetched user so future lookups can reuse it.
    labStore.addUser(fetched);
    return fetched;
}

const author = computedAsync<User | null>(resolveAuthor, null);
</script>

<template>
    <div
        class="hover:bg-surface-low mb-2 flex items-start gap-2 rounded-xl p-2 transition-colors duration-0 ease-out"
    >
        <div class="flex flex-row items-start justify-center gap-2">
            <!-- The user's avatar off to the left -->
            <UserAvatar
                v-if="author"
                :user="author"
                size="size-8"
            />

            <div>
                <!-- Their name and when the message was created off to the right next to each other -->
                <div class="flex flex-row items-center justify-start gap-2">
                    <div
                        v-if="author"
                        class="text-fg-primary text-left text-sm"
                    >
                        {{ author.name || 'User ' + author.id }}
                    </div>
                    <!-- Show the date and the time it was created-->
                    <div class="text-fg-tertiary text-left text-xs">
                        {{ new Date(message.created_at).toLocaleDateString() }}
                        {{ new Date(message.created_at).toLocaleTimeString() }}
                    </div>
                </div>

                <!-- And below that goes the message content -->
                <div class="text-fg-primary text-left text-sm">
                    {{ message.content }}
                </div>
            </div>
        </div>
    </div>
</template>
