<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface DropdownOption {
  id: number | string
  name: string
  icon?: any
  variant?: 'danger'
}

interface Props {
  options: DropdownOption[]
  modelValue: number | string | null | (number | string)[]
  placeholder?: string
  multiple?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: number | string | null | (number | string)[]): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select option',
  multiple: false
})

const emit = defineEmits<Emits>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement>()

// Handle click outside to close dropdown
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Computed display text
const displayText = computed(() => {
  if (props.multiple) {
    const selected = props.modelValue as (number | string)[]
    if (!selected || selected.length === 0) {
      return props.placeholder
    }
    if (selected.length === 1) {
      const option = props.options.find(opt => opt.id === selected[0])
      return option?.name || props.placeholder
    }
    return `${selected.length} selected`
  } else {
    const value = props.modelValue as number | string | null
    if (value === null || value === undefined) {
      return props.placeholder
    }
    const option = props.options.find(opt => opt.id === value)
    return option?.name || props.placeholder
  }
})

// Check if option is selected
function isSelected(optionId: number | string): boolean {
  if (props.multiple) {
    const selected = props.modelValue as (number | string)[]
    return selected ? selected.includes(optionId) : false
  } else {
    return props.modelValue === optionId
  }
}

// Handle option selection
function selectOption(optionId: number | string) {
  if (props.multiple) {
    const currentSelected = (props.modelValue as (number | string)[]) || []

    if (currentSelected.includes(optionId)) {
      // Remove from selection
      const newSelected = currentSelected.filter(id => id !== optionId)
      emit('update:modelValue', newSelected)
    } else {
      // Add to selection
      emit('update:modelValue', [...currentSelected, optionId])
    }
  } else {
    // Single selection: toggle on/off
    if (props.modelValue === optionId) {
      emit('update:modelValue', null)
    } else {
      emit('update:modelValue', optionId)
    }
    isOpen.value = false
  }
}

const selectClass = "bg-surface-low px-3 py-1 rounded-full text-fg-primary shadow-sm"
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <template v-if="$slots.activator">
      <div @click="isOpen = !isOpen">
        <slot name="activator" />
      </div>
    </template>
    <button v-else @click="isOpen = !isOpen" :class="selectClass"
      class="flex items-center justify-between gap-2 w-full">
      <span class="truncate">{{ displayText }}</span>
      <svg class="h-4 w-4 transition-transform duration-200 flex-shrink-0" :class="{ 'rotate-180': isOpen }" fill="none"
        stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <div v-show="isOpen"
      class="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-surface-low border border-surface-high rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
      <!-- Regular options -->
      <button v-for="option in options" :key="option.id" @click="selectOption(option.id)"
        class="w-full text-left px-3 py-2 transition-colors duration-150 flex items-center justify-between"
        :class="[ isSelected(option.id) ? 'bg-surface-high' : '', option.variant === 'danger' ? 'text-red-500 hover:bg-red-600/10' : 'text-fg-primary hover:bg-surface-high']">
        <span class="flex items-center gap-2">
          <component v-if="option.icon" :is="option.icon" class="h-4 w-4" />
          <span>{{ option.name }}</span>
        </span>
        <svg v-if="isSelected(option.id)" class="h-4 w-4 text-green-500" fill="none" stroke="currentColor"
          viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </button>
    </div>
  </div>
</template>