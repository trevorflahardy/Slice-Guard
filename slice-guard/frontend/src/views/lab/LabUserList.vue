<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Lab } from '@shared/db/lab';
import { useLabsStore } from '../../store/labs';
import SearchBar from '../../components/SearchBar.vue';
import UserAvatar from '../../components/UserAvatar.vue';

const props = defineProps<{
    lab: Lab | null;
}>();

const labs = useLabsStore();
const search = ref('');

const members = computed(() => {
    if (!props.lab) {
        return [];
    }

    return labs.getLabMembers(props.lab.id);
});

const categorized = computed(() => {
    const map: Record<string, { id: number; user: ReturnType<typeof labs.getUser> }[]> = {};
    for (const m of members.value) {
        const category = m.roles[0]?.name ?? 'Member';
        if (!map[category]) {
            map[category] = [];
        }
        map[category].push({ id: m.user_id, user: labs.getUser(m.user_id) });
    }
    return map;
});

const filteredMembers = computed(() => {
    if (!search.value) {
        return categorized.value;
    }
    const lower = search.value.toLowerCase();
    const result: Record<string, { id: number; user: ReturnType<typeof labs.getUser> }[]> = {};
    for (const [category, users] of Object.entries(categorized.value)) {
        const filtered = users.filter((u) => (u.user?.name || '').toLowerCase().includes(lower));
        if (filtered.length > 0) {
            result[category] = filtered;
        }
    }
    return result;
});
</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- Search bar to filter users -->
        <SearchBar
            v-model="search"
            placeholder="Search users..."
        />
        <!-- Display the list of users categorized by role -->
        <div
            v-for="(users, category) in filteredMembers"
            :key="category"
            class="flex flex-col gap-2"
        >
            <!-- Category header -->
            <h3 class="text-fg-primary px-2 text-xs font-medium tracking-wide uppercase">
                {{ category }}
            </h3>

            <!-- Users in this category -->
            <ul class="space-y-1">
                <li
                    v-for="u in users"
                    :key="u.id"
                >
                    <div
                        class="text-fg-primary flex items-center justify-start gap-3 rounded-xl p-2 transition-all duration-200 hover:text-black hover:shadow-md"
                    >
                        <UserAvatar
                            v-if="u.user"
                            :user="u.user"
                            size="size-7"
                        />
                        <div
                            v-else
                            class="h-7 w-7 flex-none rounded-full bg-gray-700"
                        ></div>

                        <span class="truncate text-sm">
                            {{ u.user?.name || u.user?.email || u.id }}
                        </span>
                    </div>
                </li>
            </ul>

            <!-- Divider line -->
            <hr class="border-surface-high my-2" />
        </div>
    </div>
</template>
