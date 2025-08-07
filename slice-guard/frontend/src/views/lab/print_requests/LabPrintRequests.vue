<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { RequestTag } from '@shared/db/request';
import type { PrintRequestEvent } from '@shared/payloads/ws';
import Dropdown from '../../../components/Dropdown.vue';
import PrintRequestListItem from './PrintRequestListItem.vue';
import { useLabsStore } from '../../../store/labs';

export interface RequestItem extends PrintRequestEvent {}

const route = useRoute();
const labs = useLabsStore();
const labId = computed(() => Number(route.params.id));
const lab = computed(() => labs.getLab(labId.value));

const requests = computed<RequestItem[]>(() => lab.value?.requests ?? []);
const tags = computed<RequestTag[]>(() => lab.value?.tags ?? []);

const search = ref('');
const tagFilter = ref<(number | string)[]>([]);
const from = ref('');
const to = ref('');
const stateFilter = ref<'all' | 'open' | 'closed'>('all');

const tagOptions = computed(() => tags.value.map((tag) => ({ id: tag.id, name: tag.name })));

const filtered = computed(() => {
  return requests.value
    .filter(
      (r) =>
        !search.value ||
        r.request.description?.toLowerCase().includes(search.value.toLowerCase()) ||
        r.user?.name?.toLowerCase().includes(search.value.toLowerCase()),
    )
    .filter((r) => {
      if (!tagFilter.value || tagFilter.value.length === 0) {
        return true;
      }
      return r.tags.some((t) => tagFilter.value.includes(t.id));
    })
    .filter((r) => {
      if (from.value && new Date(r.request.created_at) < new Date(from.value)) {
        return false;
      }
      if (to.value && new Date(r.request.created_at) > new Date(to.value)) {
        return false;
      }
      return true;
    })
    .filter((r) => {
      if (stateFilter.value === 'open') {
        return !r.request.is_closed;
      }
      if (stateFilter.value === 'closed') {
        return r.request.is_closed;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.request.is_closed !== b.request.is_closed) {
        return a.request.is_closed ? 1 : -1;
      }
      return new Date(b.request.created_at).getTime() - new Date(a.request.created_at).getTime();
    });
});

const selectClass = 'bg-surface-low px-2 py-1 rounded-md text-fg-primary';
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-fg-primary text-2xl font-semibold">Print Requests</h1>
      <p class="text-fg-secondary">Manage and track all print requests.</p>
    </div>

    <!-- The search bar. Spans the entire width of the element and allows you to easily search many things -->
    <div class="bg-surface-low flex w-full items-center gap-2 rounded-lg px-3 py-2">
      <svg
        class="text-fg-secondary h-5 w-5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        ></path>
      </svg>

      <input
        v-model="search"
        placeholder="Search requests, users, descriptions..."
        class="text-fg-primary placeholder-fg-secondary flex-1 bg-transparent outline-none"
      />
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <Dropdown
        v-model="tagFilter"
        :options="tagOptions"
        placeholder="All Tags"
        :multiple="true"
      />

      <input
        v-model="from"
        type="date"
        :class="selectClass"
      />
      <input
        v-model="to"
        type="date"
        :class="selectClass"
      />

      <Dropdown
        v-model="stateFilter"
        :options="[
          { id: 'all', name: 'All' },
          { id: 'open', name: 'Open' },
          { id: 'closed', name: 'Closed' },
        ]"
        placeholder="All States"
        :multiple="false"
      />
    </div>

    <TransitionGroup
      ref="gridRef"
      name="grid"
      tag="div"
      :class="[
        'grid auto-rows-fr gap-5 transition-all duration-300',
        'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
      ]"
    >
      <PrintRequestListItem
        v-for="(item, index) in filtered"
        :key="item.request.id"
        :entry="item"
        class="grid-item"
        :style="{
          transitionDelay: `${index * 70}ms`,
        }"
      />
    </TransitionGroup>
  </div>
</template>

<!--TODO: Fix the resizing issue: content snaps when zooming in or out on a browser - the content does not resize nicely and has this weird transition where the text tries to smoothly expand bigger or contract smaller BUT does so to the wrong size causing it to snap back to its actual size after the transition is done. Fix so the adjustment is smooth between sizes-->
<style scoped>
.grid-item {
  /* Add these to prevent stretching */
  max-width: 100%;
  min-height: 200px;
  /* Set a reasonable minimum height */
  height: fit-content;
  box-sizing: border-box;
}

.grid-enter-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.grid-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  z-index: -1;
}

/* More subtle enter/leave effects */
.grid-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.grid-leave-to {
  opacity: 0;
}
</style>
