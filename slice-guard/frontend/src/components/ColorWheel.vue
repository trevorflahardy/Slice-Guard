<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useElementSize, useEventListener, watchDebounced } from '@vueuse/core';

interface Emits {
    (e: 'update:modelValue', v: string): void;
    (e: 'change', v: string): void; // fired on pointer up / finalize interaction
}
const emit = defineEmits<Emits>();

const props = withDefaults(
    defineProps<{
        modelValue?: string; // #RRGGBB or #RGB
        size?: number; // square size in px
        sliderThickness?: number; // hue slider thickness
    }>(),
    {
        modelValue: '#ff0000',
        size: 220,
        sliderThickness: 12,
    },
);

// ---------- color math (HSV) ----------
function clamp(n: number, min = 0, max = 1) {
    return Math.min(max, Math.max(min, n));
}
function hexToRgb(hex: string) {
    let v = hex.trim().toLowerCase();
    if (!v.startsWith('#')) return { r: 0, g: 0, b: 0 };
    if (v.length === 4) v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
    const num = parseInt(v.slice(1, 7), 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex(r: number, g: number, b: number) {
    return ('#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')).toLowerCase();
}
function rgbToHsv(r: number, g: number, b: number) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            default:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h: h * 360, s: s * 100, v: v * 100 };
}
function hsvToRgb(h: number, s: number, v: number) {
    h = ((h % 360) + 360) % 360;
    s = clamp(s / 100);
    v = clamp(v / 100);
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - s * f);
    const t = v * (1 - s * (1 - f));
    let r = 0,
        g = 0,
        b = 0;
    switch (i % 6) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p;
            break;
        case 2:
            r = p;
            g = v;
            b = t;
            break;
        case 3:
            r = p;
            g = q;
            b = v;
            break;
        case 4:
            r = t;
            g = p;
            b = v;
            break;
        case 5:
            r = v;
            g = p;
            b = q;
            break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function normalizeHex(v: string) {
    if (!v) return '#000000';
    if (!v.startsWith('#')) return v;
    return v.length === 4
        ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase()
        : v.slice(0, 7).toLowerCase();
}

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
        if (!nv) return;
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

function setSVFromEvent(ev: PointerEvent) {
    const el = squareRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp((ev.clientX - rect.left) / rect.width);
    const y = clamp((ev.clientY - rect.top) / rect.height);
    hsv.value.s = Math.round(x * 100);
    hsv.value.v = Math.round((1 - y) * 100); // top=high value
}

function onSquareDown(ev: PointerEvent) {
    draggingSquare = true;
    (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
    setSVFromEvent(ev);
}
function onSquareMove(ev: PointerEvent) {
    if (!draggingSquare) return;
    setSVFromEvent(ev);
}
function onSquareUp() {
    if (!draggingSquare) return;
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
function setHueFromEvent(ev: PointerEvent) {
    const el = sliderRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp((ev.clientX - rect.left) / rect.width);
    hsv.value.h = Math.round(x * 360);
}
function onHueDown(ev: PointerEvent) {
    draggingHue = true;
    (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
    setHueFromEvent(ev);
}
function onHueMove(ev: PointerEvent) {
    if (!draggingHue) return;
    setHueFromEvent(ev);
}
function onHueUp() {
    if (!draggingHue) return;
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
