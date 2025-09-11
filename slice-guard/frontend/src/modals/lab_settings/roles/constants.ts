import { LabPermission } from '@shared/db/lab';

// Curated theme-aligned palette
export const colorSwatches = [
    // greens (salem)
    '#21ff8a',
    '#00f268',
    '#00ca53',
    '#007f3c',
    // blues / cyan
    '#0a84ff',
    '#3b82f6',
    '#22d3ee',
    '#60a5fa',
    // purples / pinks
    '#a78bfa',
    '#8b5cf6',
    '#f472b6',
    '#e879f9',
    // yellows / oranges (bird-flower + amber)
    '#e5e629',
    '#c7c11a',
    '#f59e0b',
    '#ea580c',
    // reds
    '#ef4444',
    '#dc2626',
    // grays
    '#9ca3af',
    '#6b7280',
    '#4b5563',
];

export const PERMS = [
    { bit: LabPermission.EDIT_LAB, label: 'Edit Lab', desc: 'Change basic lab info.' },
    { bit: LabPermission.MANAGE_ROLES, label: 'Manage Roles', desc: 'Create or modify roles.' },
    { bit: LabPermission.REMOVE_USER, label: 'Remove Users', desc: 'Kick members from the lab.' },
    { bit: LabPermission.DELETE_LAB, label: 'Delete Lab', desc: 'Delete this lab permanently.' },
    {
        bit: LabPermission.CREATE_REQUEST,
        label: 'Create Requests',
        desc: 'Submit new print requests.',
    },
    {
        bit: LabPermission.MANAGE_REQUESTS,
        label: 'Manage Requests',
        desc: 'Approve or deny requests.',
    },
    { bit: LabPermission.READ, label: 'Read Messages', desc: 'View messages and requests.' },
    { bit: LabPermission.WRITE, label: 'Send Messages', desc: 'Send messages and requests.' },
    {
        bit: LabPermission.CREATE_INVITES,
        label: 'Create Invites',
        desc: 'Generate invites to the lab.',
    },
    {
        bit: LabPermission.MANAGE_INVITES,
        label: 'Manage Invites',
        desc: 'Update or revoke invites.',
    },
];
