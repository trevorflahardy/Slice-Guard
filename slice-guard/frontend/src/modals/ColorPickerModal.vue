<script setup lang="ts">
import { ref, watch } from 'vue';
import { watchDebounced } from '@vueuse/core';
import ColorWheel from '../components/ColorWheel.vue';
import { clamp, normalizeHex, hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '../utils/color';

/** Props for {@link ColorPickerModal}. */
const props = withDefaults(
    defineProps<{
        /** Bound color value. */
        modelValue?: string | null;
        /** Diameter of the color picker wheel. */
        size?: number;
    }>(),
    {
        modelValue: '#ff0000',
        size: 240,
    },
);

const emit = defineEmits<{
    'update:modelValue': [value: string | null];
    close: [];
}>();

const color = ref<string>(normalizeHex(props.modelValue ?? '#000000'));
const hexInput = ref<string>(color.value);
const rgbInput = ref<string>('');
const hslInput = ref<string>('');

function syncInputs(value: string): void {
    const normalized = normalizeHex(value);
    if (hexInput.value !== normalized) {
        hexInput.value = normalized;
    }
    const { r, g, b } = hexToRgb(normalized);
    const rgbString = `${r}, ${g}, ${b}`;
    if (rgbInput.value !== rgbString) {
        rgbInput.value = rgbString;
    }
    const { h, s, l } = rgbToHsl(r, g, b);
    const hslString = `${Math.round(h)}, ${Math.round(s)}, ${Math.round(l)}`;
    if (hslInput.value !== hslString) {
        hslInput.value = hslString;
    }
}

syncInputs(color.value);

// keep internal color in sync with bound value
watch(
    () => props.modelValue,
    (v) => {
        if (typeof v === 'string') {
            const normalized = normalizeHex(v);
            if (normalized !== color.value) {
                color.value = normalized;
            }
        }
    },
);

watch(color, (value) => {
    syncInputs(value);
});

watchDebounced(
    hexInput,
    (value) => {
        if (!value) {
            return;
        }
        const normalized = normalizeHex(value);
        if (normalized !== color.value) {
            color.value = normalized;
        }
    },
    { debounce: 150, maxWait: 400 },
);

watchDebounced(
    rgbInput,
    (value) => {
        const tuple = parseRgb(value);
        if (!tuple) {
            return;
        }
        const next = rgbToHex(tuple[0], tuple[1], tuple[2]);
        if (next !== color.value) {
            color.value = next;
        }
    },
    { debounce: 180, maxWait: 400 },
);

watchDebounced(
    hslInput,
    (value) => {
        const tuple = parseHsl(value);
        if (!tuple) {
            return;
        }
        const { r, g, b } = hslToRgb(tuple[0], tuple[1], tuple[2]);
        const next = rgbToHex(r, g, b);
        if (next !== color.value) {
            color.value = next;
        }
    },
    { debounce: 180, maxWait: 400 },
);

function parseRgb(value: string): [number, number, number] | null {
    const matches = value.match(/-?\d+(?:\.\d+)?/g);
    if (!matches || matches.length < 3) {
        return null;
    }
    const [r, g, b] = matches
        .slice(0, 3)
        .map((part) => Number(part))
        .map((n) => Math.round(clamp(Number.isNaN(n) ? 0 : n, 0, 255)));
    if ([r, g, b].some((n) => Number.isNaN(n))) {
        return null;
    }
    return [r, g, b];
}

function parseHsl(value: string): [number, number, number] | null {
    const matches = value.match(/-?\d+(?:\.\d+)?/g);
    if (!matches || matches.length < 3) {
        return null;
    }
    const [hRaw, sRaw, lRaw] = matches.slice(0, 3).map((part) => Number(part));
    if ([hRaw, sRaw, lRaw].some((n) => Number.isNaN(n))) {
        return null;
    }
    const h = ((hRaw % 360) + 360) % 360;
    const s = clamp(sRaw, 0, 100);
    const l = clamp(lRaw, 0, 100);
    return [Math.round(h), Math.round(s), Math.round(l)];
}

/** Close the modal and emit the current color. */
function closeWithCommit(): void {
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
            <div
                class="bg-surface-low ring-surface-high w-full max-w-3xl space-y-6 rounded-xl p-6 shadow-xl ring-1"
            >
                <div class="flex flex-col gap-6 md:flex-row">
                    <ColorWheel
                        v-model="color"
                        :size="size"
                    />
                    <div class="flex flex-1 flex-col gap-4">
                        <div class="flex flex-col gap-2">
                            <label class="text-fg-primary text-xs font-semibold uppercase"
                                >Hex</label
                            >
                            <input
                                v-model="hexInput"
                                class="bg-surface text-fg-primary border-surface-high/40 focus:ring-accent rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-fg-primary text-xs font-semibold uppercase"
                                >RGB</label
                            >
                            <input
                                v-model="rgbInput"
                                placeholder="255, 255, 255"
                                class="bg-surface text-fg-primary border-surface-high/40 focus:ring-accent rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                            />
                        </div>
                        <div class="flex flex-col gap-2">
                            <label class="text-fg-primary text-xs font-semibold uppercase"
                                >HSL</label
                            >
                            <input
                                v-model="hslInput"
                                placeholder="0, 100, 50"
                                class="bg-surface text-fg-primary border-surface-high/40 focus:ring-accent rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                            />
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-fg-secondary text-sm">Preview</span>
                            <div
                                class="ring-surface-high h-12 w-12 rounded-md ring-1"
                                :style="{ backgroundColor: color }"
                            />
                        </div>
                    </div>
                </div>
                <div class="flex justify-end gap-2">
                    <button
                        class="text-fg-secondary hover:text-fg-primary rounded-md px-4 py-2 text-sm transition-colors"
                        @click="closeWithCommit"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
/* minimal modal styling handled via utility classes */
</style>
