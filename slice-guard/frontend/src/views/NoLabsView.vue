<script setup lang="ts">
import Button from '../components/Button.vue';
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
    <h1 class="text-3xl font-semibold mb-4 text-black">Welcome to Slice Guard</h1>
    <p class="text-gray-500 mb-6">You are not a member of any labs yet.</p>
    <Button variant="primary" @click="router.push('/lab/create')">Create a Lab</Button>
    <!-- ! TODO: Add a button here to join a lab -->
  </div>
</template>
