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
import { hasLabPermission } from "../../utils/permissions";
import type { LabCreatePayload, LabUpdatePayload } from "@shared/payloads";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { BunFile } from "bun";
import { WsEvent } from "@shared/payloads/ws";

/**
 * POST /api/labs
 */
const s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY as string,
        secretAccessKey: process.env.S3_SECRET_KEY as string,
    },
});

export const create = withAuth(async (req, userId, state) => {
    const { name, description, iconUrl } =
        (await req.json()) as LabCreatePayload;

    const lab = await createLab(
        state.db,
        userId,
        name,
        description ?? null,
        iconUrl ?? null
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
    const { name, description, iconUrl } =
        (await req.json()) as LabUpdatePayload;

    const perms = await getMemberRolePermissions(state.db, id, userId);
    if (!hasLabPermission(perms, LabPermission.EDIT_LAB))
        return new Response("Unauthorized", { status: 403 });

    const lab = await updateLab(
        state.db,
        id,
        name,
        description ?? null,
        iconUrl ?? null
    );

    state.broadcast({ op: WsEvent.LAB_UPDATED, d: { lab } });
    return Response.json(lab);
});

/**
 * DELETE /api/labs/:id
 */
export const del = withAuth(async (req, userId, state, params) => {
    const id = Number(params.id);
    const perms = await getMemberRolePermissions(state.db, id, userId);

    if (!hasLabPermission(perms, LabPermission.DELETE_LAB))
        return new Response("Unauthorized", { status: 403 });
    await deleteLab(state.db, id);

    return new Response(null, { status: 204 });
});

/**
 * POST /api/labs/:id/icon
 */
export const uploadIcon = withAuth(async (req, userId, state, params) => {
    const id = Number(params.id);
    const perms = await getMemberRolePermissions(state.db, id, userId);
    if (!hasLabPermission(perms, LabPermission.EDIT_LAB))
        return new Response("Unauthorized", { status: 403 });

    const form = await req.formData();
    const file = form.get("file") as BunFile | null;
    if (!file) return new Response("No file", { status: 400 });

    const key = `lab-icons/${id}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.S3_BUCKET as string,
            Key: key,
            Body: buffer,
            ContentType: file.type || "application/octet-stream",
        })
    );
    const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT;
    const url = `${publicEndpoint}/${process.env.S3_BUCKET}/${key}`;

    const current = await getLab(state.db, id);
    if (!current) return new Response("Not found", { status: 404 });
    const lab = await updateLab(state.db, id, current.name, current.description ?? null, url);
    state.broadcast({ op: WsEvent.LAB_UPDATED, d: { lab } });
    return Response.json(lab);
});
