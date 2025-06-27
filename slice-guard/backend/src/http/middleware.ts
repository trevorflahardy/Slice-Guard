import { getApiKey } from '../db/user';
import type State from '../utils/state';

export async function authenticate(
    req: Request,
    state: State,
    lookup: typeof getApiKey = getApiKey
): Promise<number | null> {
    const header = req.headers.get('authorization');
    if (!header) return null;
    const [scheme, key] = header.split(' ');
    if (!key || scheme.toLowerCase() !== 'apikey') return null;
    const row = await lookup(state.db, key);
    return row ? row.user_id : null;
}

export function withAuth(
    handler: (req: Request, userId: number, state: State, params: Record<string, string>) => Promise<Response>
): (req: Request, state: State, params: Record<string, string>) => Promise<Response> {
    return async (req, state, params) => {
        const userId = await authenticate(req, state);
        if (!userId) {
            return new Response('Unauthorized', { status: 401 });
        }
        return handler(req, userId, state, params);
    };
}
