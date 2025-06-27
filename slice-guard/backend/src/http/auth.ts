import { hashPassword, verifyPassword } from '../utils/hash';
import { generateApiKey } from '../utils/apiKey';
import { createUser, findUserByEmail, getOrCreateApiKey } from '../db/user';
import type State from '../utils/state';
import type { AuthLoginPayload, AuthRegisterPayload } from '@shared/payloads';

/**
 * POST /api/register
 */
export async function register(req: Request, state: State): Promise<Response> {
    const { email, password, name } = await req.json() as AuthRegisterPayload;

    state.logger.debug({ email }, 'Attempting to register user');
    const existing = await findUserByEmail(state.db, email);
    state.logger.debug({ found: !!existing }, 'Checked existing user');
    if (existing)
        return new Response('Email in use', { status: 400 });

    const hash = await hashPassword(password);
    const user = await createUser(state.db, email, hash, name);
    state.logger.debug({ id: user.id }, 'Created user');
    const key = generateApiKey(user.id);

    await getOrCreateApiKey(state.db, user.id, key);
    state.logger.debug({ id: user.id }, 'Issued API key');
    return Response.json({ apiKey: key });
}

/**
 * POST /api/login
 */
export async function login(req: Request, state: State): Promise<Response> {
    const { email, password } = await req.json() as AuthLoginPayload;

    state.logger.debug({ email }, 'Login attempt');
    const user = await findUserByEmail(state.db, email);
    if (!user) {
        state.logger.debug('User not found');
        return new Response('Invalid credentials', { status: 401 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
        state.logger.debug('Invalid password');
        return new Response('Invalid credentials', { status: 401 });
    }

    const keyRow = await getOrCreateApiKey(state.db, user.id, generateApiKey(user.id));
    state.logger.debug({ userId: user.id }, 'Issued API key');
    return Response.json({ apiKey: keyRow.key });
}