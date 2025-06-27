/**
 * @fileoverview Represents the state of the application. Gets passed to handlers
 * and allow safe access of database connections, managers, etc.
 */

import { SQL } from "bun";
import type { Logger } from "pino";


export default class State {
    // The database pool connection
    db: SQL;
    // Application logger
    logger: Logger;

    constructor(db: SQL, logger: Logger) {
        this.db = db;
        this.logger = logger;
    }
}