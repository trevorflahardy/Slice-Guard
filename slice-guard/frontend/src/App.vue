<script setup lang="ts">
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import LabBar from './components/LabBar.vue';
import UserProfileModal from './modals/UserProfileModal.vue';
const route = useRoute();
const hideBar = computed(() => ['Login', 'Register'].includes(route.name as string));
</script>

<template>
    <div v-if="hideBar">
        <router-view />
    </div>
    <div
        v-else
        class="flex min-h-screen"
    >
        <LabBar />
        <div class="flex-1">
            <router-view />
        </div>
    </div>
    <UserProfileModal />
</template>

<style scoped></style>
