import { withAuth } from './middleware';
import { createPrintRequest, getUserPrintRequests, createTag, setTagDefault, assignTag, unassignTag } from '../db/request';
import { saveRequestFile } from '../utils/storage';
import { getMemberRolePermissions } from '../db/lab';
import { LabPermission } from '@shared/db/lab';
import { withCors } from '../utils/cors';
import type {
    RequestCreatePayload,
    RequestListPayload,
    TagCreatePayload,
    TagSetDefaultPayload,
    RequestAssignTagPayload,
} from '@shared/payloads';

/**
 * POST /api/labs/:labId/requests
 */
export const create = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { file, metadata, description } = await req.json() as RequestCreatePayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms !== null && !(perms & LabPermission.CREATE_REQUEST)) {
        return withCors(new Response('Unauthorized', { status: 403 }));
    }

    const buffer = Buffer.from(file, 'base64');
    const path = await saveRequestFile(labId, buffer);
    const result = await createPrintRequest(state.db, labId, userId, path, metadata, description ?? null);
    return withCors(Response.json(result));
});

/**
 * GET /api/labs/:labId/requests
 */
export const list = withAuth(async (_req, userId, state, params) => {
    const labId = Number(params.labId);
    const reqs = await getUserPrintRequests(state.db, labId, userId);
    return withCors(Response.json(reqs));
});

/**
 * POST /api/labs/:labId/tags
 */
export const createTagRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { name, isDefault } = await req.json() as TagCreatePayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null || !(perms & LabPermission.MANAGE_ROLES))
        return withCors(new Response('Unauthorized', { status: 403 }));

    const tag = await createTag(state.db, labId, name, isDefault ?? false);
    return withCors(Response.json(tag));
});

/**
 * PATCH /api/tags/:tagId
 */
export const setTagDefaultRoute = withAuth(async (req, _userId, state, params) => {
    const tagId = Number(params.tagId);
    const { isDefault } = await req.json() as TagSetDefaultPayload;

    const tag = await setTagDefault(state.db, tagId, isDefault);
    return withCors(Response.json(tag));
});

/**
 * POST /api/requests/:requestId/tags/:tagId
 */
export const assignTagRoute = withAuth(async (req, _userId, state, params) => {
    const requestId = Number(params.requestId);
    const tagId = Number(params.tagId);

    const { assign } = await req.json() as RequestAssignTagPayload;
    if (assign) {
        await assignTag(state.db, requestId, tagId);
    } else {
        await unassignTag(state.db, requestId, tagId);
    }
    return withCors(new Response(null, { status: 204 }));
});