import { withAuth } from "../middleware";
import {
    addMember,
    removeMember,
    getMember,
    listMembers,
    getMemberRoles,
    getMemberRolePermissions,
} from "../../db/lab";
import { findPublicUserById } from "../../db/user";
import { LabPermission, type LabMember } from "@shared/db/lab";
import { hasLabPermission } from "../../utils/permissions";
import type { MemberAddPayload } from "@shared/payloads";
import { WsEvent } from "@shared/payloads/ws";

/**
 * POST /api/labs/:labId/members
 */
export const addMemberRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { userId: addId, roleId } = (await req.json()) as MemberAddPayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES))
        return new Response("Unauthorized", { status: 403 });

    const memberRow = await addMember(state.db, labId, addId, roleId ?? null);
    const roles = await getMemberRoles(state.db, labId, addId);
    const member: LabMember = { ...memberRow, roles };
    const user = await findPublicUserById(state.db, addId);
    state.broadcast({ op: WsEvent.MEMBER_JOINED, d: { labId, member, user } });
    return Response.json(member);
});

/**
 * DELETE /api/labs/:labId/members/:userId
 */
export const removeMemberRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const removeId = Number(params.userId);

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.REMOVE_USER))
        return new Response("Unauthorized", { status: 403 });

    await removeMember(state.db, labId, removeId);
    state.broadcast({ op: WsEvent.MEMBER_LEFT, d: { labId, userId: removeId } });
    return new Response(null, { status: 204 });
});

/**
 * GET /api/labs/:labId/members/:userId
 */
export const getMemberRoute = withAuth(async (_req, userId, state, params) => {
    const labId = Number(params.labId);
    const targetId = Number(params.userId);

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null) return new Response("Unauthorized", { status: 403 });

    const row = await getMember(state.db, labId, targetId);
    if (!row) return new Response("Not found", { status: 404 });

    const user = await findPublicUserById(state.db, targetId);
    if (!user) return new Response("Not found", { status: 404 });

    const roles = await getMemberRoles(state.db, labId, targetId);
    const member: LabMember = {
        lab_id: row.lab_id,
        user_id: row.user_id,
        roles,
        joined_at: row.joined_at,
    };

    return Response.json({ member, user });
});

/**
 * GET /api/labs/:labId/members
 */
export const listMembersRoute = withAuth(async (_req, userId, state, params) => {
    const labId = Number(params.labId);

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null) return new Response("Unauthorized", { status: 403 });

    const rows = await listMembers(state.db, labId);
    const results = [] as any[];
    for (const row of rows) {
        const user = await findPublicUserById(state.db, row.user_id);
        if (!user) continue;
        const roles = await getMemberRoles(state.db, labId, row.user_id);
        const member: LabMember = {
            lab_id: row.lab_id,
            user_id: row.user_id,
            roles,
            joined_at: row.joined_at,
        };
        results.push({ member, user });
    }

    return Response.json(results);
});
