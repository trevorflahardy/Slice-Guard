import { expect, test } from 'bun:test';
import {
    createInvite,
    listInvites,
    updateInvite,
    deleteInvite,
    getInviteByCode,
    addInviteUse,
    type LabInviteRow,
} from '../src/db/lab/invite';

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

function sampleInvite(): LabInviteRow {
    return {
        id: 1,
        lab_id: 10,
        code: 'abc123',
        max_uses: 5,
        uses: 0,
        expires_at: new Date('2026-12-31'),
        created_at: new Date('2026-01-01'),
    };
}

// ── createInvite ───────────────────────────────────────────────────────

test('createInvite inserts with correct SQL and params', async () => {
    const invite = sampleInvite();
    const db = createMockSQL([[invite]]);
    const result = await createInvite(db as any, 10, 'abc123', 5, new Date('2026-12-31'));

    expect(normalize(db.queries.at(-1))).toBe(
        normalize(
            'INSERT INTO lab.invites (lab_id, code, max_uses, expires_at) VALUES ($1, $2, $3, $4) RETURNING id, lab_id, code, max_uses, uses, expires_at, created_at',
        ),
    );
    expect(db.params.at(-1)).toEqual([10, 'abc123', 5, new Date('2026-12-31')]);
    expect(result).toEqual(invite);
});

test('createInvite accepts null max_uses and expires_at', async () => {
    const invite = { ...sampleInvite(), max_uses: null, expires_at: null };
    const db = createMockSQL([[invite]]);
    const result = await createInvite(db as any, 10, 'abc123', null, null);

    expect(db.params.at(-1)).toEqual([10, 'abc123', null, null]);
    expect(result).toEqual(invite);
});

// ── listInvites ────────────────────────────────────────────────────────

test('listInvites queries by lab_id', async () => {
    const invite = sampleInvite();
    const db = createMockSQL([[invite]]);
    const result = await listInvites(db as any, 10);

    expect(normalize(db.queries.at(-1))).toBe(
        normalize(
            'SELECT id, lab_id, code, max_uses, uses, expires_at, created_at FROM lab.invites WHERE lab_id = $1 ORDER BY id DESC',
        ),
    );
    expect(db.params.at(-1)).toEqual([10]);
    expect(result).toEqual([invite]);
});

// ── updateInvite ───────────────────────────────────────────────────────

test('updateInvite updates max_uses and expires_at', async () => {
    const invite = { ...sampleInvite(), max_uses: 20 };
    const db = createMockSQL([[invite]]);
    const result = await updateInvite(db as any, 1, 10, 20, new Date('2026-12-31'));

    expect(normalize(db.queries.at(-1))).toBe(
        normalize(
            'UPDATE lab.invites SET max_uses = $1, expires_at = $2 WHERE id = $3 AND lab_id = $4 RETURNING id, lab_id, code, max_uses, uses, expires_at, created_at',
        ),
    );
    expect(db.params.at(-1)).toEqual([20, new Date('2026-12-31'), 1, 10]);
    expect(result).toEqual(invite);
});

// ── deleteInvite ───────────────────────────────────────────────────────

test('deleteInvite removes by id and lab_id', async () => {
    const db = createMockSQL();
    await deleteInvite(db as any, 1, 10);

    expect(normalize(db.queries.at(-1))).toBe(
        'DELETE FROM lab.invites WHERE id = $1 AND lab_id = $2',
    );
    expect(db.params.at(-1)).toEqual([1, 10]);
});

// ── getInviteByCode ────────────────────────────────────────────────────

test('getInviteByCode returns invite when found', async () => {
    const invite = sampleInvite();
    const db = createMockSQL([[invite]]);
    const result = await getInviteByCode(db as any, 'abc123');

    expect(normalize(db.queries.at(-1))).toBe(
        normalize(
            'SELECT id, lab_id, code, max_uses, uses, expires_at, created_at FROM lab.invites WHERE code = $1',
        ),
    );
    expect(db.params.at(-1)).toEqual(['abc123']);
    expect(result).toEqual(invite);
});

test('getInviteByCode returns null when not found', async () => {
    const db = createMockSQL([[]]);
    const result = await getInviteByCode(db as any, 'nonexistent');

    expect(result).toBeNull();
});

// ── addInviteUse ───────────────────────────────────────────────────────

test('addInviteUse runs both queries inside a transaction', async () => {
    const db = createMockSQL();
    await addInviteUse(db as any, 1, 42);

    // The mock .begin passes itself as tx, so both queries are recorded
    expect(db.queries.length).toBe(2);

    expect(normalize(db.queries[0])).toBe(
        normalize(
            'INSERT INTO lab.invite_uses (invite_id, user_id) VALUES ($1, $2)',
        ),
    );
    expect(db.params[0]).toEqual([1, 42]);

    expect(normalize(db.queries[1])).toBe(
        normalize(
            'UPDATE lab.invites SET uses = uses + 1 WHERE id = $1',
        ),
    );
    expect(db.params[1]).toEqual([1]);
});
