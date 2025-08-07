<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Sidebar from './Sidebar.vue';
import LabUserList from './LabUserList.vue';
import { useLabsStore } from '../../store/labs';

const route = useRoute();

const labs = useLabsStore();
const labId = computed(() => Number(route.params.id));
const lab = computed(() => labs.getLab(labId.value));
const loading = computed(() => lab.value === null);
const error = computed(() => (lab.value ? '' : 'Failed to load lab'));
</script>

<template>
    <div class="bg-surface-lowest flex min-h-screen">
        <aside
            class="bg-surface-low border-surface min-h-screen w-56 shrink-0 rounded-r-3xl border-r p-7 lg:w-64 xl:w-72"
        >
            <Sidebar :lab="lab!" />
        </aside>

        <!-- Main content area -->
        <div class="bg-surface-lowest flex w-full gap-0">
            <div
                class="no-scrollbar max-h-screen w-full flex-1 overflow-y-scroll scroll-smooth p-6"
            >
                <!-- Actual insert content-->
                <router-view />
            </div>

            <!--User list for lab layout-->
            <!--! TODO: This does not resize and rather the main content does - make this collapse later down the road when I'm not so lazy.
            -->
            <div
                class="bg-surface-lowest no-scrollbar h-full max-w-80 min-w-60 overflow-y-scroll scroll-smooth p-4"
            >
                <!-- User list for the lab layout -->
                <LabUserList :lab="lab" />
            </div>
        </div>
    </div>
</template>
