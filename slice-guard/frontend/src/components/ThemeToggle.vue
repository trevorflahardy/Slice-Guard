<script setup lang="ts">
import { onMounted, watchEffect, computed } from 'vue';
import Button from './Button.vue';
import { useLocalStorage } from '@vueuse/core';

/** Persisted theme preference. */
const theme = useLocalStorage<'light' | 'dark'>('theme', 'light', {
    listenToStorageChanges: true,
});

/** Whether the current theme is dark. */
const isDark = computed(() => theme.value === 'dark');

// Initialize theme from localStorage or system preference
onMounted(() => {
    const savedTheme = theme.value;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme.value = savedTheme ? savedTheme : systemPrefersDark ? 'dark' : 'light';
});

/** Toggle between light and dark themes. */
function toggleTheme(): void {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
}

watchEffect(() => {
    if (theme.value === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        theme.value = 'light';
    }
});
</script>

<template>
    <Button
        variant="secondary"
        @click="toggleTheme"
    >
        {{ isDark ? '☀️' : '🌙' }}
    </Button>
</template>
