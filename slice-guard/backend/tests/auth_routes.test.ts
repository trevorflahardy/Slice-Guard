import { expect, test, describe, mock } from 'bun:test';
import { register, login } from '../src/http/auth';

/**
 * Build a mock State whose `db` tagged-template records every query and
 * returns the next element from `dbResults` on each call.
 */
function createMockState(dbResults: any[] = []) {
    const fn: any = (strings: TemplateStringsArray, ...values: any[]) => {
        const query = strings.reduce(
            (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''),
            '',
        );
        fn.queries.push(query);
        fn.params.push(values);
        const res = dbResults.length ? dbResults.shift() : [];
        return Promise.resolve(res);
    };
    fn.queries = [] as string[];
    fn.params = [] as any[][];
    fn.begin = async (cb: (tx: any) => Promise<any>) => cb(fn);

    return {
        db: fn,
        logger: { debug: () => {}, error: () => {}, child: () => ({ debug: () => {}, error: () => {} }) },
        sockets: new Set(),
        broadcast: () => {},
        sendToUser: () => {},
        sendToUsers: () => {},
        sendToLab: () => {},
    };
}

/** Helper to build a POST JSON request. */
function postJson(url: string, body: Record<string, unknown>): Request {
    return new Request(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    });
}

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------
describe('register', () => {
    test('returns 400 when email is missing', async () => {
        const state = createMockState();
        const req = postJson('http://test/api/register', { password: 'longpassword', name: 'Alice' });
        const res = await register(req, state as any);
        expect(res.status).toBe(400);
        expect(await res.text()).toContain('email');
    });

    test('returns 400 when email is invalid', async () => {
        const state = createMockState();
        const req = postJson('http://test/api/register', { email: 'not-an-email', password: 'longpassword', name: 'Alice' });
        const res = await register(req, state as any);
        expect(res.status).toBe(400);
    });

    test('returns 400 when password is too short', async () => {
        const state = createMockState();
        const req = postJson('http://test/api/register', { email: 'a@b.com', password: 'short', name: 'Alice' });
        const res = await register(req, state as any);
        expect(res.status).toBe(400);
        expect(await res.text()).toContain('8 characters');
    });

    test('returns 400 when password is missing', async () => {
        const state = createMockState();
        const req = postJson('http://test/api/register', { email: 'a@b.com', name: 'Alice' });
        const res = await register(req, state as any);
        expect(res.status).toBe(400);
    });

    test('returns 400 when name is missing', async () => {
        const state = createMockState();
        const req = postJson('http://test/api/register', { email: 'a@b.com', password: 'longpassword' });
        const res = await register(req, state as any);
        expect(res.status).toBe(400);
        expect(await res.text()).toContain('Name');
    });

    test('returns 400 when email already exists', async () => {
        // findUserByEmail returns an existing user row
        const state = createMockState([
            [{ id: 1, email: 'a@b.com', name: 'Existing', password_hash: 'hash', avatar_url: null, created_at: new Date() }],
        ]);
        const req = postJson('http://test/api/register', { email: 'a@b.com', password: 'longpassword', name: 'Alice' });
        const res = await register(req, state as any);
        expect(res.status).toBe(400);
        expect(await res.text()).toBe('Email in use');
    });

    test('returns 200 with apiKey and user on success', async () => {
        const now = new Date();
        const state = createMockState([
            // findUserByEmail -> no match
            [],
            // createUser -> inserted row
            [{ id: 42, email: 'new@example.com', name: 'Alice', avatar_url: null, created_at: now, password_hash: 'hashed' }],
            // getOrCreateApiKey -> SELECT finds nothing
            [],
            // getOrCreateApiKey -> INSERT returns key row
            [{ id: 1, user_id: 42, key: 'generated-key', created_at: now }],
        ]);
        const req = postJson('http://test/api/register', { email: 'new@example.com', password: 'longpassword', name: 'Alice' });
        const res = await register(req, state as any);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.apiKey).toBeString();
        expect(body.user.id).toBe(42);
        expect(body.user.email).toBe('new@example.com');
        expect(body.user.name).toBe('Alice');
    });
});

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------
describe('login', () => {
    test('returns 400 when email is invalid', async () => {
        const state = createMockState();
        const req = postJson('http://test/api/login', { email: 'bad', password: 'somepassword' });
        const res = await login(req, state as any);
        expect(res.status).toBe(400);
    });

    test('returns 400 when password is empty', async () => {
        const state = createMockState();
        const req = postJson('http://test/api/login', { email: 'a@b.com', password: '' });
        const res = await login(req, state as any);
        expect(res.status).toBe(400);
        expect(await res.text()).toContain('Password is required');
    });

    test('returns 400 when password is missing', async () => {
        const state = createMockState();
        const req = postJson('http://test/api/login', { email: 'a@b.com' });
        const res = await login(req, state as any);
        expect(res.status).toBe(400);
    });

    test('returns 401 when user is not found', async () => {
        // findUserByEmail returns nothing
        const state = createMockState([[]]);
        const req = postJson('http://test/api/login', { email: 'nobody@example.com', password: 'longpassword' });
        const res = await login(req, state as any);
        expect(res.status).toBe(401);
        expect(await res.text()).toBe('Invalid credentials');
    });

    test('returns 401 when password is wrong', async () => {
        // Hash a known password so we can supply a wrong one
        const correctHash = await Bun.password.hash('correctpassword', 'argon2id');
        const state = createMockState([
            // findUserByEmail -> returns user with the correct hash
            [{ id: 1, email: 'a@b.com', name: 'Alice', avatar_url: null, created_at: new Date(), password_hash: correctHash }],
        ]);
        const req = postJson('http://test/api/login', { email: 'a@b.com', password: 'wrongpassword' });
        const res = await login(req, state as any);
        expect(res.status).toBe(401);
        expect(await res.text()).toBe('Invalid credentials');
    });

    test('returns 200 with apiKey and user on success', async () => {
        const password = 'correctpassword';
        const hash = await Bun.password.hash(password, 'argon2id');
        const now = new Date();
        const state = createMockState([
            // findUserByEmail
            [{ id: 7, email: 'user@example.com', name: 'Bob', avatar_url: null, created_at: now, password_hash: hash }],
            // getOrCreateApiKey -> SELECT finds existing key
            [{ id: 10, user_id: 7, key: 'existing-api-key', created_at: now }],
        ]);
        const req = postJson('http://test/api/login', { email: 'user@example.com', password });
        const res = await login(req, state as any);
        expect(res.status).toBe(200);

        const body = await res.json();
        expect(body.apiKey).toBe('existing-api-key');
        expect(body.user.id).toBe(7);
        expect(body.user.email).toBe('user@example.com');
        expect(body.user.name).toBe('Bob');
    });
});
