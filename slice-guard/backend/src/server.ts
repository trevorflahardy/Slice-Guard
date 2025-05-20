// import { handlers as wsOpHandlers } from "./ws";
import { validateAndDispatchMessage, type WebSocketData, type ServerWebSocket } from "./ws";
import State from "./utils/state";
import { SQL, type SQLOptions } from "bun";

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

    private handleFetch(req: Request, server: Bun.Server) {
        const url = new URL(req.url);
        if (url.pathname === "/ws") {
            const now = Date.now();
            const upgraded = server.upgrade<WebSocketData>(
                req, {
                data: {
                    created_at: now,
                    id: new String(Bun.hash(`${now}-${Math.random()}`)) as string, // TODO: Update - this is bad
                }
            }
            );

            if (!upgraded) {
                logger.error("Failed to upgrade request");
                return new Response("Upgrade failed", { status: 400 });
            }
        }

        return new Response("Hello World");
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