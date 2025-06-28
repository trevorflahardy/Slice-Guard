<script setup lang="ts">
import { Lab } from '@shared/db/lab'

// When the value of the lab changes to null (or the lab instance changes), we want to re-fetch the users
const props = defineProps<{
    lab: Lab | null
}>();

// Mapping of {top level role: {id, name}[]};
// TODO: Fetch the members** from the API (lab member object that also includes a list of their complete roles (sorted top down), permissions, etc.)
const members = ref<{ [key: string]: { id: number, name: string }[] }>({});
</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- Placeholder for search bar of users -->
        <div class="w-full bg-foreground shadow-md rounded-lg py-2 px-4 flex items-center justify-end">
            <!-- Magnifying glass SVG -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
        <!-- Display the list of users to use the variable -->
        <div v-for="(users, category) in randomUsers" :key="category" class="flex flex-col gap-2">
            <!-- Category header -->
            <h3 class="text-xs font-medium text-gray-500 uppercase tracking-wide px-2">
                {{ category }}
            </h3>

            <!-- Users in this category -->
            <ul class="space-y-1">
                <li v-for="user in users" :key="user.id">
                    <div
                        class="flex items-center justify-start gap-3 p-2 rounded-xl hover:shadow-md transition-all duration-200 hover:text-black text-gray-600">
                        <!-- Placeholder user avatar -->
                        <div class="w-7 h-7 rounded-full bg-gray-500 flex-none"></div>

                        <span class="text-sm truncate">
                            {{ user.name }}
                        </span>
                    </div>
                </li>
            </ul>

            <!-- Divider line -->
            <hr class="border-gray-200 my-2">

        </div>
    </div>
</template>