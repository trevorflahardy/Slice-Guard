import type { SQL } from "bun";
import type { LabRoleRow } from ".";

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
