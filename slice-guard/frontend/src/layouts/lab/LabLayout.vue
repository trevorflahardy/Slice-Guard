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
        <div class="rounded-l-[3rem] bg-foreground w-full p-[1.5rem] drop-shadow-lg flex gap-0">
            <div class="p-[1.5rem] flex-1 w-full">
                <!-- Actual insert content-->
                Foo bar
            </div>

            <!--User list for lab layout-->
            <div>
                <!-- User list for the lab layout -->
                <div class="w-64 lg:w-72 xl:w-80 h-full bg-background p-4 flex-initial">
                    <LabUserList />
                </div>
            </div>
        </div>
    </div>

</template>