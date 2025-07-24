<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from '../../components/Button.vue'
import { register } from '../../services/auth'
import { useAuthStore } from '../../store/auth'

const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  if (auth.apiKey) {
    alert('Please logout before creating a new account.')
    router.replace('/')
  }
})

async function submit() {
  error.value = ''
  try {
    await register(email.value, password.value, name.value)
    router.push('/nolabs')
  } catch (e: any) {
    error.value = e.message ?? 'Failed to register'
  }
}
</script>

<template>
  <div class="w-full bg-surface-low drop-shadow-sm py-3 px-5">
    <p class="text-lg font-semibold text-start">Slice Guard</p>
  </div>

  <div class="flex flex-col items-center min-h-screen bg-surface-lowest gap-5">
    <div>
      <h1 class="text-fg-primary text-4xl font-semibold text-center mt-20">Create your account</h1>
      <p class="text-sm text-fg-secondary text-center mt-2">Join us and start printing!</p>
    </div>

    <form @submit.prevent="submit"
      class="flex flex-col items-center justify-center w-full max-w-sm md:max-w-md gap-3 mt-10 text-sm">

      <input v-model="name" type="text" placeholder="Name" required
        class="col-span-2 bg-surface-low shadow-md py-3 px-5 rounded-xl w-full focus:outline-salem-800 placeholder-fg-secondary" />
      <input v-model="email" type="email" placeholder="Email" required
        class="col-span-2 bg-surface-low shadow-md py-3 px-5 rounded-xl w-full focus:outline-salem-800 placeholder-fg-secondary" />
      <input v-model="password" type="password" placeholder="Password" required
        class="col-span-2 bg-surface-low shadow-md py-3 px-5 rounded-xl w-full focus:outline-salem-800 placeholder-fg-secondary" />
      <p v-if="error" class="text-red-600 text-sm w-full text-left px-1">{{ error }}</p>

      <div class="w-full">
        <Button variant="primary" class="col-span-2 mt-4 w-full py-2">Create Account</Button>
        <Button variant="secondary" class="col-span-2 mt-2 w-full py-2" @click.prevent="router.push('/login')">
          Back to Login
        </Button>
      </div>
    </form>
  </div>
</template>
