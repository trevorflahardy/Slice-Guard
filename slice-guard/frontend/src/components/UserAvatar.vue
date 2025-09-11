<script setup lang="ts">
import type { User } from '@shared/db/user';
import { computed } from 'vue';

/** Props for {@link UserAvatar}. */
export interface UserAvatarProps {
    /** User whose avatar should be displayed. */
    user: User;
    /** Tailwind size class such as `size-5` or `size-10`. */
    size: string;
}

const props = defineProps<UserAvatarProps>();

/** Fallback initials when no avatar is present. */
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
