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
    <div class="mb-2 flex items-start gap-2">
        <!-- Author avatar here -->
        <div>
            <UserAvatar
                :user="author"
                size="size-8"
            />
        </div>
    </div>
</template>
