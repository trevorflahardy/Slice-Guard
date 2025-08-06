<script setup lang="ts">
import { type RequestItem } from "./LabPrintRequests.vue";
import { computed, ref, toRef, watch } from "vue";
import { useRoute } from "vue-router";
import Dropdown from "../../../components/Dropdown.vue";
import { apiFetch } from "../../../services/api";
import type { RequestTag } from "@shared/db/request";
import { PlusCircleIcon } from "@heroicons/vue/16/solid";
import { useLabsStore } from "../../../store/labs";
import { useAuthStore } from "../../../store/auth";
import { hasLabPermission } from "../../../utils/permissions";
import { LabPermission } from "@shared/db/lab";

interface Props {
  entry: RequestItem;
}

const props = defineProps<Props>();
const entry = toRef(props, "entry");

const route = useRoute();

const labId = computed(() => Number(route.params.id));

const statusOptions = [
  { id: "open", name: "Open" },
  { id: "closed", name: "Closed" },
];

const labs = useLabsStore();
const auth = useAuthStore();
const allTags = computed<RequestTag[]>(() => labs.getLab(labId.value)?.tags ?? []);

const perms = computed(() => labs.getLab(labId.value)?.permissions ?? null);
const canManage = computed(() =>
  entry.value.request.user_id === auth.user?.id ||
  hasLabPermission(perms.value, LabPermission.MANAGE_REQUESTS)
);

// Local state
const statusModel = ref(entry.value.request.is_closed ? "closed" : "open");
const tagIds = ref<(number | string)[]>(entry.value.tags.map((t) => t.id));

function arraysEqual(a: (number | string)[], b: (number | string)[]) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

watch(entry, (val) => {
  const newStatus = val.request.is_closed ? "closed" : "open";
  if (statusModel.value !== newStatus) {
    statusModel.value = newStatus;
  }
  const newTagIds = val.tags.map((t) => t.id);
  if (!arraysEqual(tagIds.value, newTagIds)) {
    tagIds.value = newTagIds;
  }
});

watch(statusModel, async (val, old) => {
  const current = entry.value.request.is_closed ? "closed" : "open";
  // Ignore updates coming from external changes
  if (val === current) return;

  if (!canManage.value) {
    // Revert to actual state if user cannot manage requests
    statusModel.value = current;
    return;
  }

  const res = await apiFetch(`/labs/${labId.value}/requests/${entry.value.request.id}`, {
    method: "PATCH",
    body: JSON.stringify({ isClosed: val === "closed" }),
  });
  if (res.ok) {
    entry.value.request.is_closed = val === "closed";
  } else {
    // Revert to server value on failure
    statusModel.value = current;
  }
});

watch(tagIds, async (val, old) => {
  const currentIds = entry.value.tags.map((t) => t.id);
  // Ignore updates that mirror current tags (e.g. from websocket patches)
  if (arraysEqual(val as (number | string)[], currentIds)) return;

  if (!canManage.value) {
    // Revert to actual tags if user lacks permission
    tagIds.value = currentIds;
    return;
  }

  const valNums = val as number[];
  const oldNums = old as number[];
  const added = valNums.filter((id) => !oldNums.includes(id));
  const removed = oldNums.filter((id) => !valNums.includes(id));
  if (!added.length && !removed.length) return;

  try {
    for (const id of added) {
      await apiFetch(`/labs/${labId.value}/requests/${entry.value.request.id}/tags/${id}`, {
        method: "POST",
        body: JSON.stringify({ assign: true }),
      });
    }
    for (const id of removed) {
      await apiFetch(`/labs/${labId.value}/requests/${entry.value.request.id}/tags/${id}`, {
        method: "POST",
        body: JSON.stringify({ assign: false }),
      });
    }
    entry.value.tags = allTags.value.filter((t) => valNums.includes(t.id));
  } catch {
    tagIds.value = old;
  }
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

      <TransitionGroup appear name="tag-bubble" tag="div" class="flex flex-wrap gap-1 items-center justify-start">
        <span v-for="tag in entry.tags" :key="tag.id" class="px-2 h-5 rounded-full text-xs text-white flex items-center"
          :style="{ backgroundColor: tag.color }">{{
            tag.name }}
        </span>
        <!-- Add tag button -->
        <Dropdown v-if="canManage" v-model="tagIds" :options="tagOptions" :multiple="true">
          <template #activator>
            <PlusCircleIcon class="h-5 w-5 text-surface-high drop-shadow-sm" />
          </template>
        </Dropdown>
      </TransitionGroup>
    </div>

    <!-- Description of the ticket, max 3 lines, truncated -->
    <div class="text-sm text-fg-secondary line-clamp-3 mt-auto text-pretty text-left">
      {{ entry.request.description }}
    </div>

    <!-- Action buttons -->
    <div class="flex flex-row gap-2 items-center">
      <Dropdown v-if="canManage" v-model="statusModel" :options="statusOptions" placeholder="Status" />
      <span v-else class="text-xs text-fg-secondary">{{ statusModel === 'open' ? 'Open' : 'Closed' }}</span>
    </div>
  </div>
</template>

<style scoped>
.tag-bubble-enter-active,
.tag-bubble-leave-active {
  transition: all 0.2s ease;
}

.tag-bubble-leave-active {
  position: absolute;
}

.tag-bubble-enter-from,
.tag-bubble-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.tag-bubble-enter-to,
.tag-bubble-leave-from {
  opacity: 1;
  transform: scale(1);
}

.tag-bubble-move {
  transition: transform 0.2s ease;
}
</style>
