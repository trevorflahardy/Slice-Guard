import { OpCode, type RequestCreatePayload, type RequestListPayload, type TagCreatePayload, type TagSetDefaultPayload, type RequestAssignTagPayload } from '@shared/ws/opcodes';
import { withAuth, type AuthenticatedPayload, type HandlerMap } from '.';
import { createPrintRequest, getUserPrintRequests, createTag, setTagDefault, assignTag, unassignTag } from '../../db/request';
import { saveRequestFile } from '../../utils/storage';
import { getMemberRolePermissions } from '../../db/lab';
import { LabPermission } from '@shared/db/lab';
import { ErrorCode } from '@slice-guard/shared/ws/errors';

async function handleCreateRequest(payload: AuthenticatedPayload<RequestCreatePayload>) {
    const { labId, file, metadata, description } = payload.data.d;
    const perms = await getMemberRolePermissions(payload.state.db, labId, payload.userId);
    if (perms !== null && !(perms & LabPermission.CREATE_REQUEST)) {
        return ErrorCode.UNAUTHORIZED;
    }
    const buffer = Buffer.from(file, 'base64');
    const path = await saveRequestFile(labId, buffer);
    const req = await createPrintRequest(payload.state.db, labId, payload.userId, path, metadata, description ?? null);
    return { op: OpCode.REQUEST_CREATE, d: req };
}

async function handleListRequests(payload: AuthenticatedPayload<RequestListPayload>) {
    const { labId } = payload.data.d;
    const reqs = await getUserPrintRequests(payload.state.db, labId, payload.userId);
    return { op: OpCode.REQUEST_LIST, d: reqs };
}

async function handleCreateTag(payload: AuthenticatedPayload<TagCreatePayload>) {
    const { labId, name, isDefault } = payload.data.d;
    const perms = await getMemberRolePermissions(payload.state.db, labId, payload.userId);
    if (perms === null || !(perms & LabPermission.MANAGE_ROLES)) {
        return ErrorCode.UNAUTHORIZED;
    }
    const tag = await createTag(payload.state.db, labId, name, isDefault ?? false);
    return { op: OpCode.TAG_CREATE, d: tag };
}

async function handleSetDefault(payload: AuthenticatedPayload<TagSetDefaultPayload>) {
    const { tagId, isDefault } = payload.data.d;
    const tag = await setTagDefault(payload.state.db, tagId, isDefault);
    return { op: OpCode.TAG_SET_DEFAULT, d: tag };
}

async function handleAssignTag(payload: AuthenticatedPayload<RequestAssignTagPayload>) {
    const { requestId, tagId, assign } = payload.data.d;
    if (assign) {
        await assignTag(payload.state.db, requestId, tagId);
    } else {
        await unassignTag(payload.state.db, requestId, tagId);
    }
    return { op: OpCode.REQUEST_ASSIGN_TAG, d: {} };
}

export const handlers: HandlerMap = {
    [OpCode.REQUEST_CREATE]: withAuth(handleCreateRequest),
    [OpCode.REQUEST_LIST]: withAuth(handleListRequests),
    [OpCode.TAG_CREATE]: withAuth(handleCreateTag),
    [OpCode.TAG_SET_DEFAULT]: withAuth(handleSetDefault),
    [OpCode.REQUEST_ASSIGN_TAG]: withAuth(handleAssignTag),
};
