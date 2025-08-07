<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Lab } from '@shared/db/lab';
import { useLabsStore } from '../../store/labs';
import SearchBar from '../../components/SearchBar.vue';

const props = defineProps<{
  lab: Lab | null;
}>();

const labs = useLabsStore();
const search = ref('');

const members = computed(() => {
  if (!props.lab) {
    return [];
  }
  return labs.getLab(props.lab.id)?.members ?? [];
});

const categorized = computed(() => {
  const map: Record<string, { id: number; name: string; avatar_url?: string | null }[]> = {};
  for (const m of members.value) {
    const category = m.member.roles[0]?.name ?? 'Member';
    if (!map[category]) {
      map[category] = [];
    }
    map[category].push({
      id: m.member.user_id,
      name: m.user?.name ?? '',
      avatar_url: m.user?.avatar_url,
    });
  }
  return map;
});

const filteredMembers = computed(() => {
  if (!search.value) {
    return categorized.value;
  }
  const lower = search.value.toLowerCase();
  const result: Record<string, { id: number; name: string; avatar_url?: string | null }[]> = {};
  for (const [category, users] of Object.entries(categorized.value)) {
    const filtered = users.filter((u) => u.name.toLowerCase().includes(lower));
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
          v-for="user in users"
          :key="user.id"
        >
          <div
            class="text-fg-primary flex items-center justify-start gap-3 rounded-xl p-2 transition-all duration-200 hover:text-black hover:shadow-md"
          >
            <img
              v-if="user.avatar_url"
              :src="user.avatar_url"
              class="h-7 w-7 flex-none rounded-full object-cover"
            />
            <div
              v-else
              class="h-7 w-7 flex-none rounded-full bg-gray-700"
            ></div>

            <span class="truncate text-sm">
              {{ user.name }}
            </span>
          </div>
        </li>
      </ul>

      <!-- Divider line -->
      <hr class="border-surface-high my-2" />
    </div>
  </div>
</template>
