<script setup lang="ts">
import SettingsModal from '../SettingsModal.vue';
import { defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { useLabsStore } from '../../store/labs';
import { hasLabPermission } from '../../utils/permissions';
import { LabPermission } from '@shared/db/lab';
defineEmits(['close']);

const route = useRoute();
const labs = useLabsStore();
const labId = Number(route.params.id);
const perms = labs.getLabPermissions(labId);

/** List of pages rendered inside the settings modal. */
const pages = {
    'lab settings': [
        { name: 'General', component: defineAsyncComponent(() => import('./General.vue')), id: 1 },
        ...(hasLabPermission(perms, LabPermission.MANAGE_ROLES)
            ? [
                  {
                      name: 'Roles',
                      component: defineAsyncComponent(
                          () => import('./roles/RoleSettingsLayout.vue'),
                      ),
                      id: 2,
                  },
              ]
            : []),
    ],
};
</script>
<template>
    <SettingsModal
        :pages="pages"
        @close="$emit('close')"
    />
</template>
