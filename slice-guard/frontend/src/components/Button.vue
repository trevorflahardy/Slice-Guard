<script setup lang="ts">
defineProps({
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
      : 'bg-surface-low text-salem-800 hover:bg-gray2 ring ring-salem-800 dark:ring-0 dark:inset-shadow-2xs dark:shadow-fg-secondary'
  ]">
    <slot />
  </button>
</template>
