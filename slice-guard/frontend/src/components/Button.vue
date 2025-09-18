<script setup lang="ts">
/**
 * Props for the {@link Button} component.
 */
export interface ButtonProps {
    /** Visual style of the button. */
    variant?: 'primary' | 'secondary' | 'tertiary';
}

const props = defineProps<ButtonProps>();

// Default values for optional props.
const { variant = 'secondary' } = props;

const shared =
    'cursor-pointer text-sm transition-colors transition-transform transition-shadow duration-200 ease-out px-3 py-2 border-1 rounded-lg hover:scale-105 dark:border-0';
</script>

<template>
    <button
        v-if="variant == 'primary'"
        :class="[shared]"
        class="bg-salem-700 text-surface border-salem-700 font-medium shadow-md hover:shadow-lg dark:text-white"
    >
        <slot />
    </button>

    <button
        v-else-if="variant == 'secondary'"
        :class="[shared]"
        class="text-fg-primary border-fg-primary bg-inherit font-medium shadow-xs hover:shadow-sm"
    >
        <slot />
    </button>
</template>
