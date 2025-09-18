/**
 * @fileoverview Represents the state of the application. Gets passed to handlers
 * and allow safe access of database connections, managers, etc.
 */

import { SQL } from 'bun';
import type { Logger } from 'pino';
import type { ServerWebSocket } from '../ws';
import type { WsPayloadUnion } from '@shared/payloads/ws';

export default class State {
    // The database pool connection
    db: SQL;
    // Application logger
    logger: Logger;
    // Active websocket connections
    sockets: Set<ServerWebSocket> = new Set();
    // Active sockets keyed by user id for targeted broadcasts
    private socketsByUser: Map<number, Set<ServerWebSocket>> = new Map();

    constructor(db: SQL, logger: Logger) {
        this.db = db;
        this.logger = logger;
    }

    /** Register an incoming websocket connection. */
    addSocket(ws: ServerWebSocket) {
        this.sockets.add(ws);
        const collection = this.socketsByUser.get(ws.data.userId);
        if (collection) {
            collection.add(ws);
        } else {
            this.socketsByUser.set(ws.data.userId, new Set([ws]));
        }
    }

    /** Remove a websocket from the active collections. */
    removeSocket(ws: ServerWebSocket) {
        this.sockets.delete(ws);
        const collection = this.socketsByUser.get(ws.data.userId);
        if (!collection) {
            return;
        }
        collection.delete(ws);
        if (collection.size === 0) {
            this.socketsByUser.delete(ws.data.userId);
        }
    }

    /** Broadcast a message to all connected clients. */
    broadcast(msg: WsPayloadUnion) {
        const raw = JSON.stringify(msg);
        for (const ws of this.sockets) {
            try {
                ws.send(raw);
            } catch (err) {
                this.logger.error({ err }, 'Failed to send WS message');
            }
        }
    }

    /** Send a websocket message to a single user if they are connected. */
    sendToUser(userId: number, msg: WsPayloadUnion) {
        this.sendToUsers([userId], msg);
    }

    /**
     * Send a websocket message to a set of users. Each socket is only sent the
     * payload once even if multiple user ids map to the same underlying
     * connection.
     */
    sendToUsers(userIds: Iterable<number>, msg: WsPayloadUnion) {
        const raw = JSON.stringify(msg);
        const delivered = new Set<ServerWebSocket>();
        for (const userId of userIds) {
            const sockets = this.socketsByUser.get(userId);
            if (!sockets) {
                continue;
            }
            for (const ws of sockets) {
                if (delivered.has(ws)) {
                    continue;
                }
                try {
                    ws.send(raw);
                    delivered.add(ws);
                } catch (err) {
                    this.logger.error({ err, userId }, 'Failed to send targeted WS message');
                }
            }
        }
    }
}
