// import { handlers as wsOpHandlers } from "./ws";
import { OpCode, type OpCodePayloadUnion } from "@shared/ws/opcodes";

type WebSocketUpgrade = {
    created_at: number;
    auth_token?: string;
}

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

        server.upgrade(req, {
            data: {
                created_at: Date.now(),
                auth_token: undefined, // TODO: Auth token info passed on request
            }
        })
    },
    websocket: {
        async message(ws, message) {
            let payload: OpCodePayloadUnion;

            // For now, just print out what we received
            console.log("Received message:", message);
        },
        open(ws) {
            // ! TODO: Handle a new connection
        },
        close(ws) {
            // ! TODO: Handle closed connections
        }
    },
})