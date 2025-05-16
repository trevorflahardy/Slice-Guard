/**
 * @fileoverview Represents the state of the application. Gets passed to handlers
 * and allow safe access of database connections, managers, etc.
 */

import { SQL } from "bun";


export default class State {
    // The database pool connection
    db: SQL;

    constructor(db: SQL) {
        this.db = db;
    }
}