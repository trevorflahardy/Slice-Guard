<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { useLabsStore } from '../store/labs';

const router = useRouter();
const auth = useAuthStore();

onMounted(async () => {
    if (!auth.apiKey) {
        const stored = localStorage.getItem('apiKey');
        if (stored) {
            auth.apiKey = stored;
        }
    }

    if (!auth.apiKey) {
        router.replace('/login');
        return;
    }

    const labsStore = useLabsStore();
    watch(
        () => labsStore.labs,
        (labs) => {
            if (labs.size > 0) {
                router.replace(`/lab/${labs.values().next().value!.id}`);
            } else {
                router.replace('/dms');
            }
        },
        { immediate: true },
    );
});
</script>

<template>
    <!--TODO: Very silly loading screen needed-->
    <div class="bg-surface-lowest flex min-h-screen items-center justify-center text-white">
        Loading...
    </div>
</template>
