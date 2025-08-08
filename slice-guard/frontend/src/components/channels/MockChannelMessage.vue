<script setup lang="ts">
import UserAvatar from '../UserAvatar.vue';

/**
 * Mock channel message used in role color preview.
 * Displays a user's name in the provided color and example content.
 */
const props = defineProps<{
    name: string;
    color: string;
    content: string;
}>();
</script>

<template>
    <div class="hover:bg-surface-low mb-2 flex items-start gap-2 rounded-xl p-2">
        <UserAvatar
            :user="{ id: 0, name: props.name }"
            size="size-8"
        />
        <div>
            <div class="flex items-center gap-2">
                <span
                    class="text-sm font-medium"
                    :style="{ color: props.color }"
                    >{{ props.name }}</span
                >
                <span class="text-fg-tertiary text-xs">00:00</span>
            </div>
            <div class="text-fg-primary text-left text-sm">{{ props.content }}</div>
        </div>
    </div>
</template>
