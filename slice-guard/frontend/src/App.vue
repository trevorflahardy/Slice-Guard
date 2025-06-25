<script setup lang="ts">
import { ref, onMounted } from 'vue'

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
      <p class="text-accent">Modern 3D print management</p>
      <button @click="toggleTheme" class="px-4 py-2 rounded bg-main text-white hover:bg-accent">
        Toggle {{ isDark ? 'Light' : 'Dark' }} Mode
      </button>
    </div>
  </div>
</template>

<style scoped>
</style>
