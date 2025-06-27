import { withAuth } from "./middleware";
import {
    createLab,
    updateLab,
    deleteLab,
    createRole,
    addMember,
    removeMember,
    getMemberRolePermissions,
    getLab,
    listLabsForUser,
} from "../db/lab";
import { LabPermission } from "@shared/db/lab";
import { withCors } from "../utils/cors";
import type {
    LabCreatePayload,
    LabUpdatePayload,
    RoleCreatePayload,
    MemberAddPayload,
} from "@shared/payloads";

/**
 * POST /api/labs
 */
export const create = withAuth(async (req, userId, state) => {
    const { name, description, imageUrl } =
        (await req.json()) as LabCreatePayload;
    state.logger.debug({ name }, 'Creating lab');
    const lab = await createLab(
        state.db,
        userId,
        name,
        description ?? null,
        imageUrl ?? null
    );
    state.logger.debug({ id: lab.id }, 'Created lab');

    return withCors(Response.json(lab));
});

/**
 * GET /api/labs/:id
 */
export const get = withAuth(async (_req, _userId, state, params) => {
    const labId = Number(params.id);
    state.logger.debug({ labId }, 'Fetching lab');
    const lab = await getLab(state.db, labId);
    if (!lab) {
        state.logger.debug('Lab not found');
        return withCors(new Response("Not found", { status: 404 }));
    }

    return withCors(Response.json(lab));
});

/**
 * GET /api/labs
 */
export const list = withAuth(async (_req, userId, state) => {
    state.logger.debug({ userId }, 'Listing labs');
    const labs = await listLabsForUser(state.db, userId);
    return withCors(Response.json(labs));
});

/**
 * PATCH /api/labs/:id
 */
export const update = withAuth(async (req, userId, state, params) => {
    const id = Number(params.id);
    const { name, description, imageUrl } =
        (await req.json()) as LabUpdatePayload;
    state.logger.debug({ id }, 'Updating lab');
    const perms = await getMemberRolePermissions(state.db, id, userId);
    if (perms === null || !(perms & LabPermission.EDIT_LAB))
        return withCors(new Response("Unauthorized", { status: 403 }));
    const lab = await updateLab(
        state.db,
        id,
        name,
        description ?? null,
        imageUrl ?? null
    );

    state.logger.debug({ id: lab.id }, 'Updated lab');

    return withCors(Response.json(lab));
});

/**
 * DELETE /api/labs/:id
 */
export const del = withAuth(async (req, userId, state, params) => {
    const id = Number(params.id);
    state.logger.debug({ id }, 'Deleting lab');
    const perms = await getMemberRolePermissions(state.db, id, userId);

    if (perms === null || !(perms & LabPermission.DELETE_LAB))
        return withCors(new Response("Unauthorized", { status: 403 }));
    await deleteLab(state.db, id);
    state.logger.debug({ id }, 'Deleted lab');

    return withCors(new Response(null, { status: 204 }));
});

/**
 * POST /api/labs/:labId/roles
 */
export const createRoleRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { name, permissions } = (await req.json()) as RoleCreatePayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null || !(perms & LabPermission.MANAGE_ROLES))
        return withCors(new Response("Unauthorized", { status: 403 }));
    state.logger.debug({ labId, name }, 'Creating role');
    const role = await createRole(state.db, labId, name, permissions);
    state.logger.debug({ id: role.id }, 'Created role');

    return withCors(Response.json(role));
});

/**
 * POST /api/labs/:labId/members
 */
export const addMemberRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { userId: addId, roleId } = (await req.json()) as MemberAddPayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null || !(perms & LabPermission.MANAGE_ROLES))
        return withCors(new Response("Unauthorized", { status: 403 }));
    state.logger.debug({ labId, addId }, 'Adding member');
    const member = await addMember(state.db, labId, addId, roleId ?? null);
    state.logger.debug({ labId, addId }, 'Added member');
    return withCors(Response.json(member));
});

/**
 * DELETE /api/labs/:labId/members/:userId
 */
export const removeMemberRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const removeId = Number(params.userId);

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null || !(perms & LabPermission.REMOVE_USER))
        return withCors(new Response("Unauthorized", { status: 403 }));

    state.logger.debug({ labId, removeId }, "Removing member");
    await removeMember(state.db, labId, removeId);
    state.logger.debug({ labId, removeId }, "Removed member");
    return withCors(new Response(null, { status: 204 }));
}
);
