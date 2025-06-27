import { withAuth } from './middleware';
import { createPrintRequest, getUserPrintRequests, createTag, setTagDefault, assignTag, unassignTag } from '../db/request';
import { saveRequestFile } from '../utils/storage';
import { getMemberRolePermissions } from '../db/lab';
import { LabPermission } from '@shared/db/lab';
import type State from '../utils/state';
import type {
    RequestCreatePayload,
    RequestListPayload,
    TagCreatePayload,
    TagSetDefaultPayload,
    RequestAssignTagPayload,
} from '@shared/ws/opcodes';

/**
 * POST /api/labs/:labId/requests
 */
export const create = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { file, metadata, description } = await req.json() as RequestCreatePayload['d'];
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms !== null && !(perms & LabPermission.CREATE_REQUEST)) {
        return new Response('Unauthorized', { status: 403 });
    }
    const buffer = Buffer.from(file, 'base64');
    const path = await saveRequestFile(labId, buffer);
    const result = await createPrintRequest(state.db, labId, userId, path, metadata, description ?? null);
    return Response.json(result);
});

/**
 * GET /api/labs/:labId/requests
 */
export const list = withAuth(async (_req, userId, state, params) => {
    const labId = Number(params.labId);
    const reqs = await getUserPrintRequests(state.db, labId, userId);
    return Response.json(reqs);
});

/**
 * POST /api/labs/:labId/tags
 */
export const createTagRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { name, isDefault } = await req.json() as TagCreatePayload['d'];
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null || !(perms & LabPermission.MANAGE_ROLES)) return new Response('Unauthorized', { status: 403 });
    const tag = await createTag(state.db, labId, name, isDefault ?? false);
    return Response.json(tag);
});

/**
 * PATCH /api/tags/:tagId
 */
export const setTagDefaultRoute = withAuth(async (req, _userId, state, params) => {
    const tagId = Number(params.tagId);
    const { isDefault } = await req.json() as TagSetDefaultPayload['d'];
    const tag = await setTagDefault(state.db, tagId, isDefault);
    return Response.json(tag);
});

/**
 * POST /api/requests/:requestId/tags/:tagId
 */
export const assignTagRoute = withAuth(async (req, _userId, state, params) => {
    const requestId = Number(params.requestId);
    const tagId = Number(params.tagId);
    const { assign } = await req.json() as RequestAssignTagPayload['d'];
    if (assign) {
        await assignTag(state.db, requestId, tagId);
    } else {
        await unassignTag(state.db, requestId, tagId);
    }
    return new Response(null, { status: 204 });
});
