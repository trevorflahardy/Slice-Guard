<script setup lang="ts">
import { type RequestItem } from './LabPrintRequests.vue';
import { apiFetch } from '../../../services/api'
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

async function toggleState(item: RequestItem) {
  const res = await apiFetch(`/labs/${labId.value}/requests/${item.request.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isClosed: !item.request.is_closed })
  })
  if (res.ok) {
    item.request.is_closed = !item.request.is_closed
  }
}
</script>

<template>
    <div class="bg-surface-low shadow-sm rounded-lg max-w-60">
        <!-- Top element that displays the title of the request and who created it below it. -->
        <div class="p-3">
            <h3 class="text-sm font-semibold text-fg-primary">Request Title Placeholder</h3>

            <!-- User avatar image and their name below it... placeholder avatar image now -->
            <div class="flex flex-row items-center space-x-1 mt-1">
                <img
                    class="w-4 h-4 rounded-full"
                    src="https://www.gravatar.com/avatar/placeholder?s=40&d=mp"
                    alt="User Avatar"
                />
                <span class="text-xs text-fg-secondary">{{ entry.user?.name || entry.user?.email }}</span>
            </div>
        </div>

        <!-- The main content of this entry. Displays important metadata about the request -->
        <div class="bg-surface p-5">
            <!-- The print time for this request. TODO: Has to be pulled from metadata -->
            <div class="text-center">
                <div class="font-semibold text-salem-700">
                    10.5 Hours
                </div>
            </div>
        </div>
    </div>

    <div class="bg-surface-low shadow-sm px-4 py-2 rounded-lg cursor-pointer hover:shadow-md">
        <div class="text-sm font-medium text-fg-primary">{{ entry.request.description }}</div>
        <div class="text-xs text-fg-secondary">{{ entry.user?.name || entry.user?.email }}</div>
        <div class="text-xs text-fg-tertiary">{{ new Date(entry.request.created_at).toLocaleString() }}</div>
        <button
          v-if="auth.user?.id === entry.request.user_id"
          @click.stop="toggleState(entry)"
          class="text-xs text-salem-800 underline"
        >
          {{ entry.request.is_closed ? 'Reopen' : 'Close' }}
        </button>
    </div>

</template>