<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '../../components/Button.vue';
import { login } from '../../services/auth';

const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

async function submit() {
  error.value = '';
  try {
    await login(email.value, password.value);
    router.push('/');
  } catch (e: any) {
    error.value = e.message ?? 'Failed to login';
  }
}
</script>

<template>
  <div class="w-full bg-foreground drop-shadow-sm py-3 px-5">
    <p class="text-lg font-semibold text-start">Slice Guard</p>
  </div>

  <div class="flex flex-col items-center min-h-screen bg-background gap-5">
    <div>
      <h1 class="text-4xl font-semibold text-center mt-20">Hello again</h1>
      <p class="text-sm text-gray-500 text-center mt-2">It's nice to see you :)</p>
    </div>

    <form @submit.prevent="submit"
      class="flex flex-col items-center justify-center w-full max-w-sm md:max-w-md gap-3 mt-10 text-sm text-gray-400">
      <input v-model="email" type="email" placeholder="Email" required
        class="col-span-2 bg-foreground shadow-md py-3 px-5 rounded-xl w-full focus:outline-main" />
      <input v-model="password" type="password" placeholder="Password" required
        class="col-span-2 bg-foreground shadow-md py-3 px-5 rounded-xl w-full focus:outline-main" />
      <p v-if="error" class="text-red-600 text-sm w-full text-left px-1">{{ error }}</p>
      <div class="w-full">
        <Button variant="primary" class="col-span-2 mt-4 w-full py-2">Log In</Button>
        <Button variant="secondary" class="col-span-2 mt-2 w-full py-2" @click.prevent="router.push('/register')">Sign
          Up</Button>
      </div>
    </form>
  </div>
</template>
