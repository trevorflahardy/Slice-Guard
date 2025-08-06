<script setup lang="ts">
import { useLabsStore } from '../store/labs'
import { useRouter } from 'vue-router'
import { PlusIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline'
import { ref } from 'vue'
import JoinLabModal from '../modals/JoinLabModal.vue'

const labs = useLabsStore()
const router = useRouter()
const showJoin = ref(false)

const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6']
function colorFor(id: number) {
  return colors[id % colors.length]
}
function openLab(id: number) {
  router.push(`/lab/${id}`)
}
function createLab() {
  router.push('/lab/create')
}
function openDms() {
  router.push('/dms')
}
</script>
<template>
  <div class="w-16 bg-surface-low flex flex-col items-center py-3 space-y-3 h-screen">
    <button @click="openDms" class="w-10 h-10 rounded-full bg-surface-high flex items-center justify-center text-fg-primary">
      <ChatBubbleLeftRightIcon class="w-6 h-6" />
    </button>
    <button @click="createLab" class="w-10 h-10 rounded-full bg-surface-high flex items-center justify-center text-fg-primary">
      <PlusIcon class="w-6 h-6" />
    </button>
    <div class="flex-1 flex flex-col items-center gap-3 overflow-y-auto w-full mt-2">
      <button v-for="l in labs.labs" :key="l.lab.id" @click="openLab(l.lab.id)" class="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-white">
        <img v-if="l.lab.icon_url" :src="l.lab.icon_url" class="w-full h-full object-cover" />
        <span v-else :style="{ backgroundColor: colorFor(l.lab.id) }" class="w-full h-full flex items-center justify-center uppercase">{{ l.lab.name.charAt(0) }}</span>
      </button>
    </div>
    <button @click="showJoin = true" class="w-10 h-10 rounded-full bg-surface-high flex items-center justify-center text-fg-primary">
      <MagnifyingGlassIcon class="w-6 h-6" />
    </button>
    <JoinLabModal v-if="showJoin" @close="showJoin = false" />
  </div>
</template>
