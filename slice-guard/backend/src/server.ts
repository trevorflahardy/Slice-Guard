import { validateAndDispatchMessage, type WebSocketData, type ServerWebSocket } from "./ws";
import State from "./utils/state";
import { SQL, type SQLOptions } from "bun";
import * as auth from './http/auth';
import * as lab from './http/lab';
import * as requestHandlers from './http/request';

import logger from "./utils/logger";
import { withLogging } from "./http/middleware";
import type { Logger } from "pino";



export class Server {
    private state: State;
    public logger: Logger;

    constructor(options: { sql: SQLOptions }) {
        logger.debug("Initializing server with options: %o", options);
        const db = new SQL(options.sql);
        this.logger = logger.child({ component: "server" });
        this.state = new State(db, this.logger); // Hand off DB ownership

        this.logger.debug("Server initialized with database connection");
    }

    start() {
        Bun.serve({
            port: 3000,
            routes: {
                '/api/login': {
                    POST: req => withLogging((r, s) => auth.login(r, s))(req, this.state, req.params),
                },
                '/api/register': {
                    POST: req => withLogging((r, s) => auth.register(r, s))(req, this.state, req.params),
                },
                '/api/labs': {
                    GET: req => withLogging(lab.list)(req, this.state, {}),
                    POST: req => withLogging(lab.create)(req, this.state, {}),
                },
                '/api/labs/:id': {
                    GET: req => withLogging(lab.get)(req, this.state, req.params),
                    PATCH: req => withLogging(lab.update)(req, this.state, req.params),
                    DELETE: req => withLogging(lab.del)(req, this.state, req.params),
                },
                '/api/labs/:labId/roles': {
                    POST: req => withLogging(lab.createRoleRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/members': {
                    POST: req => withLogging(lab.addMemberRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/members/:userId': {
                    DELETE: req => withLogging(lab.removeMemberRoute)(req, this.state, req.params),
                },
                '/api/labs/:labId/requests': {
                    POST: req => withLogging(requestHandlers.create)(req, this.state, req.params),
                    GET: req => withLogging(requestHandlers.list)(req, this.state, req.params),
                },
                '/api/labs/:labId/tags': {
                    POST: req => withLogging(requestHandlers.createTagRoute)(req, this.state, req.params),
                },
                '/api/tags/:tagId': {
                    PATCH: req => withLogging(requestHandlers.setTagDefaultRoute)(req, this.state, req.params),
                },
                '/api/requests/:requestId/tags/:tagId': {
                    POST: req => withLogging(requestHandlers.assignTagRoute)(req, this.state, req.params),
                },
                '/api/*': () => Response.json({ message: 'Not found' }, { status: 404 }),
            },
            fetch: this.handleFetch.bind(this),
            websocket: {
                message: this.handleWebSocketMessage.bind(this),
                open: this.handleWebSocketOpen.bind(this),
                close: this.handleWebSocketClose.bind(this),
            }
        })
    }

    async stop() {
        // Close the database connection
        await this.state.db.close();
    }

    private async handleFetch(req: Request, server: Bun.Server) {
        if (req.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS'
                }
            });
        }
        const url = new URL(req.url);
        if (url.pathname === "/ws") {
            const now = Date.now();
            const upgraded = server.upgrade<WebSocketData>(req, {
                data: { created_at: now, id: String(Bun.hash(`${now}-${Math.random()}`)) }
            });
            if (!upgraded) return new Response("Upgrade failed", { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } });
            return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
        }
        return new Response("Not Found", { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    private async handleWebSocketMessage(ws: ServerWebSocket, message: string | Buffer<ArrayBufferLike>) {
        // For now, just print out what we received
        logger.debug("Received message: %o", message);

        // Process this message, assuming all is good
        await validateAndDispatchMessage(this, ws, message, this.state);
    }

    private handleWebSocketOpen(ws: ServerWebSocket) {
        // ! TODO: Handle a new connection
        // ! For now, simply print out this connection request and upgrade
        // ! the user
        logger.debug("New connection: %o", ws);
    }

    private handleWebSocketClose(ws: ServerWebSocket) {
        // ! TODO: Handle closed connections
        logger.debug("Connection closed: %o", ws);
    }

};


const server = new Server({
    sql: {
        url: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.POSTGRES_DB}`,

        // Connection pool settings
        max: 20,
        idleTimeout: 30,
        maxLifetime: 0,
        connectionTimeout: 30,

        tls: true,
    }
})

server.start();