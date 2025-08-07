import type { SQL } from 'bun';
import type { LabRoleRow } from '.';

export async function createRole(
    db: SQL,
    labId: number,
    name: string,
    permissions: number,
    rank: number = 0,
): Promise<LabRoleRow> {
    const rows: LabRoleRow[] = await db`
        INSERT INTO lab.roles (lab_id, name, permissions, rank)
             VALUES (${labId}, ${name}, ${permissions}, ${rank})
        RETURNING id, lab_id, name, permissions, rank, created_at
    `;
    return rows[0];
}

export async function updateRole(
    db: SQL,
    labId: number,
    roleId: number,
    permissions: number,
    rank?: number,
): Promise<LabRoleRow> {
    const rows: LabRoleRow[] = await db`
        UPDATE lab.roles
           SET permissions = ${permissions},
               rank = COALESCE(${rank}, rank)
         WHERE id = ${roleId} AND lab_id = ${labId}
        RETURNING id, lab_id, name, permissions, rank, created_at
    `;
    return rows[0];
}
