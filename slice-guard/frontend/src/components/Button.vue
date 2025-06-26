<script setup lang="ts">
const props = defineProps({
  variant: {
    type: String as () => 'primary' | 'secondary',
    default: 'primary'
  }
})
</script>

<template>
  <button :class="[
    'px-4 py-2 rounded-xl transition-colors shadow',
    variant === 'primary'
      ? 'bg-main text-white hover:bg-main/90 font-medium'
      : 'bg-gray-1 text-main hover:bg-gray2 outline outline-main outline-1'
  ]">
    <slot />
  </button>
</template>
