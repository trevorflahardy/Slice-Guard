// import { handlers as wsOpHandlers } from "./ws";
import { validateAndDispatchMessage } from "./ws";
import State from "./utils/state";
import { SQL } from "bun";

type WebSocketUpgrade = {
    created_at: number;
    auth_token?: string;
}

console.log("Starting server...");
console.log("Connecting to database...");

const db: SQL = new SQL({
    url: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}/${process.env.POSTGRES_DB}`,

    // Connection pool settings
    max: 20,
    idleTimeout: 30,
    maxLifetime: 0,
    connectionTimeout: 30,

    tls: true,
});
const state = new State(db);

console.log("Connected to database.");
console.log("Starting server...");

Bun.serve<WebSocketUpgrade, unknown>({
    port: 3000,
    routes: {
        // NOTE: Placeholder for future API routes
        // "/api/v1/some_endpoint": {
        //    GET: async (req) => { ... },
        //    POST: async (req) => { ... },
        // }
    },
    fetch(req, server) {
        // For now, upgrade all requests to WebSocket connections

        // Print out this operation has happened

        const url = new URL(req.url);
        if (url.pathname === "/ws") {
            const upgraded = server.upgrade(
                req, {
                data: {
                    created_at: Date.now(),
                    auth_token: undefined, // TODO: Auth token info passed on request
                }
            }
            );

            if (!upgraded) {
                return new Response("Upgrade failed", { status: 400 });
            }
        }

        return new Response("Hello World");
    },
    websocket: {
        async message(ws, message: string | Buffer<ArrayBufferLike>) {
            // For now, just print out what we received
            console.log("Received message:", message);

            // Process this message, assuming all is good
            await validateAndDispatchMessage(ws, message, state);
        },
        open(ws) {
            // ! TODO: Handle a new connection
            // ! For now, simply print out this connection request and upgrade
            // ! the user
            console.log("New connection:", ws);
        },
        close(ws) {
            // ! TODO: Handle closed connections
            console.log("Client disconnected.", ws);
        }
    },
});

console.log("Server started on port 3000.");