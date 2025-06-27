import type { Lab, LabRole, LabMember } from "@shared/db/lab";
import type { SQL } from "bun";

export interface LabRow extends Lab { }
export interface LabRoleRow extends LabRole { }
export interface LabMemberRow extends LabMember { }

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
        RETURNING id, owner_id, name, description, image_url, created_at
    `;
    return rows[0];
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
    roleId: number | null
): Promise<LabMemberRow> {
    const rows: LabMemberRow[] = await db`
        INSERT INTO lab.members (lab_id, user_id, role_id)
             VALUES (${labId}, ${userId}, ${roleId})
        RETURNING lab_id, user_id, role_id, joined_at
    `;
    return rows[0];
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

export async function getMemberRolePermissions(
    db: SQL,
    labId: number,
    userId: number
): Promise<number | null> {
    const rows: { permissions: number }[] = await db`
        SELECT r.permissions
          FROM lab.members m
          JOIN lab.roles r ON m.role_id = r.id
         WHERE m.lab_id = ${labId} AND m.user_id = ${userId}
    `;
    const [row] = rows;
    return row ? row.permissions : null;
}

export async function getLab(db: SQL, id: number): Promise<LabRow | null> {
    const rows: LabRow[] = await db`
        SELECT id, owner_id, name, description, image_url, created_at
          FROM lab.labs
         WHERE id = ${id}
    `;
    return rows[0] ?? null;
}

export async function listLabsForUser(db: SQL, userId: number): Promise<LabRow[]> {
    const rows: LabRow[] = await db`
        SELECT l.id, l.owner_id, l.name, l.description, l.image_url, l.created_at
          FROM lab.labs l
          JOIN lab.members m ON m.lab_id = l.id
         WHERE m.user_id = ${userId}
    `;
    return rows;
}
