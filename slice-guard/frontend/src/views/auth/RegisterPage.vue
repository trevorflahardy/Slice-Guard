<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Button from '../../components/Button.vue';
import { register } from '../../services/auth';
import { useAuthStore } from '../../store/auth';

const name = ref('');
const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();
const auth = useAuthStore();

onMounted(() => {
    if (auth.apiKey) {
        alert('Please logout before creating a new account.');
        router.replace('/');
    }
});

async function submit() {
    error.value = '';
    try {
        await register(email.value, password.value, name.value);
        router.push('/nolabs');
    } catch (e: any) {
        error.value = e.message ?? 'Failed to register';
    }
}
</script>

<template>
    <div class="bg-surface-low w-full px-5 py-3 drop-shadow-sm">
        <p class="text-start text-lg font-semibold">Slice Guard</p>
    </div>

    <div class="bg-surface-lowest flex min-h-screen flex-col items-center gap-5">
        <div>
            <h1 class="text-fg-primary mt-20 text-center text-4xl font-semibold">
                Create your account
            </h1>
            <p class="text-fg-secondary mt-2 text-center text-sm">Join us and start printing!</p>
        </div>

        <form
            class="mt-10 flex w-full max-w-sm flex-col items-center justify-center gap-3 text-sm md:max-w-md"
            @submit.prevent="submit"
        >
            <input
                v-model="name"
                type="text"
                placeholder="Name"
                required
                class="bg-surface-low focus:outline-salem-800 placeholder-fg-secondary col-span-2 w-full rounded-xl px-5 py-3 shadow-md"
            />
            <input
                v-model="email"
                type="email"
                placeholder="Email"
                required
                class="bg-surface-low focus:outline-salem-800 placeholder-fg-secondary col-span-2 w-full rounded-xl px-5 py-3 shadow-md"
            />
            <input
                v-model="password"
                type="password"
                placeholder="Password"
                required
                class="bg-surface-low focus:outline-salem-800 placeholder-fg-secondary col-span-2 w-full rounded-xl px-5 py-3 shadow-md"
            />
            <p
                v-if="error"
                class="w-full px-1 text-left text-sm text-red-600"
            >
                {{ error }}
            </p>

            <div class="w-full">
                <Button
                    variant="primary"
                    class="col-span-2 mt-4 w-full py-2"
                    >Create Account</Button
                >
                <Button
                    variant="secondary"
                    class="col-span-2 mt-2 w-full py-2"
                    @click.prevent="router.push('/login')"
                >
                    Back to Login
                </Button>
            </div>
        </form>
    </div>
</template>
