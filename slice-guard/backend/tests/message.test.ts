import { expect, test } from 'bun:test';
import {
    createMessage,
    getMessage,
    listMessages,
    updateMessage,
    deleteMessage,
    type MessageRow,
} from '../src/db/lab/message';

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

function sampleMessage(): MessageRow {
    return {
        id: 10,
        channel_id: 5,
        user_id: 3,
        content: 'Hello world',
        user_mentions: [],
        role_mentions: [],
        created_at: new Date('2025-01-01'),
        edited_at: null,
    };
}

// ── createMessage ──────────────────────────────────────────────────────

test('createMessage inserts with correct SQL and params', async () => {
    const msg = sampleMessage();
    const db = createMockSQL([[msg]]);
    const result = await createMessage(db as any, 5, 3, 'Hello world', [1, 2], [4]);

    expect(normalize(db.queries.at(-1))).toBe(
        normalize(
            'INSERT INTO lab.messages (channel_id, user_id, content, user_mentions, role_mentions) VALUES ($1, $2, $3, $4, $5) RETURNING id, channel_id, user_id, content, array_to_json(user_mentions) as user_mentions, array_to_json(role_mentions) as role_mentions, created_at, edited_at;',
        ),
    );
    expect(db.params.at(-1)).toEqual([5, 3, 'Hello world', '{1,2}', '{4}']);
    expect(result).toEqual(msg);
});

test('createMessage defaults mentions to empty arrays', async () => {
    const msg = sampleMessage();
    const db = createMockSQL([[msg]]);
    await createMessage(db as any, 5, 3, 'Hello world');

    expect(db.params.at(-1)).toEqual([5, 3, 'Hello world', '{}', '{}']);
});

// ── getMessage ─────────────────────────────────────────────────────────

test('getMessage returns message when found', async () => {
    const msg = sampleMessage();
    const db = createMockSQL([[msg]]);
    const result = await getMessage(db as any, 10);

    expect(normalize(db.queries.at(-1))).toBe(
        normalize(
            'SELECT id, channel_id, user_id, content, array_to_json(user_mentions) as user_mentions, array_to_json(role_mentions) as role_mentions, created_at, edited_at FROM lab.messages WHERE id = $1',
        ),
    );
    expect(db.params.at(-1)).toEqual([10]);
    expect(result).toEqual(msg);
});

test('getMessage returns null when not found', async () => {
    const db = createMockSQL([[]]);
    const result = await getMessage(db as any, 999);

    expect(result).toBeNull();
});

// ── listMessages ───────────────────────────────────────────────────────

test('listMessages queries with channel_id and limit', async () => {
    const msg = sampleMessage();
    const db = createMockSQL([[msg]]);
    const result = await listMessages(db as any, 5, 25);

    // The beforeFilter (empty sql``) is interpolated as $2, and limit is $3
    expect(db.params[0][0]).toBe(5); // channelId
    expect(db.params[0].at(-1)).toBe(25); // limit
    expect(result).toEqual([msg]);
});

test('listMessages uses default limit of 50', async () => {
    const db = createMockSQL([[]]);
    await listMessages(db as any, 5);

    expect(db.params[0].at(-1)).toBe(50);
});

test('listMessages reverses rows into chronological order', async () => {
    const newer = { ...sampleMessage(), id: 20, content: 'newer' };
    const older = { ...sampleMessage(), id: 10, content: 'older' };
    const db = createMockSQL([[newer, older]]);
    const result = await listMessages(db as any, 5);

    expect(result[0].id).toBe(10);
    expect(result[1].id).toBe(20);
});

// ── updateMessage ──────────────────────────────────────────────────────

test('updateMessage sets content and mentions', async () => {
    const msg = { ...sampleMessage(), content: 'Updated', edited_at: new Date() };
    const db = createMockSQL([[msg]]);
    const result = await updateMessage(db as any, 10, 'Updated', [7], [8]);

    expect(normalize(db.queries.at(-1))).toBe(
        normalize(
            'UPDATE lab.messages SET content = $1, user_mentions = $2, role_mentions = $3, edited_at = NOW() WHERE id = $4 RETURNING id, channel_id, user_id, content, user_mentions, role_mentions, created_at, edited_at',
        ),
    );
    expect(db.params.at(-1)).toEqual(['Updated', '{7}', '{8}', 10]);
    expect(result).toEqual(msg);
});

test('updateMessage defaults mentions to empty arrays', async () => {
    const msg = sampleMessage();
    const db = createMockSQL([[msg]]);
    await updateMessage(db as any, 10, 'Updated');

    expect(db.params.at(-1)).toEqual(['Updated', '{}', '{}', 10]);
});

// ── deleteMessage ──────────────────────────────────────────────────────

test('deleteMessage removes by id', async () => {
    const db = createMockSQL();
    await deleteMessage(db as any, 10);

    expect(normalize(db.queries.at(-1))).toBe(
        'DELETE FROM lab.messages WHERE id = $1',
    );
    expect(db.params.at(-1)).toEqual([10]);
});
