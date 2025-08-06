<script setup lang="ts">
import { useLabsStore } from "../store/labs";
import { useRouter } from "vue-router";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/vue/24/outline";
import { ref } from "vue";
import JoinLabModal from "../modals/JoinLabModal.vue";
import Button from "./Button.vue";

const labs = useLabsStore();
const router = useRouter();
const showJoin = ref(false);

const colors = [
  "#f87171",
  "#fbbf24",
  "#34d399",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
];
function colorFor(id: number) {
  return colors[id % colors.length];
}
function openLab(id: number) {
  router.push(`/lab/${id}`);
}
function createLab() {
  router.push("/lab/create");
}
function openDms() {
  router.push("/dms");
}
</script>
<template>
  <div class="w-16 bg-surface-low flex flex-col items-center py-3 space-y-3 h-screen border-r border-surface">
    <Button variant="tertiary" :bubble="true" @click="openDms" outline="outline-fg-primary/30" class="mb-10">
      <ChatBubbleLeftRightIcon class=" w-6 h-6" />
    </Button>

    <Button @click="createLab" variant="tertiary" :bubble="true" outline="outline-fg-primary/30">
      <PlusIcon class="w-6 h-6" />
    </Button>

    <div class="flex-1 flex flex-col items-center gap-3 overflow-y-auto w-full mt-2">
      <Button v-for="l in labs.labs" :key="l.lab.id" @click="openLab(l.lab.id)"
        class="w-10 h-10 p-0! overflow-hidden flex items-center justify-center text-white" :bubble="true"
        variant="tertiary">
        <img v-if="l.lab.icon_url" :src="l.lab.icon_url" class="w-full h-full object-cover" />

        <span v-else :style="{ backgroundColor: colorFor(l.lab.id) }"
          class="w-full h-full flex items-center justify-center uppercase">{{ l.lab.name.charAt(0) }}</span>
      </Button>
    </div>

    <Button @click="showJoin = true" class="w-10 h-10 p-0! flex items-center justify-center text-fg-primary"
      :bubble=true>
      <MagnifyingGlassIcon class="w-6 h-6" />
    </Button>

    <JoinLabModal v-if="showJoin" @close="showJoin = false" />
  </div>
</template>
