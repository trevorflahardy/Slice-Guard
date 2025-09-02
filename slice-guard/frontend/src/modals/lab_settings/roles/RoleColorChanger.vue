<script setup lang="ts">
import { ref, type ModelRef } from 'vue';
import { colorSwatches } from './constants';
import { PencilIcon, CheckIcon } from '@heroicons/vue/24/outline';
import ColorPickerModal from '../../ColorPickerModal.vue';

export interface RoleColorChangerProps {
    isDefault: boolean;
}
defineProps<RoleColorChangerProps>();
const selectedColor: ModelRef<string | null> = defineModel('selectedColor', { required: true });

const showColorModal = ref(false);
</script>

<template>
    <!-- Color preview + custom trigger -->
    <div class="mt-2 flex items-center gap-3">
        <!-- current color preview -->
        <div
            class="ring-surface-high h-12 w-12 rounded-lg ring-1"
            :style="{ backgroundColor: selectedColor || '#9ca3af' }"
        />

        <!-- custom editor button -->
        <button
            class="ring-surface-high relative h-12 w-20 rounded-lg ring-1"
            @click="showColorModal = true"
        >
            <span
                class="absolute inset-0 rounded-lg"
                :style="{ backgroundColor: selectedColor || '#9ca3af' }"
            />

            <PencilIcon class="text-fg-inverse absolute top-1.5 right-1.5 h-4 w-4 opacity-70" />
        </button>
    </div>

    <!-- Swatches -->
    <div class="mt-3 grid grid-cols-10 gap-2">
        <button
            v-for="c in colorSwatches"
            :key="c"
            class="ring-surface-high relative h-7 w-7 rounded-md ring-1 transition-transform hover:scale-105"
            :style="{ backgroundColor: c }"
            @click="selectedColor = c"
        >
            <CheckIcon
                v-if="selectedColor && selectedColor.toLowerCase() === c.toLowerCase()"
                class="absolute top-0.5 right-0.5 h-3 w-3 text-white drop-shadow"
            />
        </button>
    </div>

    <ColorPickerModal
        v-if="showColorModal"
        v-model="selectedColor"
        @close="showColorModal = false"
    />
</template>
