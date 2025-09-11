<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLabsStore } from '../../../store/labs';
import { apiFetch } from '../../../services/api';
import type { LabRole } from '@shared/db/lab';
import Button from '../../../components/Button.vue';

const props = defineProps<{ labId: number | null }>();
const labs = useLabsStore();

const working = ref<Record<number, Set<number>>>({});
const saving = ref(false);
const filter = ref('');

const members = computed(() => (props.labId ? labs.getLabMembers(props.labId) : []));
const roles = computed<LabRole[]>(() => (props.labId ? labs.getLabRoles(props.labId) : []));

function ensureUser(userId: number, existing: number[]) {
    if (!working.value[userId]) {
        working.value[userId] = new Set(existing.map((r) => r));
    }
    return working.value[userId];
}

const filteredMembers = computed(() => {
    if (!filter.value) {
        return members.value;
    }
    const low = filter.value.toLowerCase();
    return members.value.filter((m) => {
        const user = labs.getUser(m.user_id);
        const name = user?.name || user?.email || String(m.user_id);
        return name.toLowerCase().includes(low);
    });
});

function toggle(userId: number, roleId: number) {
    const current = ensureUser(
        userId,
        members.value.find((m) => m.user_id === userId)?.roles.map((r) => r.id) || [],
    );
    if (current.has(roleId)) {
        current.delete(roleId);
    } else {
        current.add(roleId);
    }
}

function isChecked(userId: number, roleId: number) {
    const member = members.value.find((m) => m.user_id === userId);
    const base = member ? member.roles.map((r) => r.id) : [];
    const current = working.value[userId];
    if (!current) {
        return base.includes(roleId);
    }
    return current.has(roleId);
}

async function save() {
    if (!props.labId) {
        return;
    }
    saving.value = true;
    try {
        const payload: { userId: number; roleIds: number[] }[] = [];
        for (const m of members.value) {
            const set = working.value[m.user_id];
            if (set) {
                payload.push({ userId: m.user_id, roleIds: Array.from(set.values()) });
            }
        }
        for (const entry of payload) {
            const member = members.value.find((mm) => mm.user_id === entry.userId);
            if (member) {
                member.roles = entry.roleIds
                    .map((id) => roles.value.find((r) => r.id === id))
                    .filter((r): r is LabRole => !!r)
                    .sort((a, b) => b.rank - a.rank || a.id - b.id);
            }
        }

        await apiFetch(`/labs/${props.labId}/members/roles`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates: payload }),
        });

        working.value = {};
    } finally {
        saving.value = false;
    }
}
</script>

<template>
    <div
        v-if="labId"
        class="bg-surface-low space-y-4 rounded-lg p-4"
    >
        <div class="flex items-center justify-between gap-4">
            <h2 class="text-fg-primary font-semibold">Assign Roles</h2>
            <input
                v-model="filter"
                placeholder="Filter members"
                class="bg-surface text-fg-primary rounded-md px-2 py-1 text-sm"
            />
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="text-fg-secondary">
                    <tr>
                        <th class="py-1 text-left">Member</th>
                        <th
                            v-for="r in roles"
                            :key="r.id"
                            class="py-1 text-left"
                        >
                            {{ r.name }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="m in filteredMembers"
                        :key="m.user_id"
                        class="text-fg-primary align-top"
                    >
                        <td class="py-1 pr-2 whitespace-nowrap">
                            {{
                                labs.getUser(m.user_id)?.name ||
                                labs.getUser(m.user_id)?.email ||
                                m.user_id
                            }}
                        </td>
                        <td
                            v-for="r in roles"
                            :key="r.id"
                            class="py-1"
                        >
                            <input
                                type="checkbox"
                                :checked="isChecked(m.user_id, r.id)"
                                class="accent-accent h-4 w-4"
                                @change="toggle(m.user_id, r.id)"
                            />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div class="flex justify-end">
            <Button
                variant="secondary"
                :disabled="saving"
                @click="save"
                >{{ saving ? 'Saving...' : 'Save Changes' }}</Button
            >
        </div>
    </div>
</template>
