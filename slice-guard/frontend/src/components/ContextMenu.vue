<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';

export interface ContextMenuItem {
    label: string;
    action: () => void;
    variant?: 'danger';
}

const props = defineProps<{ items: ContextMenuItem[]; x: number; y: number }>();
const emit = defineEmits(['close']);

function onClickOutside() {
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
