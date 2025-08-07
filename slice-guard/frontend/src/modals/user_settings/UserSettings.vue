<script setup lang="ts">
import SettingsModal from '../SettingsModal.vue';
import { defineAsyncComponent } from 'vue';
defineEmits(['close']);
const pages = {
  'user settings': [
    { name: 'My Account', component: defineAsyncComponent(() => import('./MyAccount.vue')), id: 1 },
  ],
};
</script>
<template>
  <SettingsModal
    :pages="pages"
    @close="$emit('close')"
  />
</template>
