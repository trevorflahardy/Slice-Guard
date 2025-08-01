<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import type { Lab, LabMember } from '@shared/db/lab'
import type { User } from '@shared/db/user'
import { apiFetch } from '../../services/api'

const props = defineProps<{
    lab: Lab | null
}>()

interface MemberResponse {
    member: LabMember
    user: User
}

const members = ref<Record<string, { id: number; name: string }[]>>({})
const search = ref('')

const filteredMembers = computed(() => {
    if (!search.value) return members.value
    const lower = search.value.toLowerCase()
    const result: Record<string, { id: number; name: string }[]> = {}
    for (const [category, users] of Object.entries(members.value)) {
        const filtered = users.filter(u => u.name.toLowerCase().includes(lower))
        if (filtered.length > 0) result[category] = filtered
    }
    return result
})

async function fetchMembers() {
    if (!props.lab) return
    const res = await apiFetch(`/labs/${props.lab.id}/members`)
    if (!res.ok) return
    const data = (await res.json()) as MemberResponse[]
    const map: Record<string, { id: number; name: string }[]> = {}
    for (const item of data) {
        const category = item.member.roles[0]?.name ?? 'Member'
        if (!map[category]) map[category] = []
        map[category].push({ id: item.user.id, name: item.user.name ?? item.user.email })
    }
    members.value = map
}

onMounted(fetchMembers)
watch(() => props.lab?.id, fetchMembers)
</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- Search bar to filter users -->
        <div class="w-full bg-surface-low rounded-lg px-3 py-2 flex items-center gap-2">
            <svg class="h-5 w-5 text-fg-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                v-model="search"
                placeholder="Search users..."
                class="flex-1 bg-transparent text-fg-primary placeholder-fg-secondary outline-none"
            />
        </div>
        <!-- Display the list of users categorized by role -->
        <div v-for="(users, category) in filteredMembers" :key="category" class="flex flex-col gap-2">
            <!-- Category header -->
            <h3 class="text-xs font-medium text-fg-primary uppercase tracking-wide px-2">
                {{ category }}
            </h3>

            <!-- Users in this category -->
            <ul class="space-y-1">
                <li v-for="user in users" :key="user.id">
                    <div
                        class="flex items-center justify-start gap-3 p-2 rounded-xl hover:shadow-md transition-all duration-200 hover:text-black text-fg-primary">
                        <!-- Placeholder user avatar -->
                        <div class="w-7 h-7 rounded-full bg-gray-700 flex-none"></div>

                        <span class="text-sm truncate">
                            {{ user.name }}
                        </span>
                    </div>
                </li>
            </ul>

            <!-- Divider line -->
            <hr class="border-surface-high my-2">

        </div>
    </div>
</template>
