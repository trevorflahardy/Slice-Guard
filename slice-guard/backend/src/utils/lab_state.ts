import type { SQL } from 'bun';
import {
    listLabsForUser,
    listMembers,
    getMemberRoles,
    listInvites,
    getMemberRolePermissions,
    getLab,
} from '../db/lab';
import { getAllPrintRequests, getTagsForRequest, listTags } from '../db/lab/request';
import { listChannels } from '../db/lab/channel';
import { findPublicUserById } from '../db/user';
import type { LabRole, LabMember, LabInvite } from '@shared/db/lab';
import type { LabState, MemberEvent, PrintRequestEvent } from '@shared/payloads/ws';
import type { RequestTag } from '@shared/db/request';

/**
 * Load the full lab state for all labs the user belongs to.
 */
export async function getUserLabStates(db: SQL, userId: number): Promise<LabState[]> {
    const labs = await listLabsForUser(db, userId);
    const result: LabState[] = [];

    for (const lab of labs) {
        // Load roles for the lab
        const roles: LabRole[] = (await db`
      SELECT id, lab_id, name, permissions, created_at
        FROM lab.roles WHERE lab_id = ${lab.id}`) as any;

        // Load members with their roles and public user info
        const memberRows = await listMembers(db, lab.id);
        const members: MemberEvent[] = [];
        for (const row of memberRows) {
            const user = await findPublicUserById(db, row.user_id);
            const mRoles = await getMemberRoles(db, lab.id, row.user_id);
            const member: LabMember = {
                lab_id: row.lab_id,
                user_id: row.user_id,
                roles: mRoles,
                joined_at: row.joined_at,
            };
            members.push({ labId: lab.id, member, user });
        }

        // Load tags for the lab
        const tags: RequestTag[] = await listTags(db, lab.id);
        // Load invites for the lab
        const invites: LabInvite[] = await listInvites(db, lab.id);
        // Compute permissions for the connected user
        const permissions = await getMemberRolePermissions(db, lab.id, userId);

        // Load requests with their tags and user info
        const requestRows = await getAllPrintRequests(db, lab.id);
        const requests: PrintRequestEvent[] = [];
        for (const r of requestRows) {
            const user = await findPublicUserById(db, r.user_id);
            const rTags = await getTagsForRequest(db, r.id);
            requests.push({ request: r, user, tags: rTags });
        }

        // Load channels for the lab
        const channels = await listChannels(db, lab.id);

        result.push({
            lab,
            roles,
            members,
            tags,
            requests,
            invites,
            permissions,
            channels,
            messages: {},
        });
    }

    return result;
}

/**
 * Load the full state for a single lab that the user is a member of.
 */
export async function getLabState(
    db: SQL,
    labId: number,
    userId: number,
): Promise<LabState | null> {
    const lab = await getLab(db, labId);
    if (!lab) {
        return null;
    }

    // Load roles
    const roles: LabRole[] = (await db`
    SELECT id, lab_id, name, permissions, created_at
      FROM lab.roles WHERE lab_id = ${labId}`) as any;

    // Load members with their roles and public user info
    const memberRows = await listMembers(db, labId);
    const members: MemberEvent[] = [];
    for (const row of memberRows) {
        const user = await findPublicUserById(db, row.user_id);
        const mRoles = await getMemberRoles(db, labId, row.user_id);
        const member: LabMember = {
            lab_id: row.lab_id,
            user_id: row.user_id,
            roles: mRoles,
            joined_at: row.joined_at,
        };
        members.push({ labId, member, user });
    }

    // Load tags for the lab
    const tags: RequestTag[] = await listTags(db, labId);
    // Load invites for the lab
    const invites: LabInvite[] = await listInvites(db, labId);
    // Permissions for the connected user
    const permissions = await getMemberRolePermissions(db, labId, userId);

    // Load requests with their tags and user info
    const requestRows = await getAllPrintRequests(db, labId);
    const requests: PrintRequestEvent[] = [];
    for (const r of requestRows) {
        const user = await findPublicUserById(db, r.user_id);
        const rTags = await getTagsForRequest(db, r.id);
        requests.push({ request: r, user, tags: rTags });
    }

    const channels = await listChannels(db, labId);

    return { lab, roles, members, tags, requests, invites, permissions, channels, messages: {} };
}
