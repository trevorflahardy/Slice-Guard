<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { computed, ref } from 'vue';
import type { Channel } from '@shared/db/channel';
import { apiFetch } from '../../../services/api';
import ContextMenu, { type ContextMenuItem } from '../../../components/ContextMenu.vue';

interface ChannelNode {
    channel: Channel;
    children: ChannelNode[];
}

const props = defineProps<{
    node: ChannelNode;
    navClass: string;
    navIsActiveClass: string;
    // eslint-disable-next-line no-unused-vars
    dragStart: (_ch: Channel) => void;
    // eslint-disable-next-line no-unused-vars
    dropOn: (_ch: Channel) => void;
}>();

defineOptions({ name: 'ChannelItem' });

const route = useRoute();

const isActive = computed(() => {
    const activeChannelId = route.params.channelId;

    return (
        props.node.channel.type !== 'category' &&
        String(activeChannelId) === String(props.node.channel.id)
    );
});

const menu = ref({ show: false, x: 0, y: 0 });
const current = ref<Channel | null>(null);

function openMenu(e: MouseEvent) {
    menu.value = { show: true, x: e.clientX, y: e.clientY };
    current.value = props.node.channel;
}

async function deleteChannel() {
    if (!current.value) {
        return;
    }
    await apiFetch(`/labs/${current.value.lab_id}/channels/${current.value.id}`, {
        method: 'DELETE',
    });
}

const menuItems: ContextMenuItem[] = [
    { label: 'Edit', action: () => {} },
    { label: 'Delete Channel', action: deleteChannel, variant: 'danger' },
];
</script>

<template>
    <div
        class="flex flex-col"
        draggable="true"
        @dragover.prevent
        @contextmenu.stop.prevent="openMenu"
    >
        <RouterLink
            v-if="props.node.channel.type === 'text'"
            :to="`/lab/${props.node.channel.lab_id}/channels/${props.node.channel.id}`"
            :class="[navClass, { [navIsActiveClass]: isActive }]"
        >
            # {{ props.node.channel.name }}
        </RouterLink>
        <div
            v-else
            class="text-fg-secondary mt-2 mb-1 text-xs font-medium"
        >
            {{ props.node.channel.name }}
        </div>
        <div
            v-if="props.node.children.length"
            class="flex flex-col pl-4"
        >
            <ChannelItem
                v-for="c in props.node.children"
                :key="c.channel.id"
                :node="c"
                :nav-class="navClass"
                :nav-is-active-class="navIsActiveClass"
                :drag-start="props.dragStart"
                :drop-on="props.dropOn"
            />
        </div>
        <ContextMenu
            v-if="menu.show"
            :items="menuItems"
            :x="menu.x"
            :y="menu.y"
            @close="menu.show = false"
        />
    </div>
</template>
