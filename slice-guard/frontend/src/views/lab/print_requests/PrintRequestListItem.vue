<script setup lang="ts">
import { type RequestItem } from './LabPrintRequests.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../../store/auth';

interface Props {
  entry: RequestItem
}

defineProps<Props>();

const route = useRoute();
const auth = useAuthStore();

const labId = computed(() => Number(route.params.id));
</script>

<template>
  <div class="bg-surface-low shadow-sm rounded-md max-w-72 p-3 space-y-2">
    <!-- Title and user avatar -->
    <div class="flex flex-row items-center justify-between">
      <!-- Title -->
      <h3 class="text-fg-primary font-medium text-md truncate text-pretty line-clamp-2 max-w-[80%]">
        This is an example title that should be truncated and is super duper long
      </h3>

      <!-- User avatar display. TODO: Actual user avatars -->
      <div class="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs text-fg-secondary">
        {{ entry.user?.name?.charAt(0) || '?' }}
      </div>
    </div>

    <!-- Ticket number, author name next to eachother in small gray-->
    <div class="space-y-1">
      <div class="text-xs text-fg-secondary">
        <span class="underline decoration-dashed">#{{ entry.request.id }}</span> by {{ entry.user?.name ||
          entry.user?.email || 'Unknown' }}
      </div>

      <!-- Human readable date of when this ticket was created (with time)-->
      <div class="text-xs text-fg-secondary flex items-center gap-1">
        <svg class="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {{ new Date(entry.request.created_at).toLocaleDateString() }} at {{ new
          Date(entry.request.created_at).toLocaleTimeString() }}
      </div>

      <!-- TODO: Tags of this request, each one being a pill and using the HEX code of the tag and its name -->
      <div>

      </div>
    </div>

    <!-- Description of the ticket, max 3 lines, truncated -->
    <div class="text-sm text-fg-secondary line-clamp-3">
      {{ entry.request.description }}
    </div>

    <!-- Action buttons -->
    <div class="flex flex-row gap-2">
      <!-- Dropdown to change the status of this ticket - closed, open, etc -->
      <!-- TODO use custom dropdown component -->

      <!-- Dropdown to assign tags to this request -->
      <!-- TODO use custom dropdown component for tag edits, select and unselect tags.
        Additionally, update the tags to have a custom HEX code that it used to help display colors easier. -->
    </div>
  </div>
</template>