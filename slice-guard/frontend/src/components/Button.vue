<script setup lang="ts">
const props = defineProps({
  variant: {
    type: String as () => 'primary' | 'secondary',
    default: 'primary'
  }
})
</script>

<template>
  <button
    :class="[
      'px-4 py-2 font-medium rounded-md transition-colors shadow',
      variant === 'primary'
        ? 'bg-main text-white hover:bg-main/90'
        : 'bg-gray1 text-gray3 hover:bg-gray2'
    ]"
  >
    <slot />
  </button>
</template>
