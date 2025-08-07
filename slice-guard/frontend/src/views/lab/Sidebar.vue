<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { useLabsStore } from '../../store/labs'
import { type Lab, LabPermission } from '@shared/db/lab'
import { Cog6ToothIcon, UserPlusIcon } from '@heroicons/vue/16/solid'
import UserSettings from '../../modals/user_settings/UserSettings.vue'
import CreateInviteModal from '../../modals/CreateInviteModal.vue'
import LabSettings from '../../modals/lab_settings/LabSettings.vue'
import { useModal } from '../../composables/useModal'
import Dropdown from '../../components/Dropdown.vue'
import { hasLabPermission } from '../../utils/permissions'
import { apiFetch } from '../../services/api'
import { useRouter } from 'vue-router'
import type { Channel } from '@shared/db/channel'
import ChannelItem from './ChannelItem.vue'

interface ChannelNode {
    channel: Channel
    children: ChannelNode[]
}

export interface LabSidebarProps {
    lab: Lab
}

const props = defineProps<LabSidebarProps>();
const auth = useAuthStore();
const labsStore = useLabsStore();
const route = useRoute();

const labId = computed(() => route.params.id);
const userSettingsModal = useModal();
const inviteModal = useModal();
const labSettingsModal = useModal();
const router = useRouter();

const navClass = ref(
    'text-sm text-fg-primary hover:text-pretty rounded-lg w-full transition-all duration-250 py-1 px-4 hover:shadow-md'
);

const navIsActive = (name: string) => {
    return route.name === name
}

const isActiveClass = ref(
    'shadow-md dark:shadow-surface dark:shadow-sm'
);

const initials = computed(() => {
    const name = auth.user?.name || auth.user?.email || ''
    return name.charAt(0)
})

const dropdownOptions = computed(() => {
    const labState = labsStore.getLab(Number(labId.value))
    const perms = labState?.permissions ?? null
    const options: { id: string; name: string; icon?: any; variant?: 'danger' }[] = []
    if (hasLabPermission(perms, LabPermission.CREATE_INVITES)) {
        options.push({ id: 'invite', name: 'Invite Users', icon: UserPlusIcon })
    }
    if (hasLabPermission(perms, LabPermission.EDIT_LAB)) {
        options.push({ id: 'edit', name: 'Edit Lab', icon: Cog6ToothIcon })
    }
    options.push({ id: 'leave', name: 'Leave Lab', variant: 'danger' })
    return options
})

const channelTree = computed<ChannelNode[]>(() => {
    const labState = labsStore.getLab(Number(labId.value))
    const nodes = new Map<number, ChannelNode>()
    const roots: ChannelNode[] = []
    for (const ch of labState?.channels ?? []) {
        nodes.set(ch.id, { channel: ch, children: [] })
    }
    for (const node of nodes.values()) {
        if (node.channel.category_id && nodes.has(node.channel.category_id)) {
            nodes.get(node.channel.category_id)!.children.push(node)
        } else {
            roots.push(node)
        }
    }
    const sortNodes = (arr: ChannelNode[]) => {
        arr.sort((a, b) => a.channel.position - b.channel.position)
        for (const c of arr) sortNodes(c.children)
    }
    sortNodes(roots)
    return roots
})

let dragging: Channel | null = null
function dragStart(ch: Channel) { dragging = ch }
async function dropOn(target: Channel) {
    if (!dragging || dragging.id === target.id) return
    const labIdNum = Number(labId.value)
    const lab = labsStore.getLab(labIdNum)
    if (!lab) return
    const siblings = (target.category_id ? lab.channels.filter(c => c.category_id === target.category_id) : lab.channels.filter(c => c.category_id == null))
    const newPos = target.position + 1
    await apiFetch(`/labs/${labIdNum}/channels/${dragging.id}/position`, {
        method: 'PATCH',
        body: JSON.stringify({ position: newPos }),
        headers: { 'Content-Type': 'application/json' }
    })
    dragging = null
}

async function handleDropdown(action: string | number | (string | number)[] | null) {
    if (action === 'invite') inviteModal.open()
    else if (action === 'edit') labSettingsModal.open()
    else if (action === 'leave') {
        await apiFetch(`/labs/${labId.value}/members/@me`, { method: 'DELETE' })
        router.push('/dms')
    }
}
</script>

<template>
    <!-- Holds the main sidebar content. For now, this is placeholder information. -->
    <div class="flex flex-col gap-5 h-full justify-items-start">
        <!--Currently active lab information (and way to change lab)-->
        <Dropdown
            :options="dropdownOptions"
            :model-value="null"
            @update:modelValue="handleDropdown">
            <template #activator>
                <div class="text-left flex flex-col items-start gap-2 w-full cursor-pointer">
                    <div class="flex justify-between w-full">
                        <h1 class="text-lg/5 text-fg-primary font-semibold text-pretty">{{ props.lab.name }}</h1>
                        <Cog6ToothIcon class="ml-auto size-4 text-fg-secondary" />
                    </div>
                    <p class="text-xs text-fg-secondary line-clamp-2">{{ props.lab.description }}</p>
                </div>
            </template>
        </Dropdown>


        <!-- Divider line -->
        <hr class="border-fg-secondary">

        <!-- Navigation for the selected Lab -->
        <div>
            <!-- Similar to Discord style, has stats information and channels, each separated by a divider -->
            <div class="flex flex-row justify-between items-center">
                <h2 class="text-sm font-medium text-fg-primary mb-2 uppercase">Lab Center</h2>

                <!-- Dropdown arrow to collapse category -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-fg-secondary cursor-pointer" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            <!-- Navigation links (need gear icon at the right side of each later on) -->
            <nav class="flex flex-col space-y-1">
                <RouterLink :to="{ name: 'LabDashboard', params: { id: labId } }"
                    :class="[navIsActive('LabDashboard') ? isActiveClass : '', navClass]">
                    dashboard
                </RouterLink>

                <RouterLink :to="`/lab/${labId}/print-requests`"
                    :class="[navIsActive('LabPrintRequests') ? isActiveClass : '', navClass]">
                    print-requests
                </RouterLink>
            </nav>
        </div>

        <!-- Navigation for Lab text channels - very similar to the above should be made into a dynamic system soon -->
        <div>
            <div class=" flex flex-row justify-between items-center">
                <h2 class="text-sm font-medium text-fg-primary mb-2 uppercase">Channels</h2>
            </div>
            <nav class="flex flex-col space-y-1">
                <template v-for="node in channelTree" :key="node.channel.id">
                    <ChannelItem :node="node" :dragStart="dragStart" :dropOn="dropOn" />
                </template>
            </nav>
        </div>



        <!-- Avatar information -->

        <!-- Divider line for avatar -->
        <hr class="border-fg-secondary mt-auto">

        <div class="flex flex-row gap-2 rounded-xl justify-start items-center">
            <img v-if="auth.user?.avatar_url" :src="auth.user.avatar_url"
                class="w-10 h-10 rounded-full object-cover drop-shadow-sm" />
            <div v-else
                class="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center drop-shadow-sm">
                {{ initials }}
            </div>

            <div>
                <h2 class="text-fg-primary text-sm font-semibold">{{ auth.user?.name ?? 'Unknown User' }}</h2>
            </div>

            <!--Settings gear icon at the end of the flex -->
            <button @click="userSettingsModal.open()" class="ml-auto">
                <Cog6ToothIcon
                    class="size-5 text-fg-secondary transition-transform hover:motion-safe:rotate-90 duration-500 ease-in-out" />
            </button>

            <UserSettings v-if="userSettingsModal.isOpen.value" @close="userSettingsModal.close()" />
            <CreateInviteModal v-if="inviteModal.isOpen.value" :lab-id="Number(labId)" @close="inviteModal.close()" />
            <LabSettings v-if="labSettingsModal.isOpen.value" @close="labSettingsModal.close()" />
        </div>
    </div>
</template>