import { LabPermission } from '@shared/db/lab';
import type { SQL } from 'bun';

export async function getMemberRolePermissions(
    db: SQL,
    labId: number,
    userId: number,
): Promise<number | null> {
    const owners: { owner_id: number }[] = await db`
        SELECT owner_id FROM lab.labs WHERE id = ${labId}
    `;
    if (!owners[0]) {
        return null;
    }

    if (Number(owners[0].owner_id) === userId) {
        return LabPermission.ALL;
    }

    const rows: { permissions: number }[] = await db`
        SELECT r.permissions
          FROM lab.member_roles mr
          JOIN lab.roles r ON mr.role_id = r.id
         WHERE mr.lab_id = ${labId} AND mr.user_id = ${userId}
         ORDER BY r.rank DESC, r.id ASC
    `;
    if (rows.length === 0) {
        return null;
    }

    // Aggregate permissions from all assigned roles while keeping the
    // highest-ranked role as the baseline.
    let mask = Number(rows[0].permissions);
    for (let i = 1; i < rows.length; i += 1) {
        mask |= Number(rows[i].permissions);
    }
    return mask;
}
