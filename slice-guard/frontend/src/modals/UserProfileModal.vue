<script setup lang="ts">
import { computed, onUnmounted, watch } from 'vue';
import { useUiStore } from '../store/ui';
import { useLabsStore } from '../store/labs';
import UserAvatar from '../components/UserAvatar.vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

const ui = useUiStore();
const labs = useLabsStore();

const target = computed(() => ui.userProfile);
const lab = computed(() => (target.value ? labs.getLab(target.value.labId) : null));
const member = computed(() => {
    if (!target.value) {
        return null;
    }
    return labs.members.get(target.value.labId)?.get(target.value.userId) ?? null;
});
const user = computed(() => (target.value ? labs.getUser(target.value.userId) : null));
const roles = computed(() => member.value?.roles ?? []);
const joinedAt = computed(() => (member.value ? new Date(member.value.joined_at) : null));

function close(): void {
    ui.closeUserProfile();
}

function handleKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        close();
    }
}

watch(
    target,
    (val) => {
        if (val) {
            document.addEventListener('keydown', handleKey);
            document.body.style.overflow = 'hidden';
        } else {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        }
    },
    { immediate: true },
);

onUnmounted(() => {
    document.removeEventListener('keydown', handleKey);
    document.body.style.overflow = '';
});
</script>

<template>
    <Teleport to="body">
        <div
            v-if="target"
            class="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            @click.self="close"
        >
            <div
                class="bg-surface-low ring-surface-high w-full max-w-xl space-y-6 rounded-2xl p-6 shadow-xl ring-1"
            >
                <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-4">
                        <UserAvatar
                            v-if="user"
                            :user="user"
                            size="size-16"
                        />
                        <div
                            v-else
                            class="bg-surface-lowest h-16 w-16 rounded-full"
                        />
                        <div class="space-y-1">
                            <h2 class="text-fg-primary text-xl font-semibold">
                                {{ user?.name || user?.email || 'Unknown member' }}
                            </h2>
                            <p class="text-fg-secondary text-sm">
                                {{ lab?.name || '—' }}
                            </p>
                            <p
                                v-if="user?.email"
                                class="text-fg-tertiary text-xs"
                            >
                                {{ user.email }}
                            </p>
                        </div>
                    </div>
                    <button
                        class="text-fg-secondary hover:text-fg-primary focus-visible:outline-accent rounded-full p-2 transition-colors focus-visible:outline focus-visible:outline-2"
                        @click="close"
                    >
                        <XMarkIcon class="h-5 w-5" />
                    </button>
                </div>
                <div class="space-y-4">
                    <div
                        v-if="roles.length"
                        class="flex flex-wrap gap-2"
                    >
                        <span
                            v-for="role in roles"
                            :key="role.id"
                            class="bg-surface text-fg-primary border-surface-high/40 rounded-full border px-3 py-1 text-xs font-medium"
                            :style="
                                role.color ? { borderColor: role.color, color: role.color } : {}
                            "
                        >
                            {{ role.name }}
                        </span>
                    </div>
                    <p
                        v-if="joinedAt"
                        class="text-fg-secondary text-sm"
                    >
                        Joined {{ joinedAt.toLocaleDateString() }}
                    </p>
                </div>
            </div>
        </div>
    </Teleport>
</template>
