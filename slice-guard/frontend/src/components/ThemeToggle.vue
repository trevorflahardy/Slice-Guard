<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Button from './Button.vue';

const isDark = ref(false);

// Initialize theme from localStorage or system preference
onMounted(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    isDark.value = savedTheme ? savedTheme === 'dark' : systemPrefersDark;
    applyTheme();
});

function toggleTheme() {
    isDark.value = !isDark.value;
    applyTheme();
}

function applyTheme() {
    if (isDark.value) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}
</script>

<template>
    <Button
        variant="secondary"
        @click="toggleTheme"
    >
        {{ isDark ? '☀️' : '🌙' }}
    </Button>
</template>
