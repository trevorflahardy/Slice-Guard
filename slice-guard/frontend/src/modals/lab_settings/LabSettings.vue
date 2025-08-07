<script setup lang="ts">
import SettingsModal from '../SettingsModal.vue';
import { defineAsyncComponent } from 'vue';
defineEmits(['close']);
const pages = {
    'lab settings': [
        { name: 'General', component: defineAsyncComponent(() => import('./General.vue')), id: 1 },
    ],
};
</script>
<template>
    <SettingsModal
        :pages="pages"
        @close="$emit('close')"
    />
</template>
