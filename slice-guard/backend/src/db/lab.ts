import { type Lab, type LabRole, type LabMember, LabPermission } from "@shared/db/lab";
import type { SQL } from "bun";

export interface LabRow extends Lab { }
export interface LabRoleRow extends LabRole { }
// Database representation of a lab member row
export interface LabMemberRow {
    lab_id: number;
    user_id: number;
    joined_at: Date;
}

export interface MemberRoleRow {
    lab_id: number;
    user_id: number;
    role_id: number;
}

export async function createLab(
    db: SQL,
    ownerId: number,
    name: string,
    description: string | null = null,
    imageUrl: string | null = null,
): Promise<LabRow> {
    const rows: LabRow[] = await db`
        INSERT INTO lab.labs (owner_id, name, description, image_url)
             VALUES (${ownerId}, ${name}, ${description}, ${imageUrl})
        RETURNING id, owner_id, name, description, image_url, default_role_id, created_at
    `;
    const lab: LabRow = rows[0];

    // Create a default role for every member, @everyone
    const role = await createRole(db, lab.id, "everyone", LabPermission.READ | LabPermission.WRITE);
    await db`
        UPDATE lab.labs
           SET default_role_id = ${role.id}
         WHERE id = ${lab.id}
    `;
    lab.default_role_id = role.id;

    // Add this owner to the member list with the default role
    await addMember(db, lab.id, ownerId, role.id);
    return lab;
}

export async function deleteLab(db: SQL, labId: number): Promise<void> {
    await db`
        DELETE FROM lab.labs
         WHERE id = ${labId}
    `;
}

export async function updateLab(
    db: SQL,
    labId: number,
    name: string,
    description: string | null,
    imageUrl: string | null
): Promise<LabRow> {
    const rows: LabRow[] = await db`
        UPDATE lab.labs
           SET name = ${name}, description = ${description}, image_url = ${imageUrl}
         WHERE id = ${labId}
        RETURNING id, owner_id, name, description, image_url, created_at
    `;
    return rows[0];
}

export async function createRole(
    db: SQL,
    labId: number,
    name: string,
    permissions: number
): Promise<LabRoleRow> {
    const rows: LabRoleRow[] = await db`
        INSERT INTO lab.roles (lab_id, name, permissions)
             VALUES (${labId}, ${name}, ${permissions})
        RETURNING id, lab_id, name, permissions, created_at
    `;
    return rows[0];
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

export async function getMember(db: SQL, labId: number, userId: number): Promise<LabMemberRow | null> {
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

export async function getMemberRolePermissions(
    db: SQL,
    labId: number,
    userId: number
): Promise<number | null> {
    const owners: { owner_id: number }[] = await db`
        SELECT owner_id FROM lab.labs WHERE id = ${labId}
    `;
    if (!owners[0]) return null;
    if (Number(owners[0].owner_id) === userId) return LabPermission.ALL;
    const rows: { permissions: number }[] = await db`
        SELECT r.permissions
          FROM lab.member_roles mr
          JOIN lab.roles r ON mr.role_id = r.id
         WHERE mr.lab_id = ${labId} AND mr.user_id = ${userId}
    `;
    if (rows.length === 0) return null;
    return rows.reduce((acc, r) => acc | Number(r.permissions), 0);
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

export async function getLab(db: SQL, id: number): Promise<LabRow | null> {
    const rows: LabRow[] = await db`
        SELECT id, owner_id, name, description, image_url, default_role_id, created_at
          FROM lab.labs
         WHERE id = ${id}
    `;
    return rows[0] ?? null;
}

export async function listLabsForUser(db: SQL, userId: number): Promise<LabRow[]> {
    const rows: LabRow[] = await db`
        SELECT l.id, l.owner_id, l.name, l.description, l.image_url, l.default_role_id, l.created_at
          FROM lab.labs l
          JOIN lab.members m ON m.lab_id = l.id
         WHERE m.user_id = ${userId}
    `;
    return rows;
}
