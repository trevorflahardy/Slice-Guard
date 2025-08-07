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
    `;
  if (rows.length === 0) {
    return null;
  }

  return rows.reduce((acc, r) => acc | Number(r.permissions), 0);
}
