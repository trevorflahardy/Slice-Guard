import { validateAndDispatchMessage, type WebSocketData, type ServerWebSocket } from './ws';
import State from './utils/state';
import { SQL, type SQLOptions } from 'bun';
import * as auth from './http/auth';
import * as lab from './http/lab';
import * as requestHandlers from './http/request';
import * as userRoutes from './http/user';
import * as channelRoutes from './http/channel';
import { getApiKey } from './db/user';
import { WsEvent } from '@shared/payloads/ws';
import { getUserLabStates } from './utils/lab_state';

import logger from './utils/logger';
import { withLogging } from './http/middleware';
import type { Logger } from 'pino';

export class Server {
    private state: State;
    public logger: Logger;

    constructor(options: { sql: SQLOptions }) {
        logger.debug('Initializing server with options: %o', options);
        const db = new SQL(options.sql);
        this.logger = logger.child({ component: 'server' });
        this.state = new State(db, this.logger); // Hand off DB ownership

        this.logger.debug('Server initialized with database connection');
    }

    start() {
        Bun.serve({
            port: 3000,
            routes: {
                '/api/login': {
                    POST: (req) =>
                        withLogging((r, s) => auth.login(r, s))(req, this.state, req.params),
                },
                '/api/register': {
                    POST: (req) =>
                        withLogging((r, s) => auth.register(r, s))(req, this.state, req.params),
                },
                '/api/labs': {
                    GET: (req) => withLogging(lab.list)(req, this.state, {}),
                    POST: (req) => withLogging(lab.create)(req, this.state, {}),
                },
                '/api/labs/:id': {
                    GET: (req) => withLogging(lab.get)(req, this.state, req.params),
                    PATCH: (req) => withLogging(lab.update)(req, this.state, req.params),
                    DELETE: (req) => withLogging(lab.del)(req, this.state, req.params),
                },
                '/api/labs/:id/icon': {
                    POST: (req) => withLogging(lab.uploadIcon)(req, this.state, req.params),
                },
                '/api/labs/:labId/roles': {
                    POST: (req) => withLogging(lab.createRoleRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/roles/:roleId': {
                    PATCH: (req) => withLogging(lab.updateRoleRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/members': {
                    POST: (req) => withLogging(lab.addMemberRoute)(req, this.state, req.params),
                    GET: (req) => withLogging(lab.listMembersRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/members/:userId': {
                    DELETE: (req) =>
                        withLogging(lab.removeMemberRoute)(req, this.state, req.params),
                    GET: (req) => withLogging(lab.getMemberRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/members/@me': {
                    DELETE: (req) => withLogging(lab.leaveLabRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/requests': {
                    POST: (req) => withLogging(requestHandlers.create)(req, this.state, req.params),
                    GET: (req) => withLogging(requestHandlers.list)(req, this.state, req.params),
                },
                '/api/labs/:labId/requests/:requestId': {
                    GET: (req) =>
                        withLogging(requestHandlers.getRoute)(req, this.state, req.params),
                    PATCH: (req) =>
                        withLogging(requestHandlers.setRequestStateRoute)(
                            req,
                            this.state,
                            req.params,
                        ),
                    DELETE: (req) =>
                        withLogging(requestHandlers.deleteRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/requests/:requestId/tags/:tagId': {
                    POST: (req) =>
                        withLogging(requestHandlers.assignTagRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/tags': {
                    POST: (req) =>
                        withLogging(requestHandlers.createTagRoute)(req, this.state, req.params),
                    GET: (req) =>
                        withLogging(requestHandlers.listTagsRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/tags/:tagId': {
                    PATCH: (req) =>
                        withLogging(requestHandlers.setTagDefaultRoute)(
                            req,
                            this.state,
                            req.params,
                        ),
                    DELETE: (req) =>
                        withLogging(requestHandlers.deleteTagRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/invites': {
                    POST: (req) => withLogging(lab.createInviteRoute)(req, this.state, req.params),
                    GET: (req) => withLogging(lab.listInvitesRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/invites/:inviteId': {
                    PATCH: (req) => withLogging(lab.updateInviteRoute)(req, this.state, req.params),
                    DELETE: (req) =>
                        withLogging(lab.deleteInviteRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/channels': {
                    GET: req => withLogging(channelRoutes.listChannelsRoute)(req, this.state, req.params),
                    POST: req => withLogging(channelRoutes.createChannelRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/channels/:channelId': {
                    PATCH: req => withLogging(channelRoutes.updateChannelRoute)(req, this.state, req.params),
                    DELETE: req => withLogging(channelRoutes.deleteChannelRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/channels/:channelId/position': {
                    PATCH: req => withLogging(channelRoutes.setChannelPositionRoute)(req, this.state, req.params),
                },
                '/api/channels/:channelId/messages': {
                    GET: req => withLogging(channelRoutes.listMessagesRoute)(req, this.state, req.params),
                    POST: req => withLogging(channelRoutes.createMessageRoute)(req, this.state, req.params),
                },
                '/api/channels/:channelId/messages/:messageId': {
                    PATCH: req => withLogging(channelRoutes.updateMessageRoute)(req, this.state, req.params),
                    DELETE: req => withLogging(channelRoutes.deleteMessageRoute)(req, this.state, req.params),
                },
                '/api/invites/:code': {
                    POST: (req) => withLogging(lab.useInviteRoute)(req, this.state, req.params),
                },
                '/api/users/:id/avatar': {
                    POST: (req) =>
                        withLogging(userRoutes.uploadAvatar)(req, this.state, req.params),
                    GET: (req) => withLogging(userRoutes.getAvatar)(req, this.state, req.params),
                },
                '/api/users/:id': {
                    PATCH: (req) => withLogging(userRoutes.update)(req, this.state, req.params),
                },
                '/api/*': {
                    OPTIONS: (_req) => {
                        // Handle CORS preflight (in the future)
                        return new Response('Not Found', { status: 404 });
                    },
                    // For all other methods, let the request pass through to the routes
                    '*': (req) =>
                        withLogging(async (_r, _s) => {
                            return new Response('Not Found', { status: 404 });
                        }),
                },
            },
            fetch: this.handleFetch.bind(this),
            websocket: {
                message: this.handleWebSocketMessage.bind(this),
                open: this.handleWebSocketOpen.bind(this),
                close: this.handleWebSocketClose.bind(this),
            },
        });
    }

    async stop() {
        // Close the database connection
        await this.state.db.close();
    }

    private async handleFetch(req: Request, server: Bun.Server) {
        const url = new URL(req.url);

        // Only handle WebSocket upgrades, let everything else go to routes
        if (url.pathname === '/ws') {
            const key = url.searchParams.get('key');
            if (!key) {
                return new Response('Unauthorized', { status: 401 });
            }

            const row = await getApiKey(this.state.db, key);
            if (!row) {
                return new Response('Unauthorized', { status: 401 });
            }

            const now = Date.now();
            const upgraded = server.upgrade<WebSocketData>(req, {
                data: {
                    created_at: now,
                    id: String(Bun.hash(`${now}-${Math.random()}`)),
                    userId: row.user_id,
                },
            });
            if (!upgraded) {
                return new Response('Upgrade failed', { status: 400 });
            }
            return new Response(null);
        }

        // Handle CORS preflight for all API routes (in the future)
        if (req.method === 'OPTIONS') {
        }

        // Return undefined to let Bun's router handle the request
        return undefined;
    }

    private async handleWebSocketMessage(
        ws: ServerWebSocket,
        message: string | Buffer<ArrayBufferLike>,
    ) {
        // For now, just print out what we received
        logger.debug('Received message: %o', message);

        // Process this message, assuming all is good
        await validateAndDispatchMessage(this, ws, message, this.state);
    }

    private async handleWebSocketOpen(ws: ServerWebSocket) {
        this.state.sockets.add(ws);
        const labs = await getUserLabStates(this.state.db, ws.data.userId);
        ws.send(JSON.stringify({ op: WsEvent.HELLO, d: { labs } }));
        logger.debug({ userId: ws.data.userId }, 'WebSocket connected');
    }

    private handleWebSocketClose(ws: ServerWebSocket) {
        this.state.sockets.delete(ws);
        logger.debug({ userId: ws.data.userId }, 'WebSocket disconnected');
    }
}

const server = new Server({
    sql: {
        url: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.POSTGRES_DB}`,

        // Connection pool settings
        max: 20,
        idleTimeout: 30,
        maxLifetime: 0,
        connectionTimeout: 30,
    },
});

server.start();
