<script setup lang="ts">
import { ref, computed, watch, type ComputedRef, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';
import { useLabsStore } from '../../../store/labs';
import { useAuthStore } from '../../../store/auth';
import { apiFetch } from '../../../services/api';
import Button from '../../../components/Button.vue';
import { type LabRole } from '@shared/db/lab';

import { Bars3Icon } from '@heroicons/vue/24/outline';

import RoleEdit from './RoleEdit.vue';
import { useSortable } from '@vueuse/integrations/useSortable';

const route = useRoute();
const labs = useLabsStore();
const auth = useAuthStore();

const labId = Number(route.params.id);
const roles = computed(() => labs.getLabRoles(labId));
const defaultRoleId = labs.getLab(labId)?.default_role_id ?? null;

const roleList = ref<LabRole[]>([]);
const selectedId = ref<number | null>(null);

// Sync local role list when roles change
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

const member = computed(() => labs.members.get(labId)?.get(auth.user?.id ?? 0) ?? null);
const topRank = computed(() => member.value?.roles[0]?.rank ?? 0);

const selectedRole: ComputedRef<LabRole | null> = computed(
    () => roleList.value.find((r) => r.id === selectedId.value) || null,
);

const listEl = useTemplateRef<HTMLElement>('listEl');

// The roles that the user cannot edit (below them) will not be included in
// useSortable and will be marked as disabled. The others will be draggable.
const editableRoles = computed(() => {
    if (!member.value) {
        return [];
    }
    return roleList.value.filter((r) => r.rank < topRank.value);
});

const nonEditableRoles = computed(() => {
    if (!member.value) {
        return [];
    }
    return roleList.value.filter((r) => r.rank >= topRank.value);
});

useSortable(listEl, editableRoles, {
    onUpdate: async () => {
        roleList.value = [...nonEditableRoles.value, ...editableRoles.value];
        await persistRoleOrder();
    },
});

async function persistRoleOrder(): Promise<void> {
    if (!member.value) {
        return;
    }

    const editable = editableRoles.value;
    if (editable.length === 0) {
        return;
    }

    let nextRank = topRank.value - 1;
    const updates: { role: LabRole; newRank: number }[] = [];
    for (const role of editable) {
        const newRank = nextRank;
        nextRank -= 1;
        if (role.rank !== newRank) {
            updates.push({ role, newRank });
        }
        role.rank = newRank;
    }

    roleList.value = [...nonEditableRoles.value, ...editable]
        .slice()
        .sort((a, b) => b.rank - a.rank || a.id - b.id);

    for (const { role, newRank } of updates) {
        const res = await apiFetch(`/labs/${labId}/roles/${role.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                permissions: Number(role.permissions),
                rank: newRank,
            }),
        });
        if (!res.ok) {
            console.error('[labs] failed to persist role rank', res);
            continue;
        }
        const updated = (await res.json()) as LabRole;
        labs.updateRole(labId, updated);
    }
}

/**
 * Create a new role at a rank the current user can manage and select it.
 */
async function createRole() {
    const res = await apiFetch(`/labs/${labId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'new role',
            color: '#888888',
            permissions: 0,
            rank: topRank.value > 0 ? topRank.value - 1 : 1,
        }),
    });

    if (res.ok) {
        const role: LabRole = await res.json();
        labs.addRole(labId, role);
        roleList.value.push(role);
        roleList.value.sort((a, b) => b.rank - a.rank);
        selectedId.value = role.id;
    }
}
</script>
<template>
    <div class="flex h-full gap-4 overflow-y-auto">
        <!--Holds the sidebar selector for all the roles. This is in the order of [nonEditableRoles, editableRoles], as roles higher than the user cannot be edited.-->
        <aside class="border-surface w-48 border-r px-5">
            <!-- Display all the non-editable roles beforehand. -->
            <div class="flex flex-col gap-3">
                <div
                    v-for="r in nonEditableRoles"
                    :key="r.id"
                    class="bg-surface-low flex items-center gap-2 rounded-lg p-2"
                >
                    <Bars3Icon
                        class="text-content-dimmed text-fg-primary h-4 w-4 flex-shrink-0 opacity-50"
                    />
                    <div class="text-fg-secondary">{{ r.name }}</div>
                </div>
            </div>

            <!-- After, show the roles that this user is able to make changes to. -->
            <div
                ref="listEl"
                class="flex flex-col gap-3"
            >
                <div
                    v-for="r in editableRoles"
                    :key="r.id"
                    class="hover:bg-surface flex cursor-pointer items-center gap-2 rounded-lg p-2"
                    :class="[{ 'bg-surface': selectedId === r.id }]"
                    @click="selectedId = r.id"
                >
                    <Bars3Icon
                        class="text-content-dimmed text-fg-primary h-4 w-4 flex-shrink-0 cursor-move"
                    />
                    <span class="text-fg-primary">{{ r.name }}</span>
                </div>
            </div>

            <!--
            TODO: For now, the styling of this button isn't great - the component has to be updated to better
            TODO: accommodate more stylings, including hover effects and active states
            -->
            <Button
                variant="secondary"
                class="mt-2 w-full"
                @click="createRole"
                >New Role</Button
            >
        </aside>

        <div
            v-if="selectedRole"
            class="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-scroll p-5"
        >
            <RoleEdit
                v-model:selected-id="selectedId"
                :selected-role="selectedRole"
                :default-role-id="defaultRoleId"
                :role-list="roleList"
                :lab-id="labId"
            />
        </div>
        <div
            v-else
            class="flex-1"
        />
    </div>
</template>
