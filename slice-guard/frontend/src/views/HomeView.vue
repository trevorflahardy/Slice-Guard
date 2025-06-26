<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from '../components/Button.vue'

const isDark = ref(false)

function applyTheme() {
  const root = document.documentElement
  if (isDark.value) root.classList.add('dark')
  else root.classList.remove('dark')
}

function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme()
}

onMounted(() => applyTheme())
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors">
    <div class="space-y-4 text-center">
      <h1 class="text-4xl font-bold text-main">Slice Guard</h1>
      <p class="text-accent-text">Modern 3D print management</p>
      <Button variant="secondary" @click="toggleTheme">
        Toggle {{ isDark ? 'Light' : 'Dark' }} Mode
      </Button>
    </div>
  </div>
</template>

<style scoped>
</style>
