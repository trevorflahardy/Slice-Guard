<template>
    <Teleport to="body">
        <div class="fixed inset-0 z-50" @click.self="$emit('close')">
            <div class="bg-surface-lowest rounded-xl shadow-xl w-full h-full overflow-auto flex">
                <div class="max-w-[25%] w-full h-full py-10 px-5">
                    <div class="w-72 h-full ml-auto">
                        <SearchBar v-model="search" placeholder="Search..." />
                        <div class="mt-5">
                            <hr class="border-surface-high my-3">
                            <ul v-for="(pages, category) in filteredPages" :key="category" class="flex flex-col gap-1">
                                <h3 class="text-fg-secondary uppercase font-semibold text-sm ps-2 mb-1">{{ category }}</h3>
                                <ul v-for="page in pages" :key="page.id" class="text-fg-primary hover:text-pretty cursor-pointer">
                                    <li class="text-sm w-full text-left font-medium cursor-pointer px-3 py-2 rounded-lg hover:bg-surface-low hover:text-fg-primary" :class="[isActivePage(category, page.id) ? 'bg-surface-low text-fg-primary shadow-md' : ' text-fg-secondary']" @click="activePage = { category, id: page.id, component: page.component }">
                                        {{ page.name }}
                                    </li>
                                </ul>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="w-full h-full bg-surface-low flex py-10 px-7">
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
<script setup lang="ts">
import { onMounted, onUnmounted, type ShallowRef, shallowRef, ref, computed } from 'vue'
import { XCircleIcon } from '@heroicons/vue/24/outline'
import SearchBar from '../components/SearchBar.vue'

interface PageDef { name: string; component: any; id: number }
const props = defineProps<{ pages: Record<string, PageDef[]> }>()
const emit = defineEmits(['close'])

const search = ref('')
const firstCategory = Object.keys(props.pages)[0]
const firstPage = props.pages[firstCategory][0]
const activePage: ShallowRef<{ category: string; id: number; component: any }> = shallowRef({
    category: firstCategory,
    id: firstPage.id,
    component: firstPage.component,
})

const filteredPages = computed(() => {
    const q = search.value.toLowerCase()
    const result: Record<string, PageDef[]> = {}
    for (const [category, list] of Object.entries(props.pages)) {
        const filtered = list.filter(p => p.name.toLowerCase().includes(q))
        if (filtered.length) result[category] = filtered
    }
    return q ? result : props.pages
})

const isActivePage = (category: string, id: number) => {
    return activePage.value.category === category && activePage.value.id === id
}

function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') emit('close')
}

onMounted(() => {
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
    document.body.style.overflow = ''
})
</script>
