<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '../Sidebar.vue'
import LabUserList from './LabUserList.vue'
import { ws, authState } from '../../services/auth'
import { OpCode } from '@shared/ws/opcodes'

const route = useRoute()

const lab = ref<any | null>(null)
const loading = ref(true)
const error = ref('')

function fetchLab() {
  const labId = Number(route.params.id)
  loading.value = true
  error.value = ''
  const onLab = (data: any) => {
    ws.removeListener(OpCode.LAB_UPDATE, onLab)
    ws.removeListener(OpCode.ERROR, onErr)
    lab.value = data
    loading.value = false
  }
  const onErr = () => {
    ws.removeListener(OpCode.LAB_UPDATE, onLab)
    ws.removeListener(OpCode.ERROR, onErr)
    error.value = 'Failed to load lab'
    loading.value = false
  }
  ws.addListener(OpCode.LAB_UPDATE, onLab)
  ws.addListener(OpCode.ERROR, onErr)
  ws.send(OpCode.LAB_UPDATE, { labId, token: authState.accessToken })
}

onMounted(fetchLab)
watch(() => route.params.id, fetchLab)
</script>

<template>
    <div class="flex min-h-screen bg-background">
        <!-- Sidebar has no background and takes on that of the main -->
        <aside class="w-56 lg:w-64 xl:w-72 bg-background min-h-screen p-7 flex-shrink-0">
            <Sidebar />
        </aside>

        <!-- Main content area -->
        <div class="rounded-l-[3rem] bg-foreground w-full drop-shadow-lg flex gap-0">
            <div class="p-[1.5rem] flex-1 w-full">
                <!-- Actual insert content-->
                <router-view :lab="lab" :error="error" :loading="loading" />
            </div>

            <!--User list for lab layout-->
            <!--! TODO: This does not resize and rather the main content does - make this collapse later down the road when I'm not so lazy.
            -->
            <div class="h-full bg-background p-4 min-w-52 max-w-60">
                <!-- User list for the lab layout -->
                <LabUserList />
            </div>
        </div>
    </div>
</template>
