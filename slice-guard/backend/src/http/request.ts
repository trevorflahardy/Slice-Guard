import { withAuth } from './middleware';
import {
    createPrintRequest,
    getUserPrintRequests,
    getAllPrintRequests,
    createTag,
    setTagDefault,
    assignTag,
    unassignTag,
    listTags,
    getTagsForRequest,
} from '../db/request';
import { saveRequestFile } from '../utils/storage';
import { getMemberRolePermissions } from '../db/lab';
import { findPublicUserById } from '../db/user';
import { LabPermission } from '@shared/db/lab';
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

    state.logger.debug({ labId, userId }, 'Creating print request');
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms !== null && !(perms & LabPermission.CREATE_REQUEST)) {
        return new Response('Unauthorized', { status: 403 });
    }

    const buffer = Buffer.from(file, 'base64');
    const path = await saveRequestFile(labId, buffer);
    const result = await createPrintRequest(state.db, labId, userId, path, metadata, description ?? null);
    state.logger.debug({ id: result.id }, 'Created print request');
    return Response.json(result);
});

/**
 * GET /api/labs/:labId/requests
 */
export const list = withAuth(async (_req, userId, state, params) => {
    const labId = Number(params.labId);
    state.logger.debug({ labId, userId }, 'Listing requests');
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    let rows = await getUserPrintRequests(state.db, labId, userId);
    if (perms !== null && (perms & LabPermission.MANAGE_REQUESTS)) {
        rows = await getAllPrintRequests(state.db, labId);
    }
    const results = [] as any[];
    for (const r of rows) {
        const user = await findPublicUserById(state.db, r.user_id);
        const tags = await getTagsForRequest(state.db, r.id);
        results.push({ request: r, user, tags });
    }
    return Response.json(results);
});

/**
 * POST /api/labs/:labId/tags
 */
export const createTagRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { name, isDefault } = await req.json() as TagCreatePayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null || !(perms & LabPermission.MANAGE_ROLES))
        return new Response('Unauthorized', { status: 403 });
    state.logger.debug({ labId, name }, 'Creating tag');
    const tag = await createTag(state.db, labId, name, isDefault ?? false);
    state.logger.debug({ id: tag.id }, 'Created tag');
    return Response.json(tag);
});

/**
 * PATCH /api/tags/:tagId
 */
export const setTagDefaultRoute = withAuth(async (req, _userId, state, params) => {
    const tagId = Number(params.tagId);
    const { isDefault } = await req.json() as TagSetDefaultPayload;

    state.logger.debug({ tagId, isDefault }, 'Setting tag default');
    const tag = await setTagDefault(state.db, tagId, isDefault);
    state.logger.debug({ tagId }, 'Updated tag');
    return Response.json(tag);
});

/**
 * GET /api/labs/:labId/tags
 */
export const listTagsRoute = withAuth(async (_req, userId, state, params) => {
    const labId = Number(params.labId);
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms === null) return new Response('Unauthorized', { status: 403 });
    const tags = await listTags(state.db, labId);
    return Response.json(tags);
});

/**
 * POST /api/requests/:requestId/tags/:tagId
 */
export const assignTagRoute = withAuth(async (req, _userId, state, params) => {
    const requestId = Number(params.requestId);
    const tagId = Number(params.tagId);

    const { assign } = await req.json() as RequestAssignTagPayload;
    state.logger.debug({ requestId, tagId, assign }, 'Updating tag assignment');
    if (assign) {
        await assignTag(state.db, requestId, tagId);
    } else {
        await unassignTag(state.db, requestId, tagId);
    }
    return new Response(null, { status: 204 });
});