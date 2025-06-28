<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../store/auth'

const auth = useAuthStore()

const route = useRoute()
const labId = computed(() => route.params.id)
</script>

<template>
    <!-- Holds the main sidebar content. For now, this is placeholder information. -->
    <div class="flex flex-col gap-5 h-full justify-items-start">
        <!--Currently active lab information (and way to change lab)-->
        <div class="text-left flex flex-col items-start gap-2">
            <h1 class="text-lg/5 font-semibold text-pretty">Slice Guard Testing Development Lab</h1>
            <p class="text-xs text-gray-500 line-clamp-2">Slice Guard Lab is a fictional print lab used for
                testing purposes with a really really long name that should be truncated if it is too long.
            </p>
        </div>


        <!-- Divider line -->
        <hr class="border-gray-400">

        <!-- Navigation for the selected Lab -->
        <div>
            <!-- Similar to Discord style, has stats information and channels, each separated by a divider -->
            <div class="flex flex-row justify-between items-center">
                <h2 class="text-sm font-medium text-gray-500 mb-2 uppercase">Lab Center</h2>

                <!-- Dropdown arrow to collapse category -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 cursor-pointer" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            <!-- Navigation links (need gear icon at the right side of each later on) -->
            <nav class="flex flex-col space-y-1">
                <RouterLink :to="`/lab/${labId}/dashboard`"
                    class="text-sm text-gray-800 hover:text-black hover:text-pretty rounded-lg w-full transition-all duration-250 py-1 px-4 hover:shadow-md hover:font-medium">dashboard</RouterLink>

                <RouterLink :to="`/lab/${labId}/print-requests`"
                    class="text-sm text-gray-800 hover:text-black hover:text-pretty rounded-lg w-full transition-all duration-250 py-1 px-4 hover:shadow-md hover:font-medium">print-requests</RouterLink>
            </nav>
        </div>

        <!-- Navigation for Lab text channels - very similar to the above should be made into a dynamic system soon -->
        <div>
            <!-- Similar to Discord style, has stats information and channels, each separated by a divider -->
            <div class="flex flex-row justify-between items-center">
                <h2 class="text-sm font-medium text-gray-500 mb-2 uppercase">Channels</h2>

                <!-- Dropdown arrow to collapse category -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 cursor-pointer" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            <!-- Navigation links (need gear icon at the right side of each later on) -->
            <nav class="flex flex-col space-y-1">
                <a href="#"
                    class="text-sm text-gray-800 hover:text-black hover:text-pretty rounded-lg w-full transition-all duration-250 py-1 px-4 hover:shadow-md hover:font-medium">general</a>

                <a href="#"
                    class="text-sm text-gray-800 hover:text-black hover:text-pretty rounded-lg w-full transition-all duration-250 py-1 px-4 hover:shadow-md hover:font-medium">some-private-channel</a>
            </nav>
        </div>



        <!-- Avatar information -->

        <!-- Divider line for avatar -->
        <hr class="border-gray-400 mt-auto">

        <div class="flex flex-row gap-2 rounded-xl justify-start items-center">
            <!-- Temporary avatar image that takes up the same height as the text it's to the left of -->
            <div class="w-10 h-10 rounded-full bg-gray-500 drop-shadow-sm">
            </div>

            <div>
                <h2 class="text-sm font-semibold">{{ auth.user?.name ?? 'Unknown User' }}</h2>
                <p class="text-xs text-gray-500">Administrator</p>
            </div>

            <!--Settings gear icon at the end of the flex -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 cursor-pointer ml-auto" fill="none"
                viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m-6 0l3-3V8" />
            </svg>
        </div>
    </div>



</template>