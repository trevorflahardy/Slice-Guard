import { expect, test } from 'bun:test';
import { LabPermission } from '@shared/db/lab';
import { getMemberRolePermissions } from '../src/db/lab/permissions';
import { hasLabPermission } from '../src/utils/permissions';

function createMockSQL(results: any[] = []) {
    const fn: any = (strings: TemplateStringsArray, ...values: any[]) => {
        const query = strings.reduce(
            (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''),
            '',
        );
        fn.queries.push(query);
        fn.params.push(values);
        const res = results.length ? results.shift() : [];
        return Promise.resolve(res);
    };
    fn.queries = [] as string[];
    fn.params = [] as any[][];
    fn.begin = async (cb: (tx: any) => Promise<any>) => {
        return cb(fn);
    };
    return fn;
}

function normalize(sql: string | null) {
    return sql ? sql.replace(/\s+/g, ' ').trim() : '';
}

// ── getMemberRolePermissions ───────────────────────────────────────────

test('getMemberRolePermissions returns ALL for owner', async () => {
    const db = createMockSQL([
        [{ owner_id: 42 }], // SELECT owner_id
    ]);

    const result = await getMemberRolePermissions(db as any, 1, 42);

    expect(result).toBe(LabPermission.ALL);
    // Should only run the owner check query, not the roles query
    expect(db.queries).toHaveLength(1);
    expect(normalize(db.queries[0])).toContain('SELECT owner_id FROM lab.labs WHERE id = $1');
    expect(db.params[0]).toEqual([1]);
});

test('getMemberRolePermissions returns null for non-existent lab', async () => {
    const db = createMockSQL([
        [], // no owner row found
    ]);

    const result = await getMemberRolePermissions(db as any, 999, 42);

    expect(result).toBeNull();
    expect(db.queries).toHaveLength(1);
});

test('getMemberRolePermissions returns null for non-member', async () => {
    const db = createMockSQL([
        [{ owner_id: 1 }], // owner is someone else
        [],                 // no roles for this user
    ]);

    const result = await getMemberRolePermissions(db as any, 1, 99);

    expect(result).toBeNull();
    expect(db.queries).toHaveLength(2);
});

test('getMemberRolePermissions returns permissions for single role', async () => {
    const perms = LabPermission.READ | LabPermission.WRITE;
    const db = createMockSQL([
        [{ owner_id: 1 }],       // owner is someone else
        [{ permissions: perms }], // single role
    ]);

    const result = await getMemberRolePermissions(db as any, 1, 42);

    expect(result).toBe(perms);
    expect(db.queries).toHaveLength(2);
    expect(normalize(db.queries[1])).toContain('FROM lab.member_roles mr');
    expect(normalize(db.queries[1])).toContain('JOIN lab.roles r ON mr.role_id = r.id');
    expect(db.params[1]).toEqual([1, 42]);
});

test('getMemberRolePermissions aggregates multiple roles with OR', async () => {
    const db = createMockSQL([
        [{ owner_id: 1 }],
        [
            { permissions: LabPermission.READ },
            { permissions: LabPermission.WRITE },
            { permissions: LabPermission.MANAGE_ROLES },
        ],
    ]);

    const result = await getMemberRolePermissions(db as any, 1, 42);

    const expected = LabPermission.READ | LabPermission.WRITE | LabPermission.MANAGE_ROLES;
    expect(result).toBe(expected);
});

// ── hasLabPermission ───────────────────────────────────────────────────

test('hasLabPermission returns false for null permissions', () => {
    expect(hasLabPermission(null, LabPermission.READ)).toBe(false);
});

test('hasLabPermission returns false for zero permissions', () => {
    expect(hasLabPermission(0, LabPermission.READ)).toBe(false);
});

test('hasLabPermission returns true when ALL flag is set', () => {
    expect(hasLabPermission(LabPermission.ALL, LabPermission.READ)).toBe(true);
    expect(hasLabPermission(LabPermission.ALL, LabPermission.MANAGE_ROLES)).toBe(true);
    expect(hasLabPermission(LabPermission.ALL, LabPermission.DELETE_LAB)).toBe(true);
});

test('hasLabPermission returns true for matching specific permission', () => {
    const perms = LabPermission.READ | LabPermission.WRITE;
    expect(hasLabPermission(perms, LabPermission.READ)).toBe(true);
    expect(hasLabPermission(perms, LabPermission.WRITE)).toBe(true);
});

test('hasLabPermission returns false for non-matching permission', () => {
    const perms = LabPermission.READ | LabPermission.WRITE;
    expect(hasLabPermission(perms, LabPermission.DELETE_LAB)).toBe(false);
    expect(hasLabPermission(perms, LabPermission.MANAGE_ROLES)).toBe(false);
});
