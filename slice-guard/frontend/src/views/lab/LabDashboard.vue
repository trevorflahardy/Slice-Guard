<script setup lang="ts">
import ThemeToggle from '../../components/ThemeToggle.vue';

interface Props {
    lab: any | null
    error: string
    loading: boolean
}

defineProps<Props>()



</script>

<template>
    <div class="space-y-4">
        <div v-if="error" class="text-red-600">{{ error }}</div>
        <div v-if="lab">
            <h1 class="text-fg-primary text-2xl font-semibold">{{ lab.name }}</h1>
            <p v-if="lab.description" class="text-fg-secondary">{{ lab.description }}</p>
        </div>
        <div v-else-if="loading" class="text-fg-secondary">Loading...</div>
    </div>

    <!-- Theme Toggle Button -->
    <ThemeToggle class="mt-4" variant="secondary" />

</template>
