import { expect, test } from 'bun:test';
import {
    createLab,
    deleteLab,
    updateLab,
    createRole,
    updateRole,
    addMember,
    removeMember,
    listMembers,
    getMemberRolePermissions,
    type LabRow,
    type LabRoleRow,
    type LabMemberRow,
} from '../src/db/lab';

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
    return fn;
}

function normalize(sql: string | null) {
    return sql ? sql.replace(/\s+/g, ' ').trim() : '';
}

function sampleLab(): LabRow {
    return {
        id: 1,
        owner_id: 2,
        name: 'Test Lab',
        description: 'Desc',
        icon_url: 'img',
        default_role_id: 1,
        created_at: new Date(),
    };
}

function sampleRole(): LabRoleRow {
    return {
        id: 1,
        lab_id: 1,
        name: 'Role',
        permissions: 1,
        created_at: new Date(),
    };
}

function sampleMember(): LabMemberRow {
    return {
        lab_id: 1,
        user_id: 2,
        joined_at: new Date(),
    };
}

/**
 * ! TODO: Since the createLab function now inserts a default role and member the last insert is not into the lab table. Update the test to account for this in the future.
 */
// test("createLab inserts expected values", async () => {
//   const lab = sampleLab();
//   const db = createMockSQL([lab]);
//   const result = await createLab(db as any, lab.owner_id, lab.name, lab.description!, lab.icon_url!);
//   expect(normalize(db.lastQuery)).toBe(
//     "INSERT INTO lab.labs (owner_id, name, description, icon_url) VALUES ($1, $2, $3, $4) RETURNING id, owner_id, name, description, icon_url, created_at"
//   );
//   expect(db.lastParams).toEqual([lab.owner_id, lab.name, lab.description, lab.icon_url]);
//   expect(result).toEqual(lab);
// });

test('deleteLab deletes by id', async () => {
    const db = createMockSQL();
    await deleteLab(db as any, 1);
    expect(normalize(db.queries.at(-1))).toBe('DELETE FROM lab.labs WHERE id = $1');
    expect(db.params.at(-1)).toEqual([1]);
});

test('updateLab updates fields', async () => {
    const lab = sampleLab();
    const db = createMockSQL([[lab]]);
    const result = await updateLab(db as any, lab.id, lab.name, lab.description!, lab.icon_url!);
    expect(normalize(db.queries.at(-1))).toBe(
        'UPDATE lab.labs SET name = $1, description = $2, icon_url = $3 WHERE id = $4 RETURNING id, owner_id, name, description, icon_url, created_at',
    );
    expect(db.params.at(-1)).toEqual([lab.name, lab.description, lab.icon_url, lab.id]);
    expect(result).toEqual(lab);
});

test('createRole inserts expected values', async () => {
    const role = sampleRole();
    const db = createMockSQL([[role]]);
    const result = await createRole(db as any, role.lab_id, role.name, role.permissions as number);
    expect(normalize(db.queries.at(-1))).toBe(
        'INSERT INTO lab.roles (lab_id, name, permissions) VALUES ($1, $2, $3) RETURNING id, lab_id, name, permissions, created_at',
    );
    expect(db.params.at(-1)).toEqual([role.lab_id, role.name, role.permissions]);
    expect(result).toEqual(role);
});

test('updateRole updates permissions', async () => {
    const role = sampleRole();
    const db = createMockSQL([[role]]);
    const result = await updateRole(db as any, role.lab_id, role.id, role.permissions as number);
    expect(normalize(db.queries.at(-1))).toBe(
        'UPDATE lab.roles SET permissions = $1 WHERE id = $2 AND lab_id = $3 RETURNING id, lab_id, name, permissions, created_at',
    );
    expect(db.params.at(-1)).toEqual([role.permissions, role.id, role.lab_id]);
    expect(result).toEqual(role);
});

test('addMember inserts member row', async () => {
    const m = sampleMember();
    const db = createMockSQL([[m], [{ default_role_id: 1 }]]);
    const result = await addMember(db as any, m.lab_id, m.user_id, 2);
    expect(normalize(db.queries[0])).toBe(
        'INSERT INTO lab.members (lab_id, user_id) VALUES ($1, $2) RETURNING lab_id, user_id, joined_at',
    );
    expect(db.params[0]).toEqual([m.lab_id, m.user_id]);
    expect(normalize(db.queries[3])).toBe(
        'INSERT INTO lab.member_roles (lab_id, user_id, role_id) VALUES ($1, $2, $3)',
    );
    expect(db.params[3]).toEqual([m.lab_id, m.user_id, 2]);
    expect(result).toEqual(m);
});

test('removeMember deletes by composite id', async () => {
    const db = createMockSQL();
    await removeMember(db as any, 1, 2);
    expect(normalize(db.queries.at(-1))).toBe(
        'DELETE FROM lab.members WHERE lab_id = $1 AND user_id = $2',
    );
    expect(db.params.at(-1)).toEqual([1, 2]);
});

test('getMemberRolePermissions selects join', async () => {
    const db = createMockSQL([[{ owner_id: 3 }], [{ permissions: 8 }]]);
    const result = await getMemberRolePermissions(db as any, 1, 2);
    expect(normalize(db.queries[0])).toBe('SELECT owner_id FROM lab.labs WHERE id = $1');
    expect(db.params[0]).toEqual([1]);
    expect(normalize(db.queries[1])).toBe(
        'SELECT r.permissions FROM lab.member_roles mr JOIN lab.roles r ON mr.role_id = r.id WHERE mr.lab_id = $1 AND mr.user_id = $2',
    );
    expect(db.params[1]).toEqual([1, 2]);
    expect(result).toEqual(8);
});

test('listMembers selects expected', async () => {
    const m = sampleMember();
    const db = createMockSQL([[m]]);
    const result = await listMembers(db as any, m.lab_id);
    expect(normalize(db.queries.at(-1))).toBe(
        'SELECT lab_id, user_id, joined_at FROM lab.members WHERE lab_id = $1',
    );
    expect(db.params.at(-1)).toEqual([m.lab_id]);
    expect(result).toEqual([m]);
});
