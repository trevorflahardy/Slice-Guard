import type { SQL } from 'bun';
import type { LabInvite } from '@shared/db/lab';

export interface LabInviteRow extends LabInvite {}

export async function createInvite(
  db: SQL,
  labId: number,
  code: string,
  maxUses: number | null,
  expiresAt: Date | null,
): Promise<LabInviteRow> {
  const rows: LabInviteRow[] = await db`
        INSERT INTO lab.invites (lab_id, code, max_uses, expires_at)
             VALUES (${labId}, ${code}, ${maxUses}, ${expiresAt})
        RETURNING id, lab_id, code, max_uses, uses, expires_at, created_at
    `;
  return rows[0];
}

export async function listInvites(db: SQL, labId: number): Promise<LabInviteRow[]> {
  return await db`
        SELECT id, lab_id, code, max_uses, uses, expires_at, created_at
          FROM lab.invites
         WHERE lab_id = ${labId}
         ORDER BY id DESC
    `;
}

export async function updateInvite(
  db: SQL,
  inviteId: number,
  labId: number,
  maxUses: number | null,
  expiresAt: Date | null,
): Promise<LabInviteRow> {
  const rows: LabInviteRow[] = await db`
        UPDATE lab.invites
           SET max_uses = ${maxUses}, expires_at = ${expiresAt}
         WHERE id = ${inviteId} AND lab_id = ${labId}
        RETURNING id, lab_id, code, max_uses, uses, expires_at, created_at
    `;
  return rows[0];
}

export async function deleteInvite(db: SQL, inviteId: number, labId: number): Promise<void> {
  await db`
        DELETE FROM lab.invites
         WHERE id = ${inviteId} AND lab_id = ${labId}
    `;
}

export async function getInviteByCode(db: SQL, code: string): Promise<LabInviteRow | null> {
  const rows: LabInviteRow[] = await db`
        SELECT id, lab_id, code, max_uses, uses, expires_at, created_at
          FROM lab.invites
         WHERE code = ${code}
    `;
  return rows[0] ?? null;
}

export async function addInviteUse(db: SQL, inviteId: number, userId: number): Promise<void> {
  await db`
        INSERT INTO lab.invite_uses (invite_id, user_id)
             VALUES (${inviteId}, ${userId})
    `;
  await db`
        UPDATE lab.invites
           SET uses = uses + 1
         WHERE id = ${inviteId}
    `;
}
