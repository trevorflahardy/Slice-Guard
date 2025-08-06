import { type Lab, type LabRole, LabPermission } from "@shared/db/lab";
import type { SQL } from "bun";
import { addMember } from "./member";
import { createRole } from "./role";

export interface LabRow extends Lab { }
export interface LabRoleRow extends LabRole { }

export * from "./member";
export * from "./permissions";
export * from "./role";
export * from "./invite";

/**
 * Creates a new lab.
 *
 * @param db The database connection.
 * @param ownerId The ID of the user creating the lab.
 * @param name The name of the lab.
 * @param description An optional description of the lab.
 * @param imageUrl An optional image URL for the lab.
 * @returns The created lab.
 */
export async function createLab(
    db: SQL,
    ownerId: number,
    name: string,
    description: string | null = null,
    imageUrl: string | null = null
): Promise<LabRow> {
    const rows: LabRow[] = await db`
        INSERT INTO lab.labs (owner_id, name, description, image_url)
             VALUES (${ownerId}, ${name}, ${description}, ${imageUrl})
        RETURNING id, owner_id, name, description, image_url, default_role_id, created_at
    `;
    const lab: LabRow = rows[0];

    // Create a default role for every member, @everyone
    const role = await createRole(
        db,
        lab.id,
        "everyone",
        LabPermission.READ | LabPermission.WRITE
    );
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

/**
 * Deletes a lab.
 *
 * @param db The database connection.
 * @param labId The ID of the lab to delete.
 */
export async function deleteLab(db: SQL, labId: number): Promise<void> {
    await db`
        DELETE FROM lab.labs
         WHERE id = ${labId}
    `;
}

/**
 * Updates a lab.
 *
 * @param db The database connection.
 * @param labId The ID of the lab to update.
 * @param name The new name of the lab.
 * @param description The new description of the lab.
 * @param imageUrl The new image URL of the lab.
 * @returns The updated lab.
 */
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

export async function getLab(db: SQL, id: number): Promise<LabRow | null> {
    const rows: LabRow[] = await db`
        SELECT id, owner_id, name, description, image_url, default_role_id, created_at
          FROM lab.labs
         WHERE id = ${id}
    `;
    return rows[0] ?? null;
}

export async function listLabsForUser(
    db: SQL,
    userId: number
): Promise<LabRow[]> {
    const rows: LabRow[] = await db`
        SELECT l.id, l.owner_id, l.name, l.description, l.image_url, l.default_role_id, l.created_at
          FROM lab.labs l
          JOIN lab.members m ON m.lab_id = l.id
         WHERE m.user_id = ${userId}
    `;
    return rows;
}
