<script setup lang="ts">
const props = defineProps<{
  modelValue: string,
  placeholder?: string,
}>()
const emit = defineEmits(['update:modelValue'])
function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="w-full bg-surface-low rounded-lg px-3 py-2 flex items-center gap-2">
    <svg class="h-5 w-5 text-fg-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      :value="modelValue"
      @input="onInput"
      :placeholder="placeholder"
      class="flex-1 bg-transparent text-fg-primary placeholder-fg-secondary outline-none"
    />
  </div>
</template>

