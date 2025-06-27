import { withAuth } from './middleware';
import { createLab, updateLab, deleteLab, createRole, addMember, removeMember, getMemberRolePermissions, getLab, listLabsForUser } from '../db/lab';
import { LabPermission } from '@shared/db/lab';
import type State from '../utils/state';
import type {
    LabCreatePayload,
    LabUpdatePayload,
    LabDeletePayload,
    RoleCreatePayload,
    MemberAddPayload,
    MemberRemovePayload,
} from '@shared/ws/opcodes';

/**
 * POST /api/labs
 */
export const create = withAuth(async (req, userId, state) => {
    const { name, description, imageUrl } = await req.json() as LabCreatePayload['d'];
    const lab = await createLab(state.db, userId, name, description ?? null, imageUrl ?? null);
    return Response.json(lab);
});

/**
 * GET /api/labs/:id
 */
export const get = withAuth(async (_req, _userId, state, params) => {
    const lab = await getLab(state.db, Number(params.id))
    if (!lab) return new Response('Not found', { status: 404 })
    return Response.json(lab)
});

/**
 * GET /api/labs
 */
export const list = withAuth(async (_req, userId, state) => {
    const labs = await listLabsForUser(state.db, userId)
    return Response.json(labs)
});

/**
 * PATCH /api/labs/:id
 */
export const update = withAuth(async (req, userId, state, params) => {
    const id = Number(params.id);
    const { name, description, imageUrl } = await req.json() as LabUpdatePayload['d'];
    const perms = await getMemberRolePermissions(state.db, id, userId);
    if (perms === null || !(perms & LabPermission.EDIT_LAB)) return new Response('Unauthorized', { status: 403 });
    const lab = await updateLab(state.db, id, name, description ?? null, imageUrl ?? null);
    return Response.json(lab);
});

/**
 * DELETE /api/labs/:id
 */
export const del = withAuth(async (req, userId, state, params) => {
    const id = Number(params.id);
    const perms = await getMemberRolePermissions(state.db, id, userId);
    if (perms === null || !(perms & LabPermission.DELETE_LAB)) return new Response('Unauthorized', { status: 403 });
    await deleteLab(state.db, id);
    return new Response(null, { status: 204 });
});

/**
 * POST /api/labs/:labId/roles
 */
export const createRoleRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { name, permissions } = await req.json() as RoleCreatePayload['d'];
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null || !(perms & LabPermission.MANAGE_ROLES)) return new Response('Unauthorized', { status: 403 });
    const role = await createRole(state.db, labId, name, permissions);
    return Response.json(role);
});

/**
 * POST /api/labs/:labId/members
 */
export const addMemberRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { userId: addId, roleId } = await req.json() as MemberAddPayload['d'];
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null || !(perms & LabPermission.MANAGE_ROLES)) return new Response('Unauthorized', { status: 403 });
    const member = await addMember(state.db, labId, addId, roleId ?? null);
    return Response.json(member);
});

/**
 * DELETE /api/labs/:labId/members/:userId
 */
export const removeMemberRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const removeId = Number(params.userId);
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null || !(perms & LabPermission.REMOVE_USER)) return new Response('Unauthorized', { status: 403 });
    await removeMember(state.db, labId, removeId);
    return new Response(null, { status: 204 });
});
