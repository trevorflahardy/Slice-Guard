<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLabsStore } from '../../store/labs';
import { useAuthStore } from '../../store/auth';
import { apiFetch } from '../../services/api';
import Button from '../../components/Button.vue';
import { LabPermission, type LabRole } from '@shared/db/lab';
import { useSortable } from '@vueuse/integrations/useSortable';
import MockChannelMessage from '../../components/channels/MockChannelMessage.vue';
import { Bars3Icon } from '@heroicons/vue/24/outline';

const route = useRoute();
const labs = useLabsStore();
const auth = useAuthStore();

const labId = Number(route.params.id);
const roles = computed(() => labs.getLabRoles(labId));
const roleList = ref<LabRole[]>([]);
const selectedId = ref<number | null>(null);

watch(
    roles,
    (val) => {
        roleList.value = [...val].sort((a, b) => b.rank - a.rank);
        if (!selectedId.value && roleList.value.length > 0) {
            selectedId.value = roleList.value[0].id;
        }
    },
    { immediate: true },
);

const member = labs.members.get(labId)?.get(auth.user?.id ?? 0) ?? null;
const topRank = member?.roles[0]?.rank ?? 0;

const selectedRole = computed(() => roleList.value.find((r) => r.id === selectedId.value) || null);

const roleName = ref('');
const roleColor = ref<string>('#000000');
const permMask = ref<number>(0);

watch(selectedRole, (r) => {
    if (r) {
        roleName.value = r.name;
        roleColor.value = r.color || '#000000';
        permMask.value = Number(r.permissions);
    }
});

function togglePerm(bit: number) {
    permMask.value ^= bit;
}

const editable = computed(() => !!selectedRole.value && selectedRole.value.rank <= topRank);

const listEl = ref<HTMLElement | null>(null);

useSortable(listEl, roleList, {
    animation: 150,
    draggable: '.draggable',
    onEnd: async (evt) => {
        const firstEditable = roleList.value.findIndex((r) => r.rank <= topRank);
        if (evt.newIndex < firstEditable) {
            roleList.value = [...roleList.value].sort((a, b) => b.rank - a.rank);
            return;
        }
        const total = roleList.value.length;
        const updates: { id: number; rank: number; permissions: number }[] = [];
        roleList.value.forEach((r, idx) => {
            const newRank = total - idx;
            if (r.rank !== newRank) {
                if (r.rank <= topRank) {
                    updates.push({ id: r.id, rank: newRank, permissions: Number(r.permissions) });
                }
                r.rank = newRank;
            }
        });
        for (const u of updates) {
            await apiFetch(`/labs/${labId}/roles/${u.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions: u.permissions, rank: u.rank }),
            });
        }
    },
});

const PERMS = [
    { bit: LabPermission.EDIT_LAB, label: 'Edit Lab', desc: 'Change basic lab info.' },
    { bit: LabPermission.MANAGE_ROLES, label: 'Manage Roles', desc: 'Create or modify roles.' },
    { bit: LabPermission.REMOVE_USER, label: 'Remove Users', desc: 'Kick members from the lab.' },
    { bit: LabPermission.DELETE_LAB, label: 'Delete Lab', desc: 'Delete this lab permanently.' },
    {
        bit: LabPermission.CREATE_REQUEST,
        label: 'Create Requests',
        desc: 'Submit new print requests.',
    },
    {
        bit: LabPermission.MANAGE_REQUESTS,
        label: 'Manage Requests',
        desc: 'Approve or deny requests.',
    },
    { bit: LabPermission.READ, label: 'Read Messages', desc: 'View messages and requests.' },
    { bit: LabPermission.WRITE, label: 'Send Messages', desc: 'Send messages and requests.' },
    {
        bit: LabPermission.CREATE_INVITES,
        label: 'Create Invites',
        desc: 'Generate invites to the lab.',
    },
    {
        bit: LabPermission.MANAGE_INVITES,
        label: 'Manage Invites',
        desc: 'Update or revoke invites.',
    },
];

async function save() {
    if (!selectedRole.value) {
        return;
    }
    await apiFetch(`/labs/${labId}/roles/${selectedRole.value.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: roleName.value,
            color: roleColor.value,
            permissions: permMask.value,
            rank: selectedRole.value.rank,
        }),
    });
}

async function createRole() {
    const res = await apiFetch(`/labs/${labId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'new role',
            color: '#888888',
            permissions: 0,
            rank: topRank,
        }),
    });
    if (res.ok) {
        const role: LabRole = await res.json();
        selectedId.value = role.id;
    }
}

async function removeRole() {
    if (!selectedRole.value) {
        return;
    }
    await apiFetch(`/labs/${labId}/roles/${selectedRole.value.id}`, { method: 'DELETE' });
    selectedId.value = roleList.value[0]?.id ?? null;
}
</script>
<template>
    <div class="flex gap-4">
        <aside class="border-surface-high w-48 border-r pr-2">
            <ul
                ref="listEl"
                class="flex flex-col gap-1"
            >
                <li
                    v-for="r in roleList"
                    :key="r.id"
                    class="hover:bg-surface-high flex cursor-pointer items-center gap-2 rounded p-2"
                    :class="[
                        { 'bg-surface-high': selectedId === r.id },
                        r.rank <= topRank ? 'draggable' : '',
                    ]"
                    @click="selectedId = r.id"
                >
                    <Bars3Icon
                        v-if="r.rank <= topRank"
                        class="text-content-dimmed h-4 w-4 flex-shrink-0 cursor-move"
                    />
                    <span>{{ r.name }}</span>
                </li>
            </ul>
            <Button
                variant="secondary"
                class="mt-2 w-full"
                @click="createRole"
                >New Role</Button
            >
        </aside>
        <div
            v-if="selectedRole"
            class="flex flex-1 flex-col gap-4"
            :class="!editable ? 'pointer-events-none opacity-50' : ''"
        >
            <label class="flex flex-col gap-1">
                <span>Name</span>
                <input
                    v-model="roleName"
                    class="bg-surface-high rounded p-2"
                />
            </label>
            <div class="flex flex-col gap-2">
                <label class="flex items-center gap-2">
                    <span>Color</span>
                    <input
                        v-model="roleColor"
                        type="color"
                        class="h-8 w-16 border-none p-0"
                    />
                </label>
                <div class="bg-surface-high max-h-40 rounded p-2">
                    <MockChannelMessage
                        :name="auth.user?.name || 'User'"
                        :color="roleColor"
                        content="This is how a message will look."
                    />
                    <MockChannelMessage
                        name="Other member"
                        color="#888888"
                        content="Another message for context."
                    />
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <h3 class="font-semibold">Permissions</h3>
                <label
                    v-for="p in PERMS"
                    :key="p.bit"
                    class="flex cursor-pointer items-center gap-2"
                >
                    <input
                        type="checkbox"
                        :checked="(permMask & p.bit) !== 0"
                        @change="togglePerm(p.bit)"
                    />
                    <div>
                        <div class="font-medium">{{ p.label }}</div>
                        <div class="text-content-dimmed text-sm">{{ p.desc }}</div>
                    </div>
                </label>
            </div>
            <div class="mt-auto flex justify-between">
                <Button
                    variant="danger"
                    @click="removeRole"
                    >Delete</Button
                >
                <Button
                    variant="primary"
                    @click="save"
                    >Save</Button
                >
            </div>
        </div>
        <div
            v-else
            class="flex-1"
        />
    </div>
</template>
