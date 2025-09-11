<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';

/** Item definition for the context menu. */
export interface ContextMenuItem {
    /** Display label. */
    label: string;
    /** Action to perform when clicked. */
    action: () => void;
    /** Optional variant to show destructive styling. */
    variant?: 'danger';
}

/** Props for {@link ContextMenu}. */
interface Props {
    /** Menu items to render. */
    items: ContextMenuItem[];
    /** Absolute X coordinate for the menu origin. */
    x: number;
    /** Absolute Y coordinate for the menu origin. */
    y: number;
}

const props = defineProps<Props>();
const emit = defineEmits(['close']);

/** Close the menu when clicking outside. */
function onClickOutside(): void {
    emit('close');
}

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));
</script>

<template>
    <div
        class="bg-surface-low border-surface-high fixed z-50 rounded-md border py-1 shadow-lg"
        :style="{ top: props.y + 'px', left: props.x + 'px' }"
    >
        <button
            v-for="item in props.items"
            :key="item.label"
            class="hover:bg-surface-high block w-full px-4 py-2 text-left text-sm"
            :class="
                item.variant === 'danger' ? 'text-red-500 hover:bg-red-600/10' : 'text-fg-primary'
            "
            @click="
                item.action();
                emit('close');
            "
        >
            {{ item.label }}
        </button>
    </div>
</template>
