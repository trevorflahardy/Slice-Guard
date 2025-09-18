import { LabPermission, type LabMember } from '@shared/db/lab';

export function hasLabPermission(perms: number | null, perm: LabPermission): boolean {
    if (perms === null) {
        return false;
    }
    return (Number(perms) & LabPermission.ALL) !== 0 || (Number(perms) & perm) !== 0;
}

export function computeMemberPermissions(member: LabMember | null): number | null {
    if (!member) {
        return null;
    }
    const roles = [...member.roles].sort((a, b) => b.rank - a.rank || a.id - b.id);
    if (roles.length === 0) {
        return null;
    }

    let mask = Number(roles[0].permissions);
    for (let i = 1; i < roles.length; i += 1) {
        mask |= Number(roles[i].permissions);
    }
    return mask;
}
