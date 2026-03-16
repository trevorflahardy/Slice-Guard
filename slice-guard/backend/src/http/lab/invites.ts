import { withAuth } from '../middleware';
import {
    createInvite,
    listInvites,
    updateInvite,
    deleteInvite,
    getInviteByCode,
    addInviteUse,
    addMember,
    getMemberRoles,
} from '../../db/lab';
import { LabPermission, type LabMember, type LabInvite } from '@shared/db/lab';
import { hasLabPermission } from '../../utils/permissions';
import { getMemberRolePermissions } from '../../db/lab';
import type { InviteCreatePayload, InviteUpdatePayload } from '@shared/payloads';
import { WsEvent } from '@shared/payloads/ws';
import { findPublicUserById } from '../../db/user';
import { getLabState } from '../../utils/lab_state';

/**
 * POST /api/labs/:labId/invites
 */
export const createInviteRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.CREATE_INVITES)) {
        return new Response('Unauthorized', { status: 403 });
    }
    const { maxUses, expiresIn } = (await req.json()) as InviteCreatePayload;
    const code = Math.random().toString(36).slice(2, 8);
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
    const invite = await createInvite(state.db, labId, code, maxUses ?? null, expiresAt);
    // Notify all lab members including the creator
    state.sendToLab(labId, { op: WsEvent.INVITE_CREATED, d: { invite } });
    return Response.json(invite);
});

/**
 * GET /api/labs/:labId/invites
 */
export const listInvitesRoute = withAuth(async (_req, userId, state, params) => {
    const labId = Number(params.labId);
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.CREATE_INVITES)) {
        return new Response('Unauthorized', { status: 403 });
    }
    const invites = await listInvites(state.db, labId);
    return Response.json(invites);
});

/**
 * PATCH /api/labs/:labId/invites/:inviteId
 */
export const updateInviteRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const inviteId = Number(params.inviteId);
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.MANAGE_INVITES)) {
        return new Response('Unauthorized', { status: 403 });
    }
    const { maxUses, expiresAt } = (await req.json()) as InviteUpdatePayload;
    const invite = await updateInvite(
        state.db,
        inviteId,
        labId,
        maxUses ?? null,
        expiresAt ? new Date(expiresAt) : null,
    );
    // Broadcast update to all lab members including the actor
    state.sendToLab(labId, { op: WsEvent.INVITE_UPDATED, d: { invite } });
    return Response.json(invite);
});

/**
 * DELETE /api/labs/:labId/invites/:inviteId
 */
export const deleteInviteRoute = withAuth(async (_req, userId, state, params) => {
    const labId = Number(params.labId);
    const inviteId = Number(params.inviteId);
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.MANAGE_INVITES)) {
        return new Response('Unauthorized', { status: 403 });
    }
    await deleteInvite(state.db, inviteId, labId);
    // Inform all lab members that an invite was deleted
    state.sendToLab(labId, { op: WsEvent.INVITE_DELETED, d: { labId, inviteId } });
    return new Response(null, { status: 204 });
});

/**
 * POST /api/invites/:code
 */
export const useInviteRoute = withAuth(async (_req, userId, state, params) => {
    const code = params.code;
    const invite = await getInviteByCode(state.db, code);
    if (!invite) {
        return new Response('Not found', { status: 404 });
    }
    if (invite.expires_at && invite.expires_at < new Date()) {
        return new Response('Invite expired', { status: 410 });
    }
    if (invite.max_uses !== null && invite.uses >= invite.max_uses) {
        return new Response('Invite expired', { status: 410 });
    }
    const existing =
        await state.db`SELECT 1 FROM lab.members WHERE lab_id = ${invite.lab_id} AND user_id = ${userId}`;
    if (existing.length) {
        return new Response('Already member', { status: 400 });
    }
    const memberRow = await addMember(state.db, invite.lab_id, userId);
    const roles = await getMemberRoles(state.db, invite.lab_id, userId);
    const member: LabMember = {
        lab_id: memberRow.lab_id,
        user_id: memberRow.user_id,
        roles,
        joined_at: memberRow.joined_at,
    };
    const user = await findPublicUserById(state.db, userId);
    await addInviteUse(state.db, invite.id, userId);
    const updated: LabInvite = { ...invite, uses: invite.uses + 1 };
    // Register the joining user's existing sockets to this lab before broadcasting
    state.addUserToLab(userId, invite.lab_id);
    state.sendToLab(invite.lab_id, { op: WsEvent.MEMBER_JOINED, d: { labId: invite.lab_id, member, user } });
    // Notify lab members (including the joiner) about updated invite usage
    state.sendToLab(invite.lab_id, { op: WsEvent.INVITE_UPDATED, d: { invite: updated } });
    const lab = await getLabState(state.db, invite.lab_id, userId);
    if (!lab) {
        return new Response('Lab not found', { status: 500 });
    }
    return Response.json({ lab });
});
