/**
 * @fileoverview Represents the state of the application. Gets passed to handlers
 * and allow safe access of database connections, managers, etc.
 */

import { SQL } from "bun";
import type { Logger } from "pino";
import type { ServerWebSocket } from "../ws";
import type { WsPayloadUnion } from "@shared/payloads/ws";


export default class State {
    // The database pool connection
    db: SQL;
    // Application logger
    logger: Logger;
    // Active websocket connections
    sockets: Set<ServerWebSocket> = new Set();

    constructor(db: SQL, logger: Logger) {
        this.db = db;
        this.logger = logger;
    }

    /** Broadcast a message to all connected clients. */
    broadcast(msg: WsPayloadUnion, excludeUserId?: number) {
        const raw = JSON.stringify(msg);
        for (const ws of this.sockets) {
            if (excludeUserId && ws.data.userId === excludeUserId) continue;
            try {
                ws.send(raw);
            } catch (err) {
                this.logger.error({ err }, "Failed to send WS message");
            }
        }
    }
}