import { withAuth } from '../middleware';
import { createRole, getMemberRolePermissions, updateRole, deleteRole, getLab } from '../../db/lab';
import { LabPermission } from '@shared/db/lab';
import { hasLabPermission } from '../../utils/permissions';
import { WsEvent } from '@shared/payloads/ws';
import type { RoleCreatePayload, RoleUpdatePayload } from '@shared/payloads';

/**
 * POST /api/labs/:labId/roles
 */
export const createRoleRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { name, permissions, rank, color } = (await req.json()) as RoleCreatePayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES)) {
        return new Response('Unauthorized', { status: 403 });
    }

    const role = await createRole(state.db, labId, name, permissions, rank ?? 1, color ?? null);
    state.sendToLab(labId, { op: WsEvent.ROLE_CREATED, d: { role } });
    return Response.json(role);
});

/**
 * PATCH /api/labs/:labId/roles/:roleId
 */
export const updateRoleRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const roleId = Number(params.roleId);
    const { permissions, rank, name, color } = (await req.json()) as RoleUpdatePayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES)) {
        return new Response('Unauthorized', { status: 403 });
    }

    const lab = await getLab(state.db, labId);
    const isDefault = lab?.default_role_id === roleId;
    // Prevent renaming or recoloring the lab's default role
    const role = await updateRole(
        state.db,
        labId,
        roleId,
        permissions,
        rank,
        isDefault ? undefined : name,
        isDefault ? undefined : (color ?? null),
    );
    state.sendToLab(labId, { op: WsEvent.ROLE_UPDATED, d: { role } });
    return Response.json(role);
});

/**
 * DELETE /api/labs/:labId/roles/:roleId
 */
export const deleteRoleRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const roleId = Number(params.roleId);

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES)) {
        return new Response('Unauthorized', { status: 403 });
    }

    await deleteRole(state.db, labId, roleId);
    state.sendToLab(labId, { op: WsEvent.ROLE_DELETED, d: { labId, roleId } });
    return new Response(null, { status: 204 });
});
