<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from 'vue';

/** Option entry for the dropdown. */
export interface DropdownOption {
    id: number | string;
    name: string;
    icon?: Component;
    /** Optional variant for styling (e.g. danger). */
    variant?: 'danger';
}

/** Props for {@link Dropdown}. */
interface Props {
    /** Available options to display. */
    options: DropdownOption[];
    /** Selected value or values when `multiple` is true. */
    modelValue: number | string | null | (number | string)[];
    /** Placeholder text when nothing is selected. */
    placeholder?: string;
    /** Allow selecting multiple options. */
    multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Select option',
    multiple: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: number | string | null | (number | string)[]];
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement>();

/** Close the dropdown when clicking outside. */
function handleClickOutside(event: MouseEvent): void {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        isOpen.value = false;
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

/** Text to show in the activator button. */
const displayText = computed(() => {
    if (props.multiple) {
        const selected = props.modelValue as (number | string)[];
        if (!selected || selected.length === 0) {
            return props.placeholder;
        }
        if (selected.length === 1) {
            const option = props.options.find((opt) => opt.id === selected[0]);
            return option?.name || props.placeholder;
        }
        return `${selected.length} selected`;
    }
    const value = props.modelValue as number | string | null;
    if (value === null || value === undefined) {
        return props.placeholder;
    }
    const option = props.options.find((opt) => opt.id === value);
    return option?.name || props.placeholder;
});

/** Determine if the option is currently selected. */
function isSelected(optionId: number | string): boolean {
    if (props.multiple) {
        const selected = props.modelValue as (number | string)[];
        return selected ? selected.includes(optionId) : false;
    }
    return props.modelValue === optionId;
}

/** Handle selection toggling for the given option. */
function selectOption(optionId: number | string): void {
    if (props.multiple) {
        const currentSelected = (props.modelValue as (number | string)[]) || [];
        if (currentSelected.includes(optionId)) {
            // Remove from selection
            const newSelected = currentSelected.filter((id) => id !== optionId);
            emit('update:modelValue', newSelected);
        } else {
            // Add to selection
            emit('update:modelValue', [...currentSelected, optionId]);
        }
    } else {
        // Single selection: toggle on/off
        if (props.modelValue === optionId) {
            emit('update:modelValue', null);
        } else {
            emit('update:modelValue', optionId);
        }
        isOpen.value = false;
    }
}

const selectClass = 'bg-surface-low px-3 py-1 rounded-full text-fg-primary shadow-sm';
</script>

<template>
    <div
        ref="dropdownRef"
        class="relative"
    >
        <template v-if="$slots.activator">
            <div @click="isOpen = !isOpen">
                <slot name="activator" />
            </div>
        </template>
        <button
            v-else
            :class="selectClass"
            class="flex w-full items-center justify-between gap-2"
            @click="isOpen = !isOpen"
        >
            <span class="truncate">{{ displayText }}</span>
            <svg
                class="h-4 w-4 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': isOpen }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                ></path>
            </svg>
        </button>

        <!-- Dropdown Menu -->
        <div
            v-show="isOpen"
            class="bg-surface-low border-surface-high absolute top-full left-0 z-50 mt-1 max-h-60 w-full min-w-[200px] overflow-y-auto rounded-md border shadow-lg"
        >
            <!-- Regular options -->
            <button
                v-for="option in options"
                :key="option.id"
                class="flex w-full items-center justify-between px-3 py-2 text-left transition-colors duration-150"
                :class="[
                    isSelected(option.id) ? 'bg-surface-high' : '',
                    option.variant === 'danger'
                        ? 'text-red-500 hover:bg-red-600/10'
                        : 'text-fg-primary hover:bg-surface-high',
                ]"
                @click="selectOption(option.id)"
            >
                <span class="flex items-center gap-2">
                    <component
                        :is="option.icon"
                        v-if="option.icon"
                        class="h-4 w-4"
                    />
                    <span>{{ option.name }}</span>
                </span>
                <svg
                    v-if="isSelected(option.id)"
                    class="h-4 w-4 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                    ></path>
                </svg>
            </button>
        </div>
    </div>
</template>
