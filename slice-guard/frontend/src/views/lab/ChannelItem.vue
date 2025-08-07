<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Channel } from '@shared/db/channel'

interface ChannelNode { channel: Channel; children: ChannelNode[] }

const props = defineProps<{
  node: ChannelNode
  dragStart: (ch: Channel) => void
  dropOn: (ch: Channel) => void
}>()

defineOptions({ name: 'ChannelItem' })
</script>

<template>
  <div
    class="flex flex-col"
    draggable="true"
    @dragstart="props.dragStart(props.node.channel)"
    @drop.prevent="props.dropOn(props.node.channel)"
    @dragover.prevent
  >
    <RouterLink
      v-if="props.node.channel.type === 'text'"
      :to="`/lab/${props.node.channel.lab_id}/channels/${props.node.channel.id}`"
      class="text-sm text-fg-primary hover:text-pretty rounded-lg w-full transition-all duration-250 py-1 px-4 hover:shadow-md"
    >
      # {{ props.node.channel.name }}
    </RouterLink>
    <div v-else class="text-xs font-medium text-fg-secondary mt-2 mb-1">
      {{ props.node.channel.name }}
    </div>
    <div class="pl-4 flex flex-col" v-if="props.node.children.length">
      <ChannelItem
        v-for="c in props.node.children"
        :key="c.channel.id"
        :node="c"
        :dragStart="props.dragStart"
        :dropOn="props.dropOn"
      />
    </div>
  </div>
</template>
