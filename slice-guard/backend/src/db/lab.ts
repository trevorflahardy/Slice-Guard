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
    const [row] = await db.query<LabRow>(
        `INSERT INTO lab.labs (owner_id, name, description, image_url)
           VALUES ($1, $2, $3, $4)
        RETURNING id, owner_id, name, description, image_url, created_at`,
        [ownerId, name, description, imageUrl]
    );
    return row;
}

export async function deleteLab(db: SQL, labId: number): Promise<void> {
    await db.run(`DELETE FROM lab.labs WHERE id = $1`, [labId]);
}

export async function updateLab(
    db: SQL,
    labId: number,
    name: string,
    description: string | null,
    imageUrl: string | null
): Promise<LabRow> {
    const [row] = await db.query<LabRow>(
        `UPDATE lab.labs
            SET name = $2, description = $3, image_url = $4
          WHERE id = $1
        RETURNING id, owner_id, name, description, image_url, created_at`,
        [labId, name, description, imageUrl]
    );
    return row;
}

export async function createRole(
    db: SQL,
    labId: number,
    name: string,
    permissions: number
): Promise<LabRoleRow> {
    const [row] = await db.query<LabRoleRow>(
        `INSERT INTO lab.roles (lab_id, name, permissions)
           VALUES ($1, $2, $3)
        RETURNING id, lab_id, name, permissions, created_at`,
        [labId, name, permissions]
    );
    return row;
}

export async function addMember(
    db: SQL,
    labId: number,
    userId: number,
    roleId: number | null
): Promise<LabMemberRow> {
    const [row] = await db.query<LabMemberRow>(
        `INSERT INTO lab.members (lab_id, user_id, role_id)
           VALUES ($1, $2, $3)
        RETURNING lab_id, user_id, role_id, joined_at`,
        [labId, userId, roleId]
    );
    return row;
}

export async function removeMember(
    db: SQL,
    labId: number,
    userId: number
): Promise<void> {
    await db.run(`DELETE FROM lab.members WHERE lab_id = $1 AND user_id = $2`, [labId, userId]);
}

export async function getMemberRolePermissions(
    db: SQL,
    labId: number,
    userId: number
): Promise<number | null> {
    const [row] = await db.query<{ permissions: number }>(
        `SELECT r.permissions
           FROM lab.members m
           JOIN lab.roles r ON m.role_id = r.id
          WHERE m.lab_id = $1 AND m.user_id = $2`,
        [labId, userId]
    );
    return row ? row.permissions : null;
}
