<script setup lang="ts">
import type { Message } from '@shared/db/message';
import type { User } from '@shared/db/user';

import UserAvatar from '../UserAvatar.vue';

export interface ChannelMessageProps {
    message: Message;
    author: User;
}
defineProps<ChannelMessageProps>();
</script>

<template>
    <div
        class="hover:bg-surface-low mb-2 flex items-start gap-2 rounded-xl p-2 transition-colors duration-0 ease-out"
    >
        <div class="flex flex-row items-start justify-center gap-2">
            <!-- The user's avatar off to the left -->
            <UserAvatar
                :user="author"
                size="size-8"
            />

            <div>
                <!-- Their name and when the message was created off to the right next to each other -->
                <div class="flex flex-row items-center justify-start gap-2">
                    <div class="text-fg-primary text-left text-sm">
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
