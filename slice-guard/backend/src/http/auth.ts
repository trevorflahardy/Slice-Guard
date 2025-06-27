import { withCors } from '../utils/cors';
    return withCors(Response.json({ apiKey: key }));
    if (!user) return withCors(new Response('Invalid credentials', { status: 401 }));
    if (!ok) return withCors(new Response('Invalid credentials', { status: 401 }));
    return withCors(Response.json({ apiKey: keyRow.key }));
import type { AuthLoginPayload, AuthRegisterPayload } from "@shared/payloads";

/**
 * POST /api/register
 */
export async function register(req: Request, state: State): Promise<Response> {
    const { email, password, name } = (await req.json()) as AuthRegisterPayload;

    const existing = await findUserByEmail(state.db, email);
    if (existing)
        return new Response("Email in use", { status: 400 });

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
    const { email, password } = (await req.json()) as AuthLoginPayload;

    const user = await findUserByEmail(state.db, email);
    if (!user)
        return new Response("Invalid credentials", { status: 401 });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok)
        return new Response("Invalid credentials", { status: 401 });

    const keyRow = await getOrCreateApiKey(
        state.db,
        user.id,
        generateApiKey(user.id)
    );
    return Response.json({ apiKey: keyRow.key });
}
