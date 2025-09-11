<script setup lang="ts">
import { ref, computed, type ComputedRef } from 'vue';
import type { Lab, LabMember } from '@shared/db/lab';
import { useLabsStore } from '../../store/labs';
import SearchBar from '../../components/SearchBar.vue';
import UserAvatar from '../../components/UserAvatar.vue';
import { type User } from '@shared/db/user';

type RoleName = string;

// Create shared mapping type for role sorting on the sidebar. This is sorted by the highest rank first

const props = defineProps<{
    lab: Lab | null;
}>();

const labs = useLabsStore();
const search = ref('');

const members = computed(() => {
    return (props.lab && labs.getLabMembers(props.lab.id)) || [];
});

/**
 * TODO: This is going to bog down a user's client when a Lab is large. Update this to be more efficient
 * TODO: rendering of the user sidebar based on scrolling or pagination.
 */
const roles = computed(() => (props.lab ? labs.getLabRoles(props.lab.id) : []));

const categorized: ComputedRef<Record<RoleName, { member: LabMember; user: User }[]>> = computed(
    () => {
        const map: Record<RoleName, { member: LabMember; user: User }[]> = {};
        for (const m of members.value) {
            const user = labs.getUser(m.user_id);
            if (!user) {
                // TODO: For now this should be fetched from some sort of server
                // or short-term storage such as Redis. Come back to this later.
                continue;
            }

            // roles for a member are already ordered highest rank first (see backend ordering)
            const highestRole = m.roles[0];
            const key = highestRole?.name ?? 'everyone';
            (map[key] ??= []).push({ member: m, user });
        }

        return map;
    },
);

// Role name -> rank lookup (everyone lowest)
const roleRank = computed(() => {
    const out: Record<string, number> = { everyone: -Infinity };
    for (const r of roles.value) {
        out[r.name] = r.rank;
    }
    return out;
});

const filteredMembers = computed(() => {
    if (!search.value) {
        return categorized.value;
    }

    const lower = search.value.toLowerCase();
    const result: Record<string, { member: LabMember; user: User }[]> = {};
    for (const [category, members] of Object.entries(categorized.value)) {
        const filtered = members.filter((u) => (u.user.name || '').toLowerCase().includes(lower));
        if (filtered.length > 0) {
            result[category] = filtered;
        }
    }

    return result;
});

// Sorted array of categories with highest rank first
const sortedFilteredMembers = computed(() => {
    return Object.entries(filteredMembers.value)
        .map(([category, users]) => ({ category, users }))
        .sort((a, b) => {
            const ra = roleRank.value[a.category] ?? -Infinity;
            const rb = roleRank.value[b.category] ?? -Infinity;
            if (rb !== ra) {
                return rb - ra;
            } // higher rank first
            return a.category.localeCompare(b.category);
        });
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
            v-for="entry in sortedFilteredMembers"
            :key="entry.category"
            class="flex flex-col gap-2"
        >
            <!-- Category header -->
            <h3 class="text-fg-primary px-2 text-xs font-medium tracking-wide uppercase">
                {{ entry.category }}
            </h3>

            <!-- Users in this category -->
            <ul class="space-y-1">
                <li
                    v-for="u in entry.users"
                    :key="u.member.user_id"
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
                            {{ u.user?.name || u.user?.email || u.member.user_id }}
                        </span>
                    </div>
                </li>
            </ul>

            <!-- Divider line -->
            <hr class="border-surface-high my-2" />
        </div>
    </div>
</template>
