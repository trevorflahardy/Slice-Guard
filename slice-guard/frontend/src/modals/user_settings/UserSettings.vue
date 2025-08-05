<!-- UserSettings.vue - Now a proper MODAL -->
<script setup lang="ts">
import { onMounted, onUnmounted, defineEmits, defineAsyncComponent, type ShallowRef, shallowRef } from 'vue'
import { XCircleIcon } from '@heroicons/vue/24/outline';

const emit = defineEmits(['close']);

// Constant for available pages on this modal (aka settings pages). Organized by category and then each
// individual page
const pages = {
    'user settings': [
        { name: 'My Account', component: defineAsyncComponent(() => import('./MyAccount.vue')), id: 1 },
    ]
}
const activePage: ShallowRef<{ category: string, id: number, component: any }> = shallowRef({
    category: 'user settings',
    id: 1,
    component: pages['user settings'][0].component
});

const isActivePage = (category: string, id: number) => {
    return activePage.value.category === category && activePage.value.id === id;
}

// Modal behavior - close on Escape key
function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        emit('close')
    }
}

onMounted(() => {
    document.addEventListener('keydown', handleEscape)
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
    // Restore body scroll
    document.body.style.overflow = ''
})
</script>

<template>
    <!-- Modal backdrop -->
    <Teleport to="body">
        <div class="fixed inset-0 z-50" @click.self="$emit('close')">
            <!-- Modal content. Takes up the whole page and ensures its content is centered -->
            <div class="bg-surface-lowest rounded-xl shadow-xl w-full h-full overflow-auto flex">
                <!-- Content for the pages the user can select -->
                <div class="max-w-[25%] w-full h-full py-10 px-5">
                    <!-- The actual contents themselves are a fraction of the actual width-->
                    <div class="w-72 h-full ml-auto">
                        <!-- Search bar for the settings the user can select from. TODO add this search functionality using a new component -->
                        <div
                            class="w-full bg-surface-low outline-1 outline-fg-secondary rounded-lg px-3 py-1 text-fg-secondary">
                            Search...
                        </div>

                        <div class="mt-5">
                            <!-- List of settings pages -->
                            <hr class="border-surface-high my-3">

                            <ul v-for="(pages, category) in pages" :key="category" class="flex flex-col gap-1">
                                <h3 class="text-fg-secondary uppercase font-semibold text-sm ps-2 mb-1">
                                    {{ category }}
                                </h3>

                                <ul v-for="page in pages" :key="page.id"
                                    class="text-fg-primary hover:text-pretty cursor-pointer">

                                    <li class="text-sm w-full text-left font-medium cursor-pointer px-3 py-2 rounded-lg hover:bg-surface-low hover:text-fg-primary"
                                        :class="[isActivePage(category, page.id) ? 'bg-surface-low text-fg-primary shadow-md' : ' text-fg-secondary']"
                                        @click="activePage = { category, id: page.id, component: page.component }">

                                        {{ page.name }}
                                    </li>
                                </ul>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="w-full h-full bg-surface-low flex py-10 px-7">
                    <!--The actual settings content, takes up about 80% of the modal-->
                    <div class="w-[80%] h-full">
                        <component :is="activePage.component" />
                    </div>

                    <div class="h-full w-[20%]">
                        <button @click="$emit('close')" class="text-fg-secondary hover:text-fg-primary">
                            <XCircleIcon class="h-8 w-8" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </Teleport>
</template>