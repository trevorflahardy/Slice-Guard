<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import LabUserList from './LabUserList.vue'
import { useLabsStore } from '../../store/labs'

const route = useRoute()

const labs = useLabsStore()
const labId = computed(() => Number(route.params.id))
const lab = computed(() => labs.getLab(labId.value)?.lab ?? null)
const loading = computed(() => lab.value == null)
const error = computed(() => (lab.value ? '' : 'Failed to load lab'))
</script>

<template>
  <div class="flex min-h-screen bg-surface-lowest">
    <aside class="w-56 lg:w-64 xl:w-72 bg-surface-low min-h-screen p-7 shrink-0 rounded-r-3xl border-r border-surface">
      <Sidebar :lab="lab!" />
    </aside>

    <!-- Main content area -->
    <div class="bg-surface-lowest w-full flex gap-0 overflow-y-scroll">
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
