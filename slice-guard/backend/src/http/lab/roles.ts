import { withAuth } from "../middleware";
import { createRole, getMemberRolePermissions, updateRole } from "../../db/lab";
import { LabPermission } from "@shared/db/lab";
import { hasLabPermission } from "../../utils/permissions";
import { WsEvent } from "@shared/payloads/ws";
import type { RoleCreatePayload, RoleUpdatePayload } from "@shared/payloads";

/**
 * POST /api/labs/:labId/roles
 */
export const createRoleRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { name, permissions } = (await req.json()) as RoleCreatePayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES))
        return new Response("Unauthorized", { status: 403 });

    const role = await createRole(state.db, labId, name, permissions);
    state.broadcast({ op: WsEvent.ROLE_CREATED, d: { role } });
    return Response.json(role);
});

/**
 * PATCH /api/labs/:labId/roles/:roleId
 */
export const updateRoleRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const roleId = Number(params.roleId);
    const { permissions } = (await req.json()) as RoleUpdatePayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES))
        return new Response("Unauthorized", { status: 403 });

    const role = await updateRole(state.db, labId, roleId, permissions);
    state.broadcast({ op: WsEvent.ROLE_UPDATED, d: { role } });
    return Response.json(role);
});
