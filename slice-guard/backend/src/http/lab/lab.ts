import { withAuth } from "../middleware";
import {
    createLab,
    updateLab,
    deleteLab,
    getLab,
    listLabsForUser,
    getMemberRolePermissions,
} from "../../db/lab";
import { LabPermission } from "@shared/db/lab";
import type { LabCreatePayload, LabUpdatePayload } from "@shared/payloads";

/**
 * POST /api/labs
 */
export const create = withAuth(async (req, userId, state) => {
    const { name, description, imageUrl } =
        (await req.json()) as LabCreatePayload;
    const lab = await createLab(
        state.db,
        userId,
        name,
        description ?? null,
        imageUrl ?? null
    );

    return Response.json(lab);
});

/**
 * GET /api/labs/:id
 */
export const get = withAuth(async (_req, _userId, state, params) => {
    const lab = await getLab(state.db, Number(params.id));
    if (!lab) return new Response("Not found", { status: 404 });

    return Response.json(lab);
});

/**
 * GET /api/labs
 */
export const list = withAuth(async (_req, userId, state) => {
    const labs = await listLabsForUser(state.db, userId);
    return Response.json(labs);
});

/**
 * PATCH /api/labs/:id
 */
export const update = withAuth(async (req, userId, state, params) => {
    const id = Number(params.id);
    const { name, description, imageUrl } =
        (await req.json()) as LabUpdatePayload;
    const perms = await getMemberRolePermissions(state.db, id, userId);
    if (perms === null || !(perms & LabPermission.EDIT_LAB))
        return new Response("Unauthorized", { status: 403 });
    const lab = await updateLab(
        state.db,
        id,
        name,
        description ?? null,
        imageUrl ?? null
    );

    return Response.json(lab);
});

/**
 * DELETE /api/labs/:id
 */
export const del = withAuth(async (req, userId, state, params) => {
    const id = Number(params.id);
    const perms = await getMemberRolePermissions(state.db, id, userId);

    if (perms === null || !(perms & LabPermission.DELETE_LAB))
        return new Response("Unauthorized", { status: 403 });
    await deleteLab(state.db, id);

    return new Response(null, { status: 204 });
});
