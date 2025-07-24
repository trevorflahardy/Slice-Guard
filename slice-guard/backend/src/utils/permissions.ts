import { LabPermission } from "@shared/db/lab";

export function hasLabPermission(perms: number | null, perm: LabPermission): boolean {
    if (perms === null) return false;
    return (perms & LabPermission.ALL) !== 0 || (perms & perm) !== 0;
}

