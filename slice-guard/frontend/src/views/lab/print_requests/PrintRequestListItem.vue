<script setup lang="ts">
import { type RequestItem } from "./LabPrintRequests.vue";
import { computed, ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import Dropdown from "../../../components/Dropdown.vue";
import { apiFetch } from "../../../services/api";
import type { RequestTag } from "@shared/db/request";
import { PlusCircleIcon } from "@heroicons/vue/16/solid";

interface Props {
  entry: RequestItem;
}

const props = defineProps<Props>();
const entry = props.entry;

const route = useRoute();

const labId = computed(() => Number(route.params.id));

const statusOptions = [
  { id: "open", name: "Open" },
  { id: "closed", name: "Closed" },
];

const statusModel = ref(entry.request.is_closed ? "closed" : "open");

const allTags = ref<RequestTag[]>([]);
const tagIds = ref<(number | string)[]>(entry.tags.map((t) => t.id));

async function fetchTags() {
  const res = await apiFetch(`/labs/${labId.value}/tags`);
  if (res.ok) allTags.value = await res.json();
}

onMounted(fetchTags);

watch(statusModel, async (val) => {
  await apiFetch(`/labs/${labId.value}/requests/${entry.request.id}`, {
    method: "PATCH",
    body: JSON.stringify({ isClosed: val === "closed" }),
  });
  entry.request.is_closed = val === "closed";
});

watch(tagIds, async (val, old) => {
  const added = (val as number[]).filter(
    (id) => !(old as number[]).includes(id)
  );
  const removed = (old as number[]).filter(
    (id) => !(val as number[]).includes(id)
  );
  for (const id of added) {
    await apiFetch(
      `/labs/${labId.value}/requests/${entry.request.id}/tags/${id}`,
      {
        method: "POST",
        body: JSON.stringify({ assign: true }),
      }
    );
  }
  for (const id of removed) {
    await apiFetch(
      `/labs/${labId.value}/requests/${entry.request.id}/tags/${id}`,
      {
        method: "POST",
        body: JSON.stringify({ assign: false }),
      }
    );
  }
  entry.tags = allTags.value.filter((t) => (val as number[]).includes(t.id));
});

const tagOptions = computed(() =>
  allTags.value.map((t) => ({ id: t.id, name: t.name }))
);
</script>

<template>
  <div class="bg-surface-low shadow-xs shadow-surface-high rounded-xl w-full p-3 flex flex-col gap-2">
    <!-- Title and user avatar -->
    <div class="flex flex-row items-center justify-between">
      <!-- Title -->
      <h3 class="text-fg-primary font-medium text-md truncate text-pretty line-clamp-2 max-w-[80%]">
        {{ entry.request.title || "[No title given]" }}
      </h3>

      <img v-if="entry.user?.avatar_url" :src="entry.user.avatar_url" class="w-8 h-8 rounded-full object-cover" />
      <div v-else class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs text-fg-secondary">
        {{ entry.user?.name?.charAt(0) || "?" }}
      </div>
    </div>

    <!-- Ticket number, author name next to each other in small gray-->
    <div class="space-y-1">
      <div class="text-xs text-fg-secondary">
        <span class="underline decoration-dashed">#{{ entry.request.id }}</span>
        by {{ entry.user?.name || entry.user?.email || "Unknown" }}
      </div>

      <!-- Human readable date of when this ticket was created (with time)-->
      <div class="text-xs text-fg-secondary flex items-center gap-1">
        <svg class="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {{ new Date(entry.request.created_at).toLocaleDateString() }} at
        {{ new Date(entry.request.created_at).toLocaleTimeString() }}
      </div>

      <div class="flex flex-wrap gap-1 items-center justify-start">
        <span v-for="tag in entry.tags" :key="tag.id" class="px-2 h-5 rounded-full text-xs text-white flex items-center"
          :style="{ backgroundColor: tag.color }">{{ tag.name }}
        </span>

        <!-- Add tag button -->
        <Dropdown v-model="tagIds" :options="tagOptions" :multiple="true">
          <template #activator>
            <PlusCircleIcon class="h-5 w-5 text-surface-high drop-shadow-sm" />
          </template>
        </Dropdown>
      </div>
    </div>

    <!-- Description of the ticket, max 3 lines, truncated -->
    <div class="text-sm text-fg-secondary line-clamp-3">
      {{ entry.request.description }}
    </div>

    <!-- Action buttons -->
    <div class="flex flex-row gap-2 items-center mt-auto">
      <Dropdown v-model="statusModel" :options="statusOptions" placeholder="Status" />
    </div>
  </div>
</template>
