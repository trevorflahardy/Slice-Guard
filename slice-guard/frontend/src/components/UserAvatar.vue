<script setup lang="ts">
import type { User } from '@shared/db/user';
import { computed } from 'vue';

export interface UserAvatarProps {
    user: User;
    size: string; // 'size-5', 'size-10', etc.
}
const props = defineProps<UserAvatarProps>();

const initials = computed(() => {
    const base = props.user?.name || props.user?.email || '';
    return base.charAt(0);
});
</script>

<template>
    <div
        class="flex items-center justify-center rounded-full"
        :class="props.size"
    >
        <img
            v-if="props.user.avatar_url"
            :src="props.user.avatar_url"
            alt="User's avatar"
            class="h-full w-full rounded-full border border-gray-300 bg-cover"
        />

        <div
            v-else
            class="mt-2 text-center"
        >
            <span class="text-lg font-semibold">{{ initials }}</span>
        </div>
    </div>
</template>
