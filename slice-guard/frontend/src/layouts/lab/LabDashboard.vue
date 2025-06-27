<script setup lang="ts">
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
            <h1 class="text-2xl font-semibold">{{ lab.name }}</h1>
            <p v-if="lab.description" class="text-gray-500">{{ lab.description }}</p>
        </div>
        <div v-else-if="loading" class="text-gray-500">Loading...</div>
    </div>
</template>
