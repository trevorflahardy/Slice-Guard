<script setup lang="ts">
import { ref, watch } from 'vue';
import ColorWheel from '../components/ColorWheel.vue';

const props = withDefaults(
    defineProps<{
        modelValue?: string | null;
        size?: number;
    }>(),
    {
        modelValue: '#ff0000',
        size: 240,
    },
);

const emit = defineEmits<{
    (e: 'update:modelValue', v: string | null): void;
    (e: 'close'): void;
}>();

const color = ref<string>(props.modelValue ?? '#000000');

watch(
    () => props.modelValue,
    (v) => {
        if (typeof v === 'string' && v !== color.value) color.value = v;
    },
);

function closeWithCommit() {
    emit('update:modelValue', color.value);
    emit('close');
}
</script>

<template>
    <Teleport to="body">
        <div
            class="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
            @click.self="closeWithCommit"
        >
            <div class="bg-surface-low ring-surface-high rounded-xl p-4 shadow-xl ring-1">
                <ColorWheel
                    v-model="color"
                    :size="size"
                />
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
/* minimal modal styling handled via utility classes */
</style>
