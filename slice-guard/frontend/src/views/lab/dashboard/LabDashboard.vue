<script setup lang="ts">
import ThemeToggle from '../../../components/ThemeToggle.vue';
import { ref, computed, watch } from 'vue';
import { apiFetch } from '../../../services/api';
import Button from '../../../components/Button.vue';
import { useLabsStore } from '../../../store/labs';
import { computeMemberPermissions } from '../../../utils/permissions';
import { LabPermission, type LabRole } from '@shared/db/lab';
import { useRoute } from 'vue-router';
import RoleAssignmentPanel from './RoleAssignmentPanel.vue';

const labStore = useLabsStore();
const route = useRoute();
const routeLabId = computed(() => Number(route.params.id));

const lab = computed(() => labStore.getLab(routeLabId.value));

// Tag management fields
const tagName = ref('');
const tagColor = ref('#000000');

const invites = computed(() => {
    if (!lab.value) {
        return [];
    }

    return labStore.getLabInvites(lab.value.id) || [];
});

const members = computed(() => {
    if (!lab.value) {
        return [];
    }
    return labStore
        .getLabMembers(lab.value.id)
        .map((m) => ({ member: m, user: labStore.getUser(m.user_id) }));
});

const roles = computed(() => {
    if (!lab.value) {
        return [];
    }
    return labStore.getLabRoles(lab.value.id) || [];
});

const channels = computed(() => {
    if (!lab.value) {
        return [];
    }
    return labStore.getLabChannels(lab.value.id) || [];
});

/**
 * Aggregate cache information across all labs for debug display.
 */
const cacheStats = computed(() => {
    let totalChannels = 0;
    let channelsWithMessages = 0;
    let totalMessages = 0;

    // Sum all channels across labs
    for (const channelMap of labStore.channels.values()) {
        totalChannels += channelMap.size;
    }

    // Sum message counts across all channels
    for (const msgMap of labStore.messages.values()) {
        channelsWithMessages += msgMap.size;
        for (const msgs of msgMap.values()) {
            totalMessages += msgs.length;
        }
    }

    return {
        totalLabs: labStore.labs.size,
        totalChannels,
        channelsWithMessages,
        totalMessages,
    };
});

const PERMISSION_OPTIONS = [
    { value: LabPermission.EDIT_LAB, label: 'Edit Lab' },
    { value: LabPermission.MANAGE_ROLES, label: 'Manage Roles' },
    { value: LabPermission.REMOVE_USER, label: 'Remove User' },
    { value: LabPermission.DELETE_LAB, label: 'Delete Lab' },
    { value: LabPermission.CREATE_REQUEST, label: 'Create Request' },
    { value: LabPermission.MANAGE_REQUESTS, label: 'Manage Requests' },
    { value: LabPermission.READ, label: 'Read' },
    { value: LabPermission.WRITE, label: 'Write' },
    { value: LabPermission.CREATE_INVITES, label: 'Create Invites' },
    { value: LabPermission.MANAGE_INVITES, label: 'Manage Invites' },
];

/**
 * Convert a bitmask of permissions into an array of option values.
 */
function bitsToArray(bits: number) {
    return PERMISSION_OPTIONS.filter((p) => (Number(bits) & p.value) !== 0).map((p) => p.value);
}

/**
 * Collapse an array of permission values into a bitmask.
 */
function arrayToBits(arr: number[]) {
    return arr.reduce((acc, v) => acc | v, 0);
}

const roleSelections = ref<Record<number, number[]>>({});

watch(
    roles,
    (rs) => {
        for (const r of rs) {
            roleSelections.value[r.id] = bitsToArray(r.permissions as number);
        }
    },
    { immediate: true },
);

/**
 * Persist permission changes for a given role.
 */
async function updateRolePermissions(role: LabRole) {
    if (!lab.value) {
        return;
    }
    const perms = arrayToBits(roleSelections.value[role.id] || []);
    const res = await apiFetch(`/labs/${lab.value.id}/roles/${role.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: perms }),
    });
    const updated = await res.json();

    labStore.updateRole(lab.value.id, updated);
}

/**
 * Create a new tag with a custom color.
 */
async function createTag() {
    if (!lab.value) {
        return;
    }
    await apiFetch(`/labs/${lab.value.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: tagName.value,
            color: tagColor.value,
            isDefault: false,
        }),
    });
    tagName.value = '';
    tagColor.value = '#000000';
}

async function deleteRole(role: LabRole) {
    if (!lab.value) {
        return;
    }

    await apiFetch(`/labs/${lab.value.id}/roles/${role.id}`, {
        method: 'DELETE',
    });
}
</script>

<template>
    <ThemeToggle
        class="mt-4"
        variant="secondary"
    />

    <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Tag management -->
        <div class="bg-surface-low space-y-4 rounded-lg p-4">
            <h2 class="text-fg-primary font-semibold">Tags</h2>
            <div class="flex items-center gap-2">
                <input
                    v-model="tagName"
                    placeholder="Tag name"
                    class="bg-surface text-fg-primary flex-1 rounded-md px-2 py-1"
                />
                <input
                    v-model="tagColor"
                    type="color"
                    class="h-9 w-9 cursor-pointer rounded-md border-none bg-transparent p-0"
                />
                <Button
                    variant="secondary"
                    @click="createTag"
                    >Create</Button
                >
            </div>
        </div>

        <!-- Cache statistics -->
        <div class="bg-surface-low space-y-4 rounded-lg p-4">
            <h2 class="text-fg-primary font-semibold">Cache State</h2>
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div class="text-center">
                    <p class="text-fg-secondary text-xs">Labs</p>
                    <p class="text-fg-primary font-medium">{{ cacheStats.totalLabs }}</p>
                </div>
                <div class="text-center">
                    <p class="text-fg-secondary text-xs">Channels</p>
                    <p class="text-fg-primary font-medium">{{ cacheStats.totalChannels }}</p>
                </div>
                <div class="text-center">
                    <p class="text-fg-secondary text-xs">Channels w/ Messages</p>
                    <p class="text-fg-primary font-medium">{{ cacheStats.channelsWithMessages }}</p>
                </div>
                <div class="text-center">
                    <p class="text-fg-secondary text-xs">Messages Cached</p>
                    <p class="text-fg-primary font-medium">{{ cacheStats.totalMessages }}</p>
                </div>
            </div>
        </div>

        <!-- Invites -->
        <div class="bg-surface-low space-y-4 rounded-lg p-4 lg:col-span-2">
            <h2 class="text-fg-primary font-semibold">Invites</h2>
            <table class="w-full text-sm">
                <thead class="text-fg-secondary">
                    <tr>
                        <th class="text-left">Code</th>
                        <th class="text-left">Uses</th>
                        <th class="text-left">Max</th>
                        <th class="text-left">Expires</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="i in invites"
                        :key="i.id"
                        class="text-fg-primary"
                    >
                        <td>{{ i.code }}</td>
                        <td>{{ i.uses }}</td>
                        <td>{{ i.max_uses ?? '∞' }}</td>
                        <td>
                            {{ i.expires_at ? new Date(i.expires_at).toLocaleString() : 'never' }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Roles -->
        <div class="bg-surface-low space-y-4 rounded-lg p-4 lg:col-span-2">
            <h2 class="text-fg-primary font-semibold">Roles</h2>
            <div
                v-for="r in roles"
                :key="r.id"
                class="border-surface-high mb-4 space-y-5 rounded-md border p-4 last:mb-0"
            >
                <h3 class="text-fg-primary mb-2 text-xl font-semibold">{{ r.name }}</h3>
                <p class="text-fg-primary">Rank: {{ r.rank }}</p>

                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label
                        v-for="opt in PERMISSION_OPTIONS"
                        :key="opt.value"
                        class="flex items-center gap-2"
                    >
                        <input
                            v-model="roleSelections[r.id]"
                            type="checkbox"
                            :value="opt.value"
                            class="border-surface-high bg-surface-low text-primary focus:ring-primary rounded"
                        />
                        <span class="text-fg-primary text-sm">{{ opt.label }}</span>
                    </label>
                </div>
                <Button
                    class="mt-2"
                    variant="secondary"
                    @click="updateRolePermissions(r)"
                >
                    Save
                </Button>

                <Button
                    class="mt-2"
                    variant="secondary"
                    @click="deleteRole(r)"
                >
                    Delete
                </Button>
            </div>
        </div>

        <!-- Role Assignment Panel -->
        <RoleAssignmentPanel
            :lab-id="lab?.id || null"
            class="lg:col-span-2"
        />

        <!-- Members -->
        <div class="bg-surface-low space-y-4 rounded-lg p-4 lg:col-span-2">
            <h2 class="text-fg-primary font-semibold">Members</h2>
            <table class="w-full text-sm">
                <thead class="text-fg-secondary">
                    <tr>
                        <th class="text-left">Member</th>
                        <th class="text-left">Permissions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="m in members"
                        :key="m.member.user_id"
                        class="text-fg-primary"
                    >
                        <td>{{ m.user?.name || m.user?.email || m.member.user_id }}</td>
                        <td>{{ computeMemberPermissions(m.member) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Channels -->
        <div class="bg-surface-low space-y-4 rounded-lg p-4 lg:col-span-2">
            <h2 class="text-fg-primary font-semibold">Channels</h2>
            <table class="w-full text-sm">
                <thead class="text-fg-secondary">
                    <tr>
                        <th class="text-left">ID</th>
                        <th class="text-left">Name</th>
                        <th class="text-left">Type</th>
                        <th class="text-left">Category</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="c in channels"
                        :key="c.id"
                        class="text-fg-primary"
                    >
                        <td>{{ c.id }}</td>
                        <td>{{ c.name }}</td>
                        <td>{{ c.type }}</td>
                        <td>{{ c.category_id ?? '-' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
