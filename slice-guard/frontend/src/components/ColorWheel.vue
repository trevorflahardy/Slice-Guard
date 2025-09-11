<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useElementSize, useEventListener, watchDebounced } from '@vueuse/core';

import { clamp, hexToRgb, rgbToHex, rgbToHsv, hsvToRgb, normalizeHex } from '../utils/color';

/**
 * Interactive HSV color picker consisting of a saturation/value square and
 * a horizontal hue slider.
 *
 * The component exposes a `v-model` for the selected color and emits a
 * `change` event when the user finishes an interaction (pointer up).
 */

interface Emits {
    (e: 'update:modelValue', v: string): void;
    (e: 'change', v: string): void; // fired on pointer up / finalize interaction
}
const emit = defineEmits<Emits>();

const props = withDefaults(
    defineProps<{
        /** Selected color as `#rrggbb` or `#rgb`. */
        modelValue?: string;
        /** Square size in pixels. */
        size?: number;
        /** Hue slider thickness in pixels. */
        sliderThickness?: number;
    }>(),
    {
        modelValue: '#ff0000',
        size: 220,
        sliderThickness: 12,
    },
);

// ---------- state ----------
const initial = hexToRgb(normalizeHex(props.modelValue));
const hsv = ref(rgbToHsv(initial.r, initial.g, initial.b));
const hex = computed(() => {
    const { r, g, b } = hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v);
    return rgbToHex(r, g, b);
});

watch(
    () => props.modelValue,
    (nv) => {
        if (!nv) {
            return;
        }
        const n = normalizeHex(nv);
        if (n !== hex.value) {
            const { r, g, b } = hexToRgb(n);
            hsv.value = rgbToHsv(r, g, b);
        }
    },
);

watchDebounced(hex, (v) => emit('update:modelValue', v), { debounce: 200, maxWait: 1000 });

// ---------- SV square interactions ----------
const squareRef = ref<HTMLElement | null>(null);
const { width: squareW, height: squareH } = useElementSize(squareRef);
let draggingSquare = false;

/**
 * Update saturation and value based on pointer event coordinates within the
 * square selector.
 */
function setSVFromEvent(ev: PointerEvent): void {
    const el = squareRef.value;
    if (!el) {
        return;
    }
    const rect = el.getBoundingClientRect();
    const x = clamp((ev.clientX - rect.left) / rect.width);
    const y = clamp((ev.clientY - rect.top) / rect.height);
    hsv.value.s = Math.round(x * 100);
    hsv.value.v = Math.round((1 - y) * 100); // top=high value
}

/** Begin dragging within the SV square. */
function onSquareDown(ev: PointerEvent): void {
    draggingSquare = true;
    (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
    setSVFromEvent(ev);
}

/** Track pointer movement while dragging within SV square. */
function onSquareMove(ev: PointerEvent): void {
    if (!draggingSquare) {
        return;
    }
    setSVFromEvent(ev);
}

/** Finish SV drag and emit final color. */
function onSquareUp(): void {
    if (!draggingSquare) {
        return;
    }
    draggingSquare = false;
    emit('change', hex.value);
}

useEventListener(window, 'pointermove', onSquareMove);
useEventListener(window, 'pointerup', onSquareUp);

const squareThumbStyle = computed(() => {
    const x = (hsv.value.s / 100) * squareW.value;
    const y = (1 - hsv.value.v / 100) * squareH.value;
    return { transform: `translate(${x - 7}px, ${y - 7}px)` };
});

const squareBg = computed(() => `hsl(${Math.round(hsv.value.h)} 100% 50%)`);

// ---------- Hue slider interactions ----------
const sliderRef = ref<HTMLElement | null>(null);
let draggingHue = false;
/** Update hue value based on pointer position on the hue slider. */
function setHueFromEvent(ev: PointerEvent): void {
    const el = sliderRef.value;
    if (!el) {
        return;
    }
    const rect = el.getBoundingClientRect();
    const x = clamp((ev.clientX - rect.left) / rect.width);
    hsv.value.h = Math.round(x * 360);
}

/** Start dragging on the hue slider. */
function onHueDown(ev: PointerEvent): void {
    draggingHue = true;
    (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
    setHueFromEvent(ev);
}

/** Track pointer movement while adjusting hue. */
function onHueMove(ev: PointerEvent): void {
    if (!draggingHue) {
        return;
    }
    setHueFromEvent(ev);
}

/** Finish hue drag and emit final color. */
function onHueUp(): void {
    if (!draggingHue) {
        return;
    }
    draggingHue = false;
    emit('change', hex.value);
}

useEventListener(window, 'pointermove', onHueMove);
useEventListener(window, 'pointerup', onHueUp);

const hueThumbStyle = computed(() => ({ left: `${(hsv.value.h / 360) * 100}%` }));

// expose current hex as a v-model only; styling handled by parent
</script>

<template>
    <div class="flex flex-col gap-3">
        <!-- SV square -->
        <div
            ref="squareRef"
            class="ring-surface-high relative rounded-lg ring-1 select-none"
            :style="{ width: `${size}px`, height: `${size}px`, background: squareBg }"
            @pointerdown.prevent="onSquareDown"
        >
            <!-- overlays: saturation (white -> transparent), value (transparent -> black) -->
            <div
                class="pointer-events-none absolute inset-0 rounded-lg"
                style="background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0))"
            />
            <div
                class="pointer-events-none absolute inset-0 rounded-lg"
                style="background: linear-gradient(0deg, #000, rgba(0, 0, 0, 0))"
            />

            <!-- thumb -->
            <div
                class="pointer-events-none absolute h-3 w-3 rounded-full border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                :style="squareThumbStyle"
            />
        </div>

        <!-- Hue slider -->
        <div
            class="relative"
            :style="{ width: `${size}px` }"
        >
            <div
                ref="sliderRef"
                class="ring-surface-high relative h-3 w-full rounded-lg ring-1"
                :style="{
                    background: 'linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                }"
                @pointerdown.prevent="onHueDown"
            >
                <div
                    class="pointer-events-none absolute top-1/2 h-4 w-4 translate-x-[-50%] -translate-y-1/2 rounded-full border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)]"
                    :style="hueThumbStyle"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
/* no extra styles */
</style>
