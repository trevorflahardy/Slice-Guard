import { withAuth } from "../middleware";
import { createRole, getMemberRolePermissions } from "../../db/lab";
import { LabPermission } from "@shared/db/lab";
import { hasLabPermission } from "../../utils/permissions";
import type { RoleCreatePayload } from "@shared/payloads";

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

    return Response.json(role);
});
