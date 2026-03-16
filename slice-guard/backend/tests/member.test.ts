import { expect, test } from 'bun:test';
import {
    addMember,
    removeMember,
    getMember,
    listMembers,
    getMemberRoles,
    getLabMembersWithDetails,
    type LabMemberRow,
} from '../src/db/lab/member';

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

function sampleMember(): LabMemberRow {
    return { lab_id: 1, user_id: 42, joined_at: new Date('2025-01-01') };
}

// ── addMember ──────────────────────────────────────────────────────────

test('addMember with no extra role executes 3 queries', async () => {
    const member = sampleMember();
    const db = createMockSQL([
        [member],                   // INSERT member
        [{ default_role_id: 10 }],  // SELECT default_role_id
        [],                         // INSERT default role
    ]);

    const result = await addMember(db as any, 1, 42);

    expect(result).toEqual(member);
    expect(db.queries).toHaveLength(3);
    expect(normalize(db.queries[0])).toContain('INSERT INTO lab.members');
    expect(db.params[0]).toEqual([1, 42]);
    expect(normalize(db.queries[1])).toContain('SELECT default_role_id FROM lab.labs WHERE id = $1');
    expect(db.params[1]).toEqual([1]);
    expect(normalize(db.queries[2])).toContain('INSERT INTO lab.member_roles');
    expect(db.params[2]).toEqual([1, 42, 10]);
});

test('addMember with extra role different from default executes 4 queries', async () => {
    const member = sampleMember();
    const db = createMockSQL([
        [member],                   // INSERT member
        [{ default_role_id: 10 }],  // SELECT default_role_id
        [],                         // INSERT default role
        [],                         // INSERT extra role
    ]);

    const result = await addMember(db as any, 1, 42, 20);

    expect(result).toEqual(member);
    expect(db.queries).toHaveLength(4);
    expect(normalize(db.queries[2])).toContain('INSERT INTO lab.member_roles');
    expect(db.params[2]).toEqual([1, 42, 10]);
    expect(normalize(db.queries[3])).toContain('INSERT INTO lab.member_roles');
    expect(db.params[3]).toEqual([1, 42, 20]);
});

test('addMember with extra role same as default executes only 3 queries', async () => {
    const member = sampleMember();
    const db = createMockSQL([
        [member],                   // INSERT member
        [{ default_role_id: 10 }],  // SELECT default_role_id
        [],                         // INSERT default role
    ]);

    const result = await addMember(db as any, 1, 42, 10);

    expect(result).toEqual(member);
    expect(db.queries).toHaveLength(3);
});

// ── removeMember ───────────────────────────────────────────────────────

test('removeMember uses expected SQL', async () => {
    const db = createMockSQL();
    await removeMember(db as any, 1, 42);

    expect(db.queries).toHaveLength(1);
    expect(normalize(db.queries[0])).toBe(
        'DELETE FROM lab.members WHERE lab_id = $1 AND user_id = $2',
    );
    expect(db.params[0]).toEqual([1, 42]);
});

// ── getMember ──────────────────────────────────────────────────────────

test('getMember returns row when found', async () => {
    const member = sampleMember();
    const db = createMockSQL([[member]]);
    const result = await getMember(db as any, 1, 42);

    expect(result).toEqual(member);
    expect(normalize(db.queries[0])).toBe(
        'SELECT lab_id, user_id, joined_at FROM lab.members WHERE lab_id = $1 AND user_id = $2',
    );
    expect(db.params[0]).toEqual([1, 42]);
});

test('getMember returns null when not found', async () => {
    const db = createMockSQL([[]]);
    const result = await getMember(db as any, 1, 99);

    expect(result).toBeNull();
});

// ── listMembers ────────────────────────────────────────────────────────

test('listMembers uses expected SQL', async () => {
    const members = [sampleMember()];
    const db = createMockSQL([members]);
    const result = await listMembers(db as any, 1);

    expect(result).toEqual(members);
    expect(normalize(db.queries[0])).toBe(
        'SELECT lab_id, user_id, joined_at FROM lab.members WHERE lab_id = $1',
    );
    expect(db.params[0]).toEqual([1]);
});

// ── getMemberRoles ─────────────────────────────────────────────────────

test('getMemberRoles uses JOIN query', async () => {
    const roles = [
        { id: 10, lab_id: 1, name: 'Admin', permissions: 3, rank: 100, color: '#fff', created_at: new Date() },
    ];
    const db = createMockSQL([roles]);
    const result = await getMemberRoles(db as any, 1, 42);

    expect(result).toEqual(roles);
    expect(normalize(db.queries[0])).toBe(
        'SELECT r.id, r.lab_id, r.name, r.permissions, r.rank, r.color, r.created_at FROM lab.member_roles mr JOIN lab.roles r ON mr.role_id = r.id WHERE mr.lab_id = $1 AND mr.user_id = $2 ORDER BY r.rank DESC, r.id ASC',
    );
    expect(db.params[0]).toEqual([1, 42]);
});

// ── getLabMembersWithDetails ───────────────────────────────────────────

test('getLabMembersWithDetails executes 2 queries and groups roles', async () => {
    const now = new Date('2025-01-01');
    const memberUsers = [
        { lab_id: 1, user_id: 42, joined_at: now, u_id: 42, u_name: 'Alice', u_email: 'alice@test.com', u_avatar_url: null, u_created_at: now },
        { lab_id: 1, user_id: 43, joined_at: now, u_id: 43, u_name: 'Bob', u_email: 'bob@test.com', u_avatar_url: 'http://img', u_created_at: now },
    ];
    const allRoles = [
        { user_id: 42, id: 10, lab_id: 1, name: 'Admin', permissions: 3, rank: 100, color: '#fff', created_at: now },
        { user_id: 42, id: 11, lab_id: 1, name: 'Editor', permissions: 1, rank: 50, color: '#aaa', created_at: now },
        { user_id: 43, id: 10, lab_id: 1, name: 'Admin', permissions: 3, rank: 100, color: '#fff', created_at: now },
    ];

    const db = createMockSQL([memberUsers, allRoles]);
    const result = await getLabMembersWithDetails(db as any, 1);

    expect(db.queries).toHaveLength(2);
    expect(normalize(db.queries[0])).toContain('FROM lab.members m');
    expect(normalize(db.queries[0])).toContain('JOIN auth.users u ON u.id = m.user_id');
    expect(normalize(db.queries[1])).toContain('FROM lab.member_roles mr');
    expect(normalize(db.queries[1])).toContain('JOIN lab.roles r ON mr.role_id = r.id');

    expect(result).toHaveLength(2);

    // First member: Alice with 2 roles
    expect(result[0].member).toEqual({ lab_id: 1, user_id: 42, joined_at: now });
    expect(result[0].user).toEqual({ id: 42, name: 'Alice', email: 'alice@test.com', avatar_url: null, created_at: now });
    expect(result[0].roles).toHaveLength(2);
    expect(result[0].roles[0].name).toBe('Admin');
    expect(result[0].roles[1].name).toBe('Editor');

    // Second member: Bob with 1 role
    expect(result[1].member).toEqual({ lab_id: 1, user_id: 43, joined_at: now });
    expect(result[1].user).toEqual({ id: 43, name: 'Bob', email: 'bob@test.com', avatar_url: 'http://img', created_at: now });
    expect(result[1].roles).toHaveLength(1);
});

test('getLabMembersWithDetails returns empty roles for member with no roles', async () => {
    const now = new Date('2025-01-01');
    const memberUsers = [
        { lab_id: 1, user_id: 42, joined_at: now, u_id: 42, u_name: 'Alice', u_email: 'alice@test.com', u_avatar_url: null, u_created_at: now },
    ];

    const db = createMockSQL([memberUsers, []]);
    const result = await getLabMembersWithDetails(db as any, 1);

    expect(result).toHaveLength(1);
    expect(result[0].roles).toEqual([]);
});
