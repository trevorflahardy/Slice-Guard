// import { handlers as wsOpHandlers } from "./ws";
import { validateAndDispatchMessage, type WebSocketData, type ServerWebSocket } from "./ws";
import State from "./utils/state";
import { SQL, type SQLOptions } from "bun";
import * as auth from './http/auth';
import * as lab from './http/lab';

import pino from "pino";
const logger = pino({ level: 'debug' });



export class Server {
    private state: State;
    public logger: pino.Logger;

    constructor(options: { sql: SQLOptions }) {
        const db: SQL = new SQL(options.sql);
        this.state = new State(db); // Hand off DB ownership
        this.logger = logger.child({ component: "server" });
    }

    start() {
        Bun.serve({
            port: 3000,
            routes: {}, // TODO
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
        const url = new URL(req.url);
        if (url.pathname === "/ws") {
            const now = Date.now();
            const upgraded = server.upgrade<WebSocketData>(req, {
                data: { created_at: now, id: String(Bun.hash(`${now}-${Math.random()}`)) }
            });
            if (!upgraded) return new Response("Upgrade failed", { status: 400 });
            return new Response(null);
        }

        if (url.pathname.startsWith('/api')) {
            return this.handleApi(req, url);
        }

        return new Response("Not found", { status: 404 });
    }

    private async handleApi(req: Request, url: URL): Promise<Response> {
        const path = url.pathname.slice(4);
        (req as any).state = this.state;

        if (path === '/login' && req.method === 'POST') return auth.login(req, this.state);
        if (path === '/register' && req.method === 'POST') return auth.register(req, this.state);
        if (path === '/labs' && req.method === 'POST') return lab.create(req, this.state, {});
        if (path === '/labs' && req.method === 'GET') return lab.list(req, this.state, {});
        if (path.match(/^\/labs\/\d+$/)) {
            const id = path.split('/')[2];
            if (req.method === 'GET') return lab.get(req, this.state, { id });
            if (req.method === 'PATCH') return lab.update(req, this.state, { id });
            if (req.method === 'DELETE') return lab.del(req, this.state, { id });
        }
        if (path.match(/^\/labs\/\d+\/roles$/) && req.method === 'POST') {
            const labId = path.split('/')[2];
            return lab.createRoleRoute(req, this.state, { labId });
        }
        if (path.match(/^\/labs\/\d+\/members$/) && req.method === 'POST') {
            const labId = path.split('/')[2];
            return lab.addMemberRoute(req, this.state, { labId });
        }
        if (path.match(/^\/labs\/\d+\/members\/\d+$/) && req.method === 'DELETE') {
            const [, labId,, userId] = path.split('/');
            return lab.removeMemberRoute(req, this.state, { labId, userId });
        }

        return new Response('Not found', { status: 404 });
    }

    private async handleWebSocketMessage(ws: ServerWebSocket, message: string | Buffer<ArrayBufferLike>) {
        // For now, just print out what we received
        logger.debug("Received message:", message);

        // Process this message, assuming all is good
        await validateAndDispatchMessage(this, ws, message, this.state);
    }

    private handleWebSocketOpen(ws: ServerWebSocket) {
        // ! TODO: Handle a new connection
        // ! For now, simply print out this connection request and upgrade
        // ! the user
        logger.debug("New connection:", ws);
    }

    private handleWebSocketClose(ws: ServerWebSocket) {
        // ! TODO: Handle closed connections
        logger.debug("Connection closed:", ws);
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