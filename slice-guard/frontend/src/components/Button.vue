<script setup lang="ts">
import { computed } from 'vue';

/**
 * Props for the {@link Button} component.
 */
export interface ButtonProps {
    /** Visual style of the button. */
    variant?: 'primary' | 'secondary' | 'tertiary';
    /** Whether the button should be rendered as a circular bubble. */
    bubble?: boolean;
    /** Outline color class (color only). */
    outline?: string;
}

const props = defineProps<ButtonProps>();

// Default values for optional props.
const { variant = 'secondary', bubble = false, outline } = props;

// Computed classes for styling.
const bubbleClass = computed(() => (bubble ? 'rounded-full p-2' : 'rounded-xl px-4 py-2'));
const outlineClass = computed(() =>
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
