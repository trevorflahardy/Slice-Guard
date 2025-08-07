import { LabPermission, type LabMember } from '@shared/db/lab';

export function hasLabPermission(perms: number | null, perm: LabPermission): boolean {
  if (perms == null) {
    return false;
  }
  return (Number(perms) & LabPermission.ALL) !== 0 || (Number(perms) & perm) !== 0;
}

export function computeMemberPermissions(member: LabMember | null): number | null {
  if (!member) {
    return null;
  }
  return member.roles.reduce((acc, r) => acc | Number(r.permissions), 0);
}
