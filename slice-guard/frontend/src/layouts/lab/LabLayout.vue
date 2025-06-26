<script setup lang="ts">

import Sidebar from '../Sidebar.vue';
import LabUserList from './LabUserList.vue';
</script>

<template>
    <div class="flex min-h-screen bg-background">
        <!-- Sidebar has no background and takes on that of the main -->
        <aside class="w-56 lg:w-64 xl:w-72 bg-background min-h-screen p-7 flex-shrink-0">
            <Sidebar />
        </aside>

        <!-- Main content area -->
        <div class="rounded-l-[3rem] bg-foreground w-full drop-shadow-lg flex gap-0">
            <div class="p-[1.5rem] flex-1 w-full">
                <!-- Actual insert content-->
                TODO
            </div>

            <!--User list for lab layout-->
            <!--! TODO: This does not resize and rather the main content does - make this collapse later down the road when I'm not so lazy.
            -->
            <div class="h-full bg-background p-4 min-w-52 max-w-60">
                <!-- User list for the lab layout -->
                <LabUserList />
            </div>
        </div>
    </div>
</template>