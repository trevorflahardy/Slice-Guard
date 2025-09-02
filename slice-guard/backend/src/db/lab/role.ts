import type { SQL } from 'bun';
import type { LabRoleRow } from '.';

/**
 * Create a role inside of a given lab. Passing role rank of 0 will create a lab default role.
 *
 * NOTE: Will also update the lab default role field when creating a default role using this method.
 *
 *
 * @param db The current database connection
 * @param labId The lab ID to create the role on
 * @param name The new name of the role
 * @param permissions The permissions this new role should have.
 * @param rank The rank of this role, defaults to 1. Set to 0 for @everyone
 * @param color The display color of this role. Null for default
 * @returns The created role.
 */
export async function createRole(
    db: SQL,
    labId: number,
    name: string,
    permissions: number,
    rank: number = 1,
    color: string | null = null,
): Promise<LabRoleRow> {
    const rows: LabRoleRow[] = await db`
        INSERT INTO lab.roles (lab_id, name, permissions, rank, color)
             VALUES (${labId}, ${name}, ${permissions}, ${rank}, ${color})
        RETURNING id, lab_id, name, permissions, rank, color, created_at
        ON CONFLICT (lab_id, rank) DO NOTHING;
    `;

    // If this rank is 0, we should also update the lab to set the default role
    const new_role_id = rows[0].id;
    if (rank === 0) {
        await db`
            UPDATE lab.labs
            SET default_role_id = ${new_role_id}
            WHERE id = ${labId}
        `;
    }
    // if not, however, we need to update the rank of the existing roles
    else {
        await db`
            UPDATE lab.roles
            SET rank = rank + 1
            WHERE lab_id = ${labId} AND rank >= ${rank}
        `;
    }

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
