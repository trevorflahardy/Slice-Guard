<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import type { LabRole } from '@shared/db/lab';
import * as constants from './constants';
import { apiFetch } from '../../../services/api';
import { useLabsStore } from '../../../store/labs';
import { useAuthStore } from '../../../store/auth';
import { useNow } from '@vueuse/core';
import type { Message } from '@shared/db/message';
import ChannelMessage from '../../../components/channels/ChannelMessage.vue';
import Button from '../../../components/Button.vue';
import RoleColorChanger from './RoleColorChanger.vue';

export interface RoleEditProps {
    selectedRole: LabRole;
    defaultRoleId: number | null;
    roleList: LabRole[];
    labId: number;
}

const props = defineProps<RoleEditProps>();
const selectedId = defineModel('selectedId', { required: true });
const labs = useLabsStore();
const auth = useAuthStore();

const now = useNow();

const roleName = ref('');
const permMask = ref<number>(0);
const selectedColor = ref<string | null>(null);

// Keep form fields in sync with the selected role
watch(props.selectedRole, (r) => {
    if (r) {
        roleName.value = r.name;
        permMask.value = Number(r.permissions);
        selectedColor.value = r.color || null;
    }
});

const isDefault = computed(
    () => props.defaultRoleId !== null && props.selectedRole.id === props.defaultRoleId,
);

/**
 * Toggle a permission bit on or off in the local mask.
 */
function togglePerm(bit: number) {
    permMask.value ^= bit;
}

/**
 * Remove the currently selected role.
 */
async function removeRole() {
    if (!props.selectedRole) {
        return;
    }
    await apiFetch(`/labs/${props.labId}/roles/${props.selectedRole.id}`, { method: 'DELETE' });
    selectedId.value = props.roleList[0].id ?? null;
}

/**
 * Persist changes made to the currently selected role.
 */
async function save() {
    if (!props.selectedRole) {
        return;
    }
    await apiFetch(`/labs/${props.labId}/roles/${props.selectedRole.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: roleName.value,
            color: selectedColor.value,
            permissions: permMask.value,
            rank: props.selectedRole.rank,
        }),
    });
    // Sync updated role back into the store
    labs.updateRole(props.labId, {
        ...props.selectedRole,
        name: roleName.value,
        color: selectedColor.value,
        permissions: permMask.value,
    });
}
</script>

<template>
    <div>
        <h1 class="text-fg-primary font-semibold uppercase">edit role - {{ selectedRole.name }}</h1>
        <sub class="text-content-dimmed text-fg-secondary text-sm">
            Use the settings below to modify this role's permissions and appearance.
        </sub>
    </div>

    <label class="flex flex-col gap-1">
        <span class="text-fg-primary font-medium">Role Name</span>
        <input
            v-model="roleName"
            :placeholder="selectedRole.name"
            class="bg-surface focus-ring-2 focus:ring-accent text-fg-secondary rounded-lg p-2"
        />
    </label>

    <div>
        <h2 class="text-fg-primary font-medium">Role Color</h2>
        <p class="text-fg-secondary text-sm">Members use the color of their highest role.</p>

        <RoleColorChanger
            v-model:selected-color="selectedColor"
            :is-default="isDefault"
        />
    </div>

    <div
        v-if="auth.user"
        class="bg-surface w-full rounded-xl px-2 py-3 shadow-md"
    >
        <!-- Mock channel message -->
        <ChannelMessage
            :author="auth.user"
            :message="
                {
                    id: 1,
                    channel_id: 1,
                    user_id: auth.user.id,
                    content: 'This is how a message will look.',
                    created_at: now,
                } as Message
            "
            :color="selectedColor"
        />
    </div>

    <!-- color input removed in favor of swatches and custom modal -->
    <div class="flex flex-col gap-2">
        <h3 class="text-fg-primary font-semibold">Permissions</h3>
        <div class="grid gap-3 sm:grid-cols-2">
            <div
                v-for="p in constants.PERMS"
                :key="p.bit"
                class="bg-surface flex items-center justify-between rounded-lg p-3"
            >
                <div>
                    <div class="text-fg-primary font-medium">{{ p.label }}</div>
                    <div class="text-content-dimmed text-fg-secondary text-sm">{{ p.desc }}</div>
                </div>
                <label class="relative inline-flex cursor-pointer items-center">
                    <input
                        type="checkbox"
                        class="peer sr-only"
                        :checked="(permMask & p.bit) !== 0"
                        @change="togglePerm(p.bit)"
                    />
                    <div
                        class="bg-surface-low peer-checked:bg-accent h-5 w-10 rounded-full transition-colors"
                    >
                        <span
                            class="bg-surface absolute top-0.5 left-0.5 h-4 w-4 rounded-full transition-transform peer-checked:translate-x-5"
                        />
                    </div>
                </label>
            </div>
        </div>
    </div>
    <div class="mt-auto flex justify-between">
        <Button @click="removeRole">Delete</Button>
        <Button
            variant="primary"
            @click="save"
            >Save</Button
        >
    </div>
</template>
