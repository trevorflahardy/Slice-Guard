import type { SQL } from "bun";
import type { LabRoleRow } from ".";


/**
 * Represents a member of a lab, including the lab ID, user ID, and the date they joined.
 */
export interface LabMemberRow {
    lab_id: number;
    user_id: number;
    joined_at: Date;
}

export async function addMember(
    db: SQL,
    labId: number,
    userId: number,
    roleId: number | null = null
): Promise<LabMemberRow> {
    const rows: LabMemberRow[] = await db`
        INSERT INTO lab.members (lab_id, user_id)
             VALUES (${labId}, ${userId})
        RETURNING lab_id, user_id, joined_at
    `;
    const member = rows[0];

    const [{ default_role_id }] = await db`
        SELECT default_role_id FROM lab.labs WHERE id = ${labId}
    `;

    if (default_role_id !== null && default_role_id !== undefined) {
        await db`
            INSERT INTO lab.member_roles (lab_id, user_id, role_id)
                 VALUES (${labId}, ${userId}, ${default_role_id})
        `;
    }

    if (roleId !== null && roleId !== default_role_id) {
        await db`
            INSERT INTO lab.member_roles (lab_id, user_id, role_id)
                 VALUES (${labId}, ${userId}, ${roleId})
        `;
    }

    return member;
}

export async function removeMember(
    db: SQL,
    labId: number,
    userId: number
): Promise<void> {
    await db`
        DELETE FROM lab.members
         WHERE lab_id = ${labId} AND user_id = ${userId}
    `;
}

export async function getMember(
    db: SQL,
    labId: number,
    userId: number
): Promise<LabMemberRow | null> {
    const rows: LabMemberRow[] = await db`
        SELECT lab_id, user_id, joined_at
          FROM lab.members
         WHERE lab_id = ${labId} AND user_id = ${userId}
    `;
    const [row] = rows;
    return row ?? null;
}

export async function listMembers(
    db: SQL,
    labId: number
): Promise<LabMemberRow[]> {
    const rows: LabMemberRow[] = await db`
        SELECT lab_id, user_id, joined_at
          FROM lab.members
         WHERE lab_id = ${labId}
    `;
    return rows;
}

export async function getMemberRoles(
    db: SQL,
    labId: number,
    userId: number
): Promise<LabRoleRow[]> {
    const rows: LabRoleRow[] = await db`
        SELECT r.id, r.lab_id, r.name, r.permissions, r.created_at
          FROM lab.member_roles mr
          JOIN lab.roles r ON mr.role_id = r.id
         WHERE mr.lab_id = ${labId} AND mr.user_id = ${userId}
         ORDER BY r.id
    `;
    return rows;
}
