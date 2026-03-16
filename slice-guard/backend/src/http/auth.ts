import { hashPassword, verifyPassword } from '../utils/hash';
import { generateApiKey } from '../utils/apiKey';
import { createUser, findUserByEmail, getOrCreateApiKey } from '../db/user';
import { validateEmail, validatePassword, validateStringLength } from '../utils/validate';
import type State from '../utils/state';
import type { AuthLoginPayload, AuthRegisterPayload } from '@shared/payloads';

/**
 * POST /api/register
 */
export async function register(req: Request, state: State): Promise<Response> {
    const { email, password, name } = (await req.json()) as AuthRegisterPayload;

    const emailErr = validateEmail(email);
    if (emailErr) return new Response(emailErr, { status: 400 });
    const passErr = validatePassword(password);
    if (passErr) return new Response(passErr, { status: 400 });
    const nameErr = validateStringLength(name, 'Name', 1, 100);
    if (nameErr) return new Response(nameErr, { status: 400 });

    state.logger.debug({ email }, 'Attempting to register user');
    const existing = await findUserByEmail(state.db, email);
    state.logger.debug({ found: !!existing }, 'Checked existing user');
    if (existing) {
        return new Response('Email in use', { status: 400 });
    }

    const hash = await hashPassword(password);
    const user = await createUser(state.db, email, hash, name);
    state.logger.debug({ id: user.id }, 'Created user');
    const key = generateApiKey(user.id);

    await getOrCreateApiKey(state.db, user.id, key);
    state.logger.debug({ id: user.id }, 'Issued API key');
    return Response.json({
        apiKey: key,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            created_at: user.created_at,
        },
    });
}

/**
 * POST /api/login
 */
export async function login(req: Request, state: State): Promise<Response> {
    const { email, password } = (await req.json()) as AuthLoginPayload;

    const emailErr = validateEmail(email);
    if (emailErr) return new Response(emailErr, { status: 400 });
    if (typeof password !== 'string' || password.length === 0) {
        return new Response('Password is required', { status: 400 });
    }

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
    return Response.json({
        apiKey: keyRow.key,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            created_at: user.created_at,
        },
    });
}
