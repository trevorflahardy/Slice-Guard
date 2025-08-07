<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../../store/auth';
import UserAvatar from '../../components/UserAvatar.vue';
import { apiFetch } from '../../services/api';
import Button from '../../components/Button.vue';

const auth = useAuthStore();
const name = ref(auth.user?.name ?? '');

async function updateName() {
    if (!auth.user) {
        return;
    }
    const res = await apiFetch(`/users/${auth.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.value }),
    });
    if (res.ok) {
        const user = await res.json();
        auth.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }
}

async function onAvatarChange(e: Event) {
    if (!auth.user) {
        return;
    }
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) {
        return;
    }
    const form = new FormData();
    form.append('file', file);
    const res = await apiFetch(`/users/${auth.user.id}/avatar`, {
        method: 'POST',
        body: form,
    });
    if (res.ok) {
        const user = await res.json();
        auth.user = user;
        localStorage.setItem('user', JSON.stringify(user));
    }
}
</script>

<template>
    <div class="space-y-6">
        <div>
            <h2 class="text-fg-primary text-xl font-semibold">My Account</h2>
            <p class="text-fg-secondary">Manage your account settings and preferences.</p>
        </div>

        <div class="flex items-center gap-4">
            <UserAvatar
                v-if="auth.user"
                :user="auth.user"
                size="size-24"
            />
            <div
                v-else
                class="flex h-24 w-24 items-center justify-center rounded-full bg-gray-500 text-2xl text-white"
            >
                ?
            </div>
            <div>
                <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onAvatarChange"
                />
                <label
                    for="avatar"
                    class="bg-surface-low text-fg-primary cursor-pointer rounded-lg px-4 py-2 text-sm shadow"
                    >Change Avatar</label
                >
            </div>
        </div>

        <div class="max-w-sm">
            <label class="text-fg-primary mb-1 block text-sm font-medium">Name</label>
            <input
                v-model="name"
                placeholder="Your name"
                class="bg-surface-low text-fg-primary placeholder-fg-secondary w-full rounded-lg px-3 py-2 shadow-inner outline-none"
            />
            <Button
                class="mt-3"
                @click="updateName"
                >Save</Button
            >
        </div>
    </div>
</template>
