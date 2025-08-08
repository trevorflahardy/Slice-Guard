import type { SQL } from 'bun';
import type { LabRoleRow } from '.';

export async function createRole(
    db: SQL,
    labId: number,
    name: string,
    permissions: number,
    rank: number = 0,
    color: string | null = null,
): Promise<LabRoleRow> {
    const rows: LabRoleRow[] = await db`
        INSERT INTO lab.roles (lab_id, name, permissions, rank, color)
             VALUES (${labId}, ${name}, ${permissions}, ${rank}, ${color})
        RETURNING id, lab_id, name, permissions, rank, color, created_at
    `;
    return rows[0];
}

export async function updateRole(
    db: SQL,
    labId: number,
    roleId: number,
    permissions: number,
    rank?: number,
    name?: string,
    color?: string | null,
): Promise<LabRoleRow> {
    const rows: LabRoleRow[] = await db`
        UPDATE lab.roles
           SET permissions = ${permissions},
               rank = COALESCE(${rank}, rank),
               name = COALESCE(${name}, name),
               color = COALESCE(${color}, color)
         WHERE id = ${roleId} AND lab_id = ${labId}
        RETURNING id, lab_id, name, permissions, rank, color, created_at
    `;
    return rows[0];
}

export async function deleteRole(db: SQL, labId: number, roleId: number): Promise<void> {
    await db`
        DELETE FROM lab.roles
         WHERE id = ${roleId} AND lab_id = ${labId}
    `;
}
