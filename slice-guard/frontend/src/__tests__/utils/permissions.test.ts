import { describe, it, expect } from 'vitest';
import { hasLabPermission, computeMemberPermissions } from '../../utils/permissions';
import { LabPermission, type LabMember, type LabRole } from '@shared/db/lab';

function makeRole(overrides: Partial<LabRole> & { permissions: number; rank: number; id: number }): LabRole {
    return {
        lab_id: 1,
        name: 'role',
        color: null,
        created_at: new Date(),
        ...overrides,
    } as LabRole;
}

function makeMember(roles: LabRole[]): LabMember {
    return {
        lab_id: 1,
        user_id: 1,
        roles,
        joined_at: new Date(),
    };
}

describe('hasLabPermission', () => {
    it('returns false when perms is null', () => {
        expect(hasLabPermission(null, LabPermission.READ)).toBe(false);
    });

    it('returns true when the specific permission bit is set', () => {
        expect(hasLabPermission(LabPermission.READ, LabPermission.READ)).toBe(true);
    });

    it('returns false when a different permission bit is set', () => {
        expect(hasLabPermission(LabPermission.WRITE, LabPermission.READ)).toBe(false);
    });

    it('returns true for any permission when ALL flag is set', () => {
        expect(hasLabPermission(LabPermission.ALL, LabPermission.READ)).toBe(true);
        expect(hasLabPermission(LabPermission.ALL, LabPermission.EDIT_LAB)).toBe(true);
        expect(hasLabPermission(LabPermission.ALL, LabPermission.DELETE_LAB)).toBe(true);
        expect(hasLabPermission(LabPermission.ALL, LabPermission.MANAGE_ROLES)).toBe(true);
    });

    it('returns true when multiple permissions are set and one matches', () => {
        const perms = LabPermission.READ | LabPermission.WRITE;
        expect(hasLabPermission(perms, LabPermission.READ)).toBe(true);
        expect(hasLabPermission(perms, LabPermission.WRITE)).toBe(true);
        expect(hasLabPermission(perms, LabPermission.DELETE_LAB)).toBe(false);
    });

    it('returns false when perms is 0', () => {
        expect(hasLabPermission(0, LabPermission.READ)).toBe(false);
    });
});

describe('computeMemberPermissions', () => {
    it('returns null when member is null', () => {
        expect(computeMemberPermissions(null)).toBeNull();
    });

    it('returns null when the member has no roles', () => {
        const member = makeMember([]);
        expect(computeMemberPermissions(member)).toBeNull();
    });

    it('returns the permissions of a single role', () => {
        const role = makeRole({ id: 1, rank: 1, permissions: LabPermission.READ });
        const member = makeMember([role]);
        expect(computeMemberPermissions(member)).toBe(LabPermission.READ);
    });

    it('aggregates permissions from multiple roles with bitwise OR', () => {
        const role1 = makeRole({ id: 1, rank: 2, permissions: LabPermission.READ });
        const role2 = makeRole({ id: 2, rank: 1, permissions: LabPermission.WRITE });
        const member = makeMember([role1, role2]);
        expect(computeMemberPermissions(member)).toBe(LabPermission.READ | LabPermission.WRITE);
    });

    it('sorts roles by rank descending before aggregating', () => {
        const lowRank = makeRole({ id: 1, rank: 1, permissions: LabPermission.EDIT_LAB });
        const highRank = makeRole({ id: 2, rank: 10, permissions: LabPermission.READ });
        // Pass in unsorted order
        const member = makeMember([lowRank, highRank]);
        const result = computeMemberPermissions(member);
        // Both permissions should be present regardless of order
        expect(result).toBe(LabPermission.EDIT_LAB | LabPermission.READ);
    });

    it('handles roles with ALL permission', () => {
        const role = makeRole({ id: 1, rank: 1, permissions: LabPermission.ALL });
        const member = makeMember([role]);
        const result = computeMemberPermissions(member)!;
        expect(hasLabPermission(result, LabPermission.READ)).toBe(true);
        expect(hasLabPermission(result, LabPermission.DELETE_LAB)).toBe(true);
    });
});
