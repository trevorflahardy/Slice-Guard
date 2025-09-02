<script setup lang="ts">
import { ref } from 'vue';

export interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'tertiary';
    bubble?: boolean;
    outline?: string; // Outline color class (color only).
}

const props = defineProps<ButtonProps>();

const { variant = 'secondary', bubble = false, outline } = props;

const bubbleClass = ref(bubble ? 'rounded-full p-2' : 'rounded-xl px-4 py-2');
const outlineClass = ref(
    outline ? `outline outline-1 hover:scale-[1.02] duration-200 ease-out` : '',
);
</script>

<template>
    <button
        v-if="variant === 'primary' || variant === 'secondary'"
        :class="[
            'cursor-pointer font-medium shadow transition-colors duration-200 ease-out',
            variant === 'primary'
                ? 'bg-salem-800 hover:bg-salem-800/90 text-white'
                : 'bg-surface text-salem-700 hover:bg-gray2 ring-salem-700 ring dark:text-gray-100 dark:ring-1 dark:inset-shadow-2xs dark:ring-gray-100',
            bubbleClass,
            outlineClass,
        ]"
    >
        <slot />
    </button>
    <button
        v-else
        class="text-fg-primary cursor-pointer shadow-none transition-all duration-250 ease-out hover:shadow-md"
        :class="[bubbleClass, outlineClass]"
    >
        <slot />
    </button>
</template>
