<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ws, authState } from '../services/auth'
import { OpCode } from '@shared/ws/opcodes'

const route = useRoute();
const lab = ref<any>(null);
const error = ref('');

function fetchLab() {
  error.value = '';
  lab.value = null;
  ws.addListener(OpCode.LAB_UPDATE, handle);
  ws.addListener(OpCode.ERROR, handleErr);
  ws.send(OpCode.LAB_UPDATE, { labId: Number(route.params.id), token: authState.accessToken });

  function handle(data: any) {
    ws.removeListener(OpCode.LAB_UPDATE, handle);
    ws.removeListener(OpCode.ERROR, handleErr);
    lab.value = data;
  }
  function handleErr() {
    ws.removeListener(OpCode.LAB_UPDATE, handle);
    ws.removeListener(OpCode.ERROR, handleErr);
    error.value = 'Failed to load lab';
  }
}

onMounted(fetchLab);
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="text-red-600">{{ error }}</div>
    <div v-if="lab">
      <h1 class="text-2xl font-semibold">{{ lab.name }}</h1>
      <p class="text-gray-500">{{ lab.description }}</p>
    </div>
    <div v-else-if="!error" class="text-gray-500">Loading...</div>
  </div>
</template>
