<script setup lang="ts">
import { computed } from 'vue';
import { computedAsync } from '@vueuse/core';

import type { Message } from '@shared/db/message';
import type { User } from '@shared/db/user';

import { apiFetch } from '../../services/api';
import { useLabsStore } from '../../store/labs';
import { useUiStore } from '../../store/ui';
import UserAvatar from '../UserAvatar.vue';

/** Props for {@link ChannelMessage}. */
export interface ChannelMessageProps {
    /** Message record to display. */
    message: Message;
    /** Optional author; fetched if not provided. */
    author: User | null;
    /** Lab context for opening a profile modal. */
    labId?: number | null;
}

const props = defineProps<ChannelMessageProps>();
const labStore = useLabsStore();
const ui = useUiStore();

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

const resolvedAuthor = computedAsync<User | null>(resolveAuthor, null);

const canOpenProfile = computed(() => props.labId !== null && props.labId !== undefined);

function openProfile(): void {
    if (props.labId === null || props.labId === undefined) {
        return;
    }
    ui.openUserProfile({ labId: props.labId, userId: props.message.user_id });
}
</script>

<template>
    <div
        class="hover:bg-surface-low mb-2 flex items-start gap-2 rounded-xl p-2 transition-colors duration-0 ease-out"
    >
        <div class="flex flex-row items-start justify-center gap-2">
            <!-- The user's avatar off to the left -->
            <button
                type="button"
                class="focus-visible:outline-accent/80 rounded-full focus-visible:outline focus-visible:outline-2 disabled:cursor-default"
                :class="canOpenProfile ? 'cursor-pointer' : 'cursor-default'"
                :disabled="!canOpenProfile"
                @click="openProfile"
            >
                <UserAvatar
                    v-if="resolvedAuthor"
                    :user="resolvedAuthor"
                    size="size-8"
                />
                <div
                    v-else
                    class="h-8 w-8 rounded-full bg-gray-600"
                />
            </button>

            <div class="min-w-0 flex-1">
                <!-- Their name and when the message was created off to the right next to each other -->
                <div class="flex flex-row items-center justify-start gap-2">
                    <button
                        v-if="resolvedAuthor"
                        type="button"
                        class="text-fg-primary focus-visible:outline-accent/70 text-left text-sm font-medium hover:underline focus-visible:outline focus-visible:outline-2 disabled:cursor-default disabled:opacity-70"
                        :disabled="!canOpenProfile"
                        @click="openProfile"
                    >
                        {{ resolvedAuthor.name || 'User ' + resolvedAuthor.id }}
                    </button>
                    <div
                        v-else
                        class="text-fg-primary text-left text-sm"
                    >
                        User {{ message.user_id }}
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
