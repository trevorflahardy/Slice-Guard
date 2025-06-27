import { getApiKey } from '../db/user';
import type State from '../utils/state';
import { withCors } from '../utils/cors';
import type { Logger } from 'pino';

export async function authenticate(
    req: Request,
    state: State,
    lookup: typeof getApiKey = getApiKey
): Promise<number | null> {
    const header = req.headers.get('authorization');
    if (!header)
        return null;

    const [scheme, key] = header.split(' ');
    if (!key || scheme.toLowerCase() !== 'apikey')
        return null;

    const row = await lookup(state.db, key);
    return row ? row.user_id : null;
}

export function withAuth(
    handler: (req: Request, userId: number, state: State, params: Record<string, string>) => Promise<Response>
): (req: Request, state: State, params: Record<string, string>) => Promise<Response> {
    return async (req, state, params) => {
        const log: Logger = state.logger.child({ endpoint: new URL(req.url).pathname, params });
        const userId = await authenticate(req, state);
        if (!userId) {
            log.debug('Unauthorized request');
            return withCors(new Response('Unauthorized', { status: 401 }));
        }
        log.debug({ userId }, 'Authenticated user');
        const res = await handler(req, userId, state, params);
        log.debug({ status: res.status }, 'Request handled');
        return withCors(res);
    };
}

export function withLogging(
    handler: (req: Request, state: State, params: Record<string, string>) => Promise<Response>
): (req: Request, state: State, params: Record<string, string>) => Promise<Response> {
    return async (req, state, params) => {
        const log = state.logger.child({ endpoint: new URL(req.url).pathname, params });
        log.debug({ method: req.method }, 'REST request');
        const res = await handler(req, state, params);
        log.debug({ status: res.status }, 'REST response');
        return res;
    };
}