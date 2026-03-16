<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
    <div class="flex h-screen items-center justify-center">
        <div class="text-center">
            <h1 class="text-fg-primary mb-2 text-4xl font-bold">404</h1>
            <p class="text-fg-secondary mb-4">Page not found</p>
            <button
                class="bg-accent hover:bg-accent/80 rounded-lg px-4 py-2 text-white transition-colors"
                @click="router.push('/')"
            >
                Go Home
            </button>
        </div>
    </div>
</template>
