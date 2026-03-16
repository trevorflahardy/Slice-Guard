import type { SQL } from 'bun';
import {
    listLabsForUser,
    getLabMembersWithDetails,
    listInvites,
    getMemberRolePermissions,
    getLab,
} from '../db/lab';
import { getRequestsWithDetails, listTags } from '../db/lab/request';
import { listChannels } from '../db/lab/channel';
import type { LabRole, LabInvite } from '@shared/db/lab';
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
      SELECT id, lab_id, name, permissions, rank, color, created_at
        FROM lab.roles WHERE lab_id = ${lab.id}
        ORDER BY rank DESC, id ASC`) as any;

        // Load members with their roles and public user info
        const memberDetails = await getLabMembersWithDetails(db, lab.id);
        const members: MemberEvent[] = memberDetails.map((d) => ({
            labId: lab.id,
            member: { ...d.member, roles: d.roles },
            user: d.user,
        }));

        // Load tags for the lab
        const tags: RequestTag[] = await listTags(db, lab.id);
        // Load invites for the lab
        const invites: LabInvite[] = await listInvites(db, lab.id);
        // Compute permissions for the connected user
        const permissions = await getMemberRolePermissions(db, lab.id, userId);

        // Load requests with their tags and user info
        const requests: PrintRequestEvent[] = await getRequestsWithDetails(db, lab.id);

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
    SELECT id, lab_id, name, permissions, rank, color, created_at
      FROM lab.roles WHERE lab_id = ${labId}
      ORDER BY rank DESC, id ASC`) as any;

    // Load members with their roles and public user info
    const memberDetails = await getLabMembersWithDetails(db, labId);
    const members: MemberEvent[] = memberDetails.map((d) => ({
        labId,
        member: { ...d.member, roles: d.roles },
        user: d.user,
    }));

    // Load tags for the lab
    const tags: RequestTag[] = await listTags(db, labId);
    // Load invites for the lab
    const invites: LabInvite[] = await listInvites(db, labId);
    // Permissions for the connected user
    const permissions = await getMemberRolePermissions(db, labId, userId);

    // Load requests with their tags and user info
    const requests: PrintRequestEvent[] = await getRequestsWithDetails(db, labId);

    const channels = await listChannels(db, labId);

    return { lab, roles, members, tags, requests, invites, permissions, channels, messages: {} };
}
