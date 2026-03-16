import type { SQL } from 'bun';
import type { LabRoleRow } from '.';

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
    roleId: number | null = null,
): Promise<LabMemberRow> {
    return await db.begin(async (tx) => {
        const rows: LabMemberRow[] = await tx`
            INSERT INTO lab.members (lab_id, user_id)
                 VALUES (${labId}, ${userId})
            RETURNING lab_id, user_id, joined_at
        `;
        const member = rows[0];

        const [{ default_role_id }] = await tx`
            SELECT default_role_id FROM lab.labs WHERE id = ${labId}
        `;

        await tx`
            INSERT INTO lab.member_roles (lab_id, user_id, role_id)
                 VALUES (${labId}, ${userId}, ${default_role_id})
        `;

        if (roleId !== null && roleId !== default_role_id) {
            await tx`
                INSERT INTO lab.member_roles (lab_id, user_id, role_id)
                     VALUES (${labId}, ${userId}, ${roleId})
            `;
        }

        return member;
    });
}

export async function removeMember(db: SQL, labId: number, userId: number): Promise<void> {
    await db`
        DELETE FROM lab.members
         WHERE lab_id = ${labId} AND user_id = ${userId}
    `;
}

export async function getMember(
    db: SQL,
    labId: number,
    userId: number,
): Promise<LabMemberRow | null> {
    const rows: LabMemberRow[] = await db`
        SELECT lab_id, user_id, joined_at
          FROM lab.members
         WHERE lab_id = ${labId} AND user_id = ${userId}
    `;
    const [row] = rows;
    return row ?? null;
}

export async function listMembers(db: SQL, labId: number): Promise<LabMemberRow[]> {
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
    userId: number,
): Promise<LabRoleRow[]> {
    const rows: LabRoleRow[] = await db`
        SELECT r.id, r.lab_id, r.name, r.permissions, r.rank, r.color, r.created_at
          FROM lab.member_roles mr
          JOIN lab.roles r ON mr.role_id = r.id
         WHERE mr.lab_id = ${labId} AND mr.user_id = ${userId}
         ORDER BY r.rank DESC, r.id ASC
    `;
    return rows;
}

/**
 * Get all members for a lab with their roles and public user info in a single query.
 * Avoids N+1 queries when listing members.
 */
export async function getLabMembersWithDetails(
    db: SQL,
    labId: number,
): Promise<{ member: LabMemberRow; user: { id: number; name: string; email: string; avatar_url: string | null; created_at: Date }; roles: LabRoleRow[] }[]> {
    // Get all members with user info
    const memberUsers = await db`
        SELECT m.lab_id, m.user_id, m.joined_at,
               u.id AS u_id, u.name AS u_name, u.email AS u_email, u.avatar_url AS u_avatar_url, u.created_at AS u_created_at
          FROM lab.members m
          JOIN auth.users u ON u.id = m.user_id
         WHERE m.lab_id = ${labId}
    `;

    // Get all member roles in one query
    const allRoles = await db`
        SELECT mr.user_id, r.id, r.lab_id, r.name, r.permissions, r.rank, r.color, r.created_at
          FROM lab.member_roles mr
          JOIN lab.roles r ON mr.role_id = r.id
         WHERE mr.lab_id = ${labId}
         ORDER BY r.rank DESC, r.id ASC
    `;

    // Group roles by user_id
    const rolesByUser = new Map<number, LabRoleRow[]>();
    for (const r of allRoles as any[]) {
        const userId = Number(r.user_id);
        if (!rolesByUser.has(userId)) {
            rolesByUser.set(userId, []);
        }
        rolesByUser.get(userId)!.push({
            id: r.id,
            lab_id: r.lab_id,
            name: r.name,
            permissions: r.permissions,
            rank: r.rank,
            color: r.color,
            created_at: r.created_at,
        });
    }

    return (memberUsers as any[]).map((row) => ({
        member: {
            lab_id: row.lab_id,
            user_id: row.user_id,
            joined_at: row.joined_at,
        },
        user: {
            id: row.u_id,
            name: row.u_name,
            email: row.u_email,
            avatar_url: row.u_avatar_url,
            created_at: row.u_created_at,
        },
        roles: rolesByUser.get(Number(row.user_id)) || [],
    }));
}
