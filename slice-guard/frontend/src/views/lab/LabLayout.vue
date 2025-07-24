<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import LabUserList from './LabUserList.vue'
import { apiFetch } from '../../services/api'
import { type Lab } from '@shared/db/lab';

const route = useRoute()

const lab = ref<Lab | null>(null)
const loading = ref(true)
const error = ref('')

async function fetchLab() {
  const labId = Number(route.params.id)
  loading.value = true
  error.value = ''
  try {
    const res = await apiFetch(`/labs/${labId}`)
    if (!res.ok) throw new Error()
    lab.value = await res.json()
  } catch {
    error.value = 'Failed to load lab'
  } finally {
    loading.value = false
  }
}

onMounted(fetchLab)
watch(() => route.params.id, fetchLab)
</script>

<template>
  <div class="flex min-h-screen bg-surface-lowest">
    <aside
      class="w-56 lg:w-64 xl:w-72 bg-surface-low min-h-screen p-7 shrink-0 rounded-r-4xl shadow-inner shadow-surface-high">
      <Sidebar :lab="lab" />
    </aside>

    <!-- Main content area -->
    <div class="bg-surface-lowest w-full flex gap-0">
      <div class="p-6 flex-1 w-full">
        <!-- Actual insert content-->
        <router-view :lab="lab" :error="error" :loading="loading" />
      </div>

      <!--User list for lab layout-->
      <!--! TODO: This does not resize and rather the main content does - make this collapse later down the road when I'm not so lazy.
            -->
      <div class="h-full bg-surface-lowest p-4 min-w-60 max-w-80 overflow-y-scroll no-scrollbar">
        <!-- User list for the lab layout -->
        <LabUserList :lab="lab" />
      </div>
    </div>
  </div>
</template>
