<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { PlusIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/vue/24/outline';

import JoinLabModal from '../modals/JoinLabModal.vue';
import { useLabsStore } from '../store/labs';
import Button from './Button.vue';

/**
 * Sidebar listing labs and navigation controls.
 */
const labStore = useLabsStore();
const router = useRouter();
const showJoin = ref<boolean>(false);

const colors: string[] = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

/**
 * Deterministically pick a placeholder color for a lab by its id.
 */
function colorFor(id: number): string {
    return colors[id % colors.length];
}

/**
 * Navigate to the selected lab.
 */
function openLab(id: number): void {
    router.push(`/lab/${id}`);
}

/** Navigate to the lab creation page. */
function createLab(): void {
    router.push('/lab/create');
}

/** Navigate to direct messages. */
function openDms(): void {
    router.push('/dms');
}
</script>
<template>
    <div
        class="bg-surface-low border-surface flex h-screen w-16 flex-col items-center space-y-3 border-r py-3"
    >
        <Button
            variant="tertiary"
            :bubble="true"
            outline="outline-fg-primary/30"
            class="mb-10"
            @click="openDms"
        >
            <ChatBubbleLeftRightIcon class="h-6 w-6" />
        </Button>

        <Button
            variant="tertiary"
            :bubble="true"
            outline="outline-fg-primary/30"
            @click="createLab"
        >
            <PlusIcon class="h-6 w-6" />
        </Button>

        <div class="mt-2 flex w-full flex-1 flex-col items-center gap-3 overflow-y-auto">
            <Button
                v-for="l in labStore.labs.values()"
                :key="l.id"
                class="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden p-0! text-white"
                :bubble="true"
                variant="tertiary"
                @click="openLab(l.id)"
            >
                <img
                    v-if="l.icon_url"
                    :src="l.icon_url"
                    class="h-full w-full object-cover"
                />

                <span
                    v-else
                    :style="{ backgroundColor: colorFor(l.id) }"
                    class="flex h-full w-full items-center justify-center uppercase"
                    >{{ l.name.charAt(0) }}</span
                >
            </Button>
        </div>

        <Button
            class="text-fg-primary flex h-10 w-10 items-center justify-center p-0!"
            :bubble="true"
            @click="showJoin = true"
        >
            <MagnifyingGlassIcon class="h-6 w-6" />
        </Button>

        <JoinLabModal
            v-if="showJoin"
            @close="showJoin = false"
        />
    </div>
</template>
