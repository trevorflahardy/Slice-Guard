import {
    OpCode,
    type LabCreatePayload,
    type LabUpdatePayload,
    type LabDeletePayload,
    type RoleCreatePayload,
    type MemberAddPayload,
    type MemberRemovePayload,
} from "@shared/ws/opcodes";
import { withAuth, type AuthenticatedPayload, type HandlerMap } from ".";
import {
    createLab,
    updateLab,
    deleteLab,
    createRole,
    addMember,
    removeMember,
    getMemberRolePermissions,
} from "../../db/lab";
import { LabPermission } from "@shared/db/lab";
import { ErrorCode } from "@slice-guard/shared/ws/errors";

async function handleCreateLab(
    payload: AuthenticatedPayload<LabCreatePayload>
) {
    const { name, description, imageUrl } = payload.data.d;
    const lab = await createLab(
        payload.state.db,
        payload.userId,
        name,
        description ?? null,
        imageUrl ?? null
    );
    return { op: OpCode.LAB_CREATE, d: lab };
}

async function handleUpdateLab(
    payload: AuthenticatedPayload<LabUpdatePayload>
) {
    const { labId, name, description, imageUrl } = payload.data.d;
    const perms = await getMemberRolePermissions(
        payload.state.db,
        labId,
        payload.userId
    );
    if (perms === null || !(perms & LabPermission.EDIT_LAB)) {
        return ErrorCode.UNAUTHORIZED;
    }
    const lab = await updateLab(
        payload.state.db,
        labId,
        name,
        description ?? null,
        imageUrl ?? null
    );
    return { op: OpCode.LAB_UPDATE, d: lab };
}

async function handleDeleteLab(
    payload: AuthenticatedPayload<LabDeletePayload>
) {
    const { labId } = payload.data.d;
    const perms = await getMemberRolePermissions(
        payload.state.db,
        labId,
        payload.userId
    );
    if (perms === null || !(perms & LabPermission.DELETE_LAB)) {
        return ErrorCode.UNAUTHORIZED;
    }
    await deleteLab(payload.state.db, labId);
    return { op: OpCode.LAB_DELETE, d: {} };
}

async function handleCreateRole(
    payload: AuthenticatedPayload<RoleCreatePayload>
) {
    const { labId, name, permissions } = payload.data.d;
    const perms = await getMemberRolePermissions(
        payload.state.db,
        labId,
        payload.userId
    );
    if (perms === null || !(perms & LabPermission.MANAGE_ROLES)) {
        return ErrorCode.UNAUTHORIZED;
    }
    const role = await createRole(payload.state.db, labId, name, permissions);
    return { op: OpCode.ROLE_CREATE, d: role };
}

async function handleAddMember(
    payload: AuthenticatedPayload<MemberAddPayload>
) {
    const { labId, userId, roleId } = payload.data.d;
    const perms = await getMemberRolePermissions(
        payload.state.db,
        labId,
        payload.userId
    );
    if (perms === null || !(perms & LabPermission.MANAGE_ROLES)) {
        return ErrorCode.UNAUTHORIZED;
    }
    const member = await addMember(payload.state.db, labId, userId, roleId);
    return { op: OpCode.MEMBER_ADD, d: member };
}

async function handleRemoveMember(
    payload: AuthenticatedPayload<MemberRemovePayload>
) {
    const { labId, userId } = payload.data.d;
    const perms = await getMemberRolePermissions(
        payload.state.db,
        labId,
        payload.userId
    );
    if (perms === null || !(perms & LabPermission.REMOVE_USER)) {
        return ErrorCode.UNAUTHORIZED;
    }
    await removeMember(payload.state.db, labId, userId);
    return { op: OpCode.MEMBER_REMOVE, d: {} };
}

export const handlers: HandlerMap = {
    [OpCode.LAB_CREATE]: withAuth(handleCreateLab),
    [OpCode.LAB_UPDATE]: withAuth(handleUpdateLab),
    [OpCode.LAB_DELETE]: withAuth(handleDeleteLab),
    [OpCode.ROLE_CREATE]: withAuth(handleCreateRole),
    [OpCode.MEMBER_ADD]: withAuth(handleAddMember),
    [OpCode.MEMBER_REMOVE]: withAuth(handleRemoveMember),
};
