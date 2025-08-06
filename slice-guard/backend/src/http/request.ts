import { withAuth } from './middleware';
import {
    createPrintRequest,
    getUserPrintRequests,
    getAllPrintRequests,
    getPrintRequestById,
    setRequestClosed,
    deletePrintRequest,
    createTag,
    setTagDefault,
    assignTag,
    unassignTag,
    listTags,
    deleteTag,
    getTagsForRequest,
} from '../db/lab/request';
import { compressRequestFile } from '../utils/storage';
import { getMemberRolePermissions } from '../db/lab';
import { findPublicUserById } from '../db/user';
import { LabPermission } from '@shared/db/lab';
import { hasLabPermission } from '../utils/permissions';
import type {
    RequestCreatePayload,
    TagCreatePayload,
    TagSetDefaultPayload,
    RequestAssignTagPayload,
    RequestStateUpdatePayload,
} from '@shared/payloads';
import { WsEvent, type PrintRequestEvent } from '@shared/payloads/ws';

/**
 * POST /api/labs/:labId/requests
 */
export const create = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { file, metadata, title, description } = await req.json() as RequestCreatePayload;

    state.logger.debug({ labId, userId }, 'Creating print request');
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (perms !== null && !hasLabPermission(perms, LabPermission.CREATE_REQUEST)) {
        return new Response('Unauthorized', { status: 403 });
    }

    const buffer = Buffer.from(file, 'base64');
    const compressed = compressRequestFile(buffer);
    const result = await createPrintRequest(state.db, labId, userId, compressed, metadata, title, description ?? null);
    state.logger.debug({ id: result.id }, 'Created print request');

    // Broadcast the new request to other connected clients
    const user = await findPublicUserById(state.db, userId);
    const tags = await getTagsForRequest(state.db, result.id);
    const payload: PrintRequestEvent = { request: result, user, tags };
    state.broadcast({ op: WsEvent.REQUEST_CREATED, d: payload });

    return Response.json(result);
});

/**
 * GET /api/labs/:labId/requests
 */
export const list = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const url = new URL(req.url);
    const stateFilter = url.searchParams.get('state');
    state.logger.debug({ labId, userId }, 'Listing requests');
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    let rows = await getUserPrintRequests(state.db, labId, userId);
    if (perms !== null && (perms & LabPermission.MANAGE_REQUESTS)) {
        rows = await getAllPrintRequests(state.db, labId);
    }
    if (stateFilter === 'open') rows = rows.filter(r => !r.is_closed);
    else if (stateFilter === 'closed') rows = rows.filter(r => r.is_closed);
    const results = [] as any[];
    for (const r of rows) {
        const user = await findPublicUserById(state.db, r.user_id);
        const tags = await getTagsForRequest(state.db, r.id);
        results.push({ request: r, user, tags });
    }
    results.sort((a, b) => {
        if (a.request.is_closed !== b.request.is_closed) {
            return a.request.is_closed ? 1 : -1;
        }
        return new Date(b.request.created_at).getTime() - new Date(a.request.created_at).getTime();
    });
    return Response.json(results);
});

/**
 * GET /api/labs/:labId/requests/:requestId
 */
export const getRoute = withAuth(async (_req, userId, state, params) => {
    const labId = Number(params.labId);
    const requestId = Number(params.requestId);
    const row = await getPrintRequestById(state.db, requestId);
    if (!row || row.lab_id !== labId) return new Response('Not found', { status: 404 });
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (row.user_id !== userId && (perms == null || !hasLabPermission(perms, LabPermission.MANAGE_REQUESTS))) {
        return new Response('Unauthorized', { status: 403 });
    }
    const user = await findPublicUserById(state.db, row.user_id);
    const tags = await getTagsForRequest(state.db, requestId);
    return Response.json({ request: row, user, tags });
});

/**
 * POST /api/labs/:labId/tags
 */
export const createTagRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const { name, color, isDefault } = await req.json() as TagCreatePayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES))
        return new Response('Unauthorized', { status: 403 });
    state.logger.debug({ labId, name, color }, 'Creating tag');
    const tag = await createTag(state.db, labId, name, color, isDefault ?? false);
    state.logger.debug({ id: tag.id }, 'Created tag');
    state.broadcast({ op: WsEvent.TAG_CREATED, d: { tag } });
    return Response.json(tag);
});

/**
 * PATCH /api/labs/:labId/tags/:tagId
 */
export const setTagDefaultRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const tagId = Number(params.tagId);
    const { isDefault } = await req.json() as TagSetDefaultPayload;

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES))
        return new Response('Unauthorized', { status: 403 });

    state.logger.debug({ tagId, isDefault }, 'Setting tag default');
    const tag = await setTagDefault(state.db, tagId, isDefault);
    state.logger.debug({ tagId }, 'Updated tag');
    state.broadcast({ op: WsEvent.TAG_UPDATED, d: { tag } });
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
 * POST /api/labs/:labId/requests/:requestId/tags/:tagId
 */
export const assignTagRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const requestId = Number(params.requestId);
    const tagId = Number(params.tagId);

    const { assign } = await req.json() as RequestAssignTagPayload;
    state.logger.debug({ requestId, tagId, assign }, 'Updating tag assignment');

    const row = await getPrintRequestById(state.db, requestId);
    if (!row || row.lab_id !== labId) return new Response('Not found', { status: 404 });
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (row.user_id !== userId && (perms == null || !hasLabPermission(perms, LabPermission.MANAGE_REQUESTS))) {
        return new Response('Unauthorized', { status: 403 });
    }

    if (assign) {
        await assignTag(state.db, requestId, tagId);
    } else {
        await unassignTag(state.db, requestId, tagId);
    }
    const updated = await getPrintRequestById(state.db, requestId);
    if (updated) {
        const user = await findPublicUserById(state.db, updated.user_id);
        const tags = await getTagsForRequest(state.db, requestId);
        state.broadcast({ op: WsEvent.REQUEST_UPDATED, d: { request: updated, user, tags } });
    }
    return new Response(null, { status: 204 });
});

/**
 * PATCH /api/labs/:labId/requests/:requestId
 */
export const setRequestStateRoute = withAuth(async (req, userId, state, params) => {
    const labId = Number(params.labId);
    const requestId = Number(params.requestId);
    const { isClosed } = await req.json() as RequestStateUpdatePayload;
    const row = await getPrintRequestById(state.db, requestId);
    if (!row || row.lab_id !== labId) return new Response('Not found', { status: 404 });
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (row.user_id !== userId && (perms == null || !hasLabPermission(perms, LabPermission.MANAGE_REQUESTS))) {
        return new Response('Unauthorized', { status: 403 });
    }
    const updated = await setRequestClosed(state.db, requestId, isClosed);
    const user = await findPublicUserById(state.db, updated.user_id);
    const tags = await getTagsForRequest(state.db, requestId);
    state.broadcast({ op: WsEvent.REQUEST_UPDATED, d: { request: updated, user, tags } });
    return Response.json(updated);
});

/**
 * DELETE /api/labs/:labId/requests/:requestId
 */
export const deleteRoute = withAuth(async (_req, userId, state, params) => {
    const labId = Number(params.labId);
    const requestId = Number(params.requestId);
    const row = await getPrintRequestById(state.db, requestId);
    if (!row || row.lab_id !== labId) return new Response('Not found', { status: 404 });
    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (row.user_id !== userId && !hasLabPermission(perms, LabPermission.MANAGE_REQUESTS)) {
        return new Response('Unauthorized', { status: 403 });
    }
    await deletePrintRequest(state.db, requestId);
    state.broadcast({ op: WsEvent.REQUEST_DELETED, d: { labId, requestId } });
    return new Response(null, { status: 204 });
});

/**
 * DELETE /api/labs/:labId/tags/:tagId
 */
export const deleteTagRoute = withAuth(async (_req, userId, state, params) => {
    const labId = Number(params.labId);
    const tagId = Number(params.tagId);

    const perms = await getMemberRolePermissions(state.db, labId, userId);
    if (!hasLabPermission(perms, LabPermission.MANAGE_ROLES))
        return new Response('Unauthorized', { status: 403 });

    await deleteTag(state.db, tagId);
    state.broadcast({ op: WsEvent.TAG_DELETED, d: { labId, tagId } });
    return new Response(null, { status: 204 });
});