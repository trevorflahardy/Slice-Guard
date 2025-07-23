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
      ? 'bg-salem-800 text-white hover:bg-salem-800/90 font-medium'
      : 'bg-gray-1 text-salem-800 hover:bg-gray2 outline outline-salem-800'
  ]">
    <slot />
  </button>
</template>
