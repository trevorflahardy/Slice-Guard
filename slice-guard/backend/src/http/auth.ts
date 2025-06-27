import { hashPassword, verifyPassword } from '../utils/hash';
import { generateApiKey } from '../utils/apiKey';
import { createUser, findUserByEmail, getOrCreateApiKey } from '../db/user';
import type State from '../utils/state';
import type { AuthLoginPayload, AuthRegisterPayload } from '@shared/payloads';

/**
 * POST /api/register
 */
export async function register(req: Request, state: State): Promise<Response> {
    const { email, password, name } = await req.json() as AuthRegisterPayload['d'];
    const existing = await findUserByEmail(state.db, email);
    if (existing) return new Response('Email in use', { status: 400 });
    const hash = await hashPassword(password);
    const user = await createUser(state.db, email, hash, name);
    const key = generateApiKey(user.id);
    await getOrCreateApiKey(state.db, user.id, key);
    return Response.json({ apiKey: key });
}

/**
 * POST /api/login
 */
export async function login(req: Request, state: State): Promise<Response> {
    const { email, password } = await req.json() as AuthLoginPayload['d'];
    const user = await findUserByEmail(state.db, email);
    if (!user) return new Response('Invalid credentials', { status: 401 });
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return new Response('Invalid credentials', { status: 401 });
    const keyRow = await getOrCreateApiKey(state.db, user.id, generateApiKey(user.id));
    return Response.json({ apiKey: keyRow.key });
}
