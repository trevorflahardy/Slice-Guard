<script setup lang="ts">
import { type RequestItem } from './LabPrintRequests.vue';
import { computed, ref, toRef, watch, type Ref } from 'vue';
import { useRoute } from 'vue-router';
import Dropdown from '../../../components/Dropdown.vue';
import { apiFetch } from '../../../services/api';
import type { RequestTag } from '@shared/db/request';
import { PlusCircleIcon } from '@heroicons/vue/16/solid';
import { useLabsStore } from '../../../store/labs';
import { useAuthStore } from '../../../store/auth';
import { hasLabPermission } from '../../../utils/permissions';
import { LabPermission } from '@shared/db/lab';
import UserAvatar from '../../../components/UserAvatar.vue';
import { watchArray } from '@vueuse/core';

interface Props {
    entry: RequestItem;
}

const props = defineProps<Props>();
const entry: Ref<RequestItem> = toRef(props, 'entry');

const route = useRoute();
const labId = computed(() => Number(route.params.id));

const statusOptions = [
    { id: 'open', name: 'Open' },
    { id: 'closed', name: 'Closed' },
];

const labs = useLabsStore();
const auth = useAuthStore();
const allTags = computed<RequestTag[]>(() => labs.getLabTags(labId.value) ?? []);

const perms = computed(() => labs.getLabPermissions(labId.value));
const canManage = computed(
    () =>
        entry.value.request.user_id === auth.user?.id ||
        hasLabPermission(perms.value, LabPermission.MANAGE_REQUESTS),
);

// Local state
const statusModel = ref(entry.value.request.is_closed ? 'closed' : 'open');
const tagIds = ref<(number | string)[]>(entry.value.tags.map((t) => t.id));

function arraysEqual(a: (number | string)[], b: (number | string)[]) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

watch(entry, (val) => {
    const newStatus = val.request.is_closed ? 'closed' : 'open';
    if (statusModel.value !== newStatus) {
        statusModel.value = newStatus;
    }
    const newTagIds = val.tags.map((t) => t.id);
    if (!arraysEqual(tagIds.value, newTagIds)) {
        tagIds.value = newTagIds;
    }
});

watch(statusModel, async (val) => {
    const current = entry.value.request.is_closed ? 'closed' : 'open';
    // Ignore updates coming from external changes
    if (val === current) {
        return;
    }

    if (!canManage.value) {
        // Revert to actual state if user cannot manage requests
        statusModel.value = current;
        return;
    }

    const res = await apiFetch(`/labs/${labId.value}/requests/${entry.value.request.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isClosed: val === 'closed' }),
    });
    if (res.ok) {
        entry.value.request.is_closed = val === 'closed';
    } else {
        // Revert to server value on failure
        statusModel.value = current;
    }
});

watchArray(tagIds, async (__newList, oldList, added, removed) => {
    if (!canManage.value) {
        // Revert to actual tags if user lacks permission
        tagIds.value = oldList;
        return;
    }

    for (const id of added) {
        await apiFetch(`/labs/${labId.value}/requests/${entry.value.request.id}/tags/${id}`, {
            method: 'POST',
            body: JSON.stringify({ assign: true }),
        });
    }

    for (const id of removed) {
        await apiFetch(`/labs/${labId.value}/requests/${entry.value.request.id}/tags/${id}`, {
            method: 'POST',
            body: JSON.stringify({ assign: false }),
        });
    }

    entry.value.tags = allTags.value.filter((t) => tagIds.value.includes(t.id));
});

const tagOptions = computed(() => allTags.value.map((t) => ({ id: t.id, name: t.name })));

const author = computed(
    () => entry.value.user ?? labs.getUser(entry.value.request.user_id) ?? null,
);
</script>

<template>
    <div
        class="bg-surface shadow-surface-high dark:outline-surface-high dark:shadow-surface flex w-full flex-col gap-2 rounded-xl p-3 shadow-sm dark:outline-1"
    >
        <!-- Title and user avatar -->
        <div class="flex flex-row items-center justify-between">
            <!-- Title -->
            <h3
                class="text-fg-primary text-md line-clamp-2 max-w-[80%] truncate font-medium text-pretty"
            >
                {{ entry.request.title || '[No title given]' }}
            </h3>

            <UserAvatar
                v-if="author"
                :user="author"
                size="size-8"
            />
            <div
                v-else
                class="text-fg-secondary flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs"
            >
                ?
            </div>
        </div>

        <!-- Ticket number, author name next to each other in small gray-->
        <div class="space-y-1">
            <div class="text-fg-secondary text-xs">
                <span class="underline decoration-dashed">#{{ entry.request.id }}</span>
                by {{ author?.name || author?.email || 'Unknown' }}
            </div>

            <!-- Human readable date of when this ticket was created (with time)-->
            <div class="text-fg-secondary flex items-center gap-1 text-xs">
                <svg
                    class="h-3 w-3 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                </svg>
                {{ new Date(entry.request.created_at).toLocaleDateString() }} at
                {{ new Date(entry.request.created_at).toLocaleTimeString() }}
            </div>

            <TransitionGroup
                appear
                name="tag-bubble"
                tag="div"
                class="flex flex-wrap items-center justify-start gap-1"
            >
                <span
                    v-for="tag in entry.tags"
                    :key="tag.id"
                    class="flex h-5 items-center rounded-full px-2 text-xs text-white"
                    :style="{ backgroundColor: tag.color }"
                    >{{ tag.name }}
                </span>

                <!-- Add tag button -->
                <Dropdown
                    v-if="canManage"
                    v-model="tagIds"
                    :options="tagOptions"
                    :multiple="true"
                >
                    <template #activator>
                        <PlusCircleIcon class="text-surface-highest h-5 w-5 drop-shadow-sm" />
                    </template>
                </Dropdown>
            </TransitionGroup>
        </div>

        <!-- Description of the ticket, max 3 lines, truncated -->
        <div
            class="mt-auto line-clamp-3 text-left text-sm text-pretty"
            :class="[
                entry.request.description && entry.request.description?.length < 30
                    ? 'text-fg-secondary'
                    : 'from-fg-secondary to-fg-tertiary bg-gradient-to-b bg-clip-text text-transparent',
            ]"
        >
            {{ entry.request.description }}
        </div>

        <!-- Action buttons -->
        <div class="flex flex-row items-center gap-2">
            <Dropdown
                v-if="canManage"
                v-model="statusModel"
                :options="statusOptions"
                placeholder="Status"
            />
            <span
                v-else
                class="text-fg-secondary text-xs"
                >{{ statusModel === 'open' ? 'Open' : 'Closed' }}</span
            >
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
