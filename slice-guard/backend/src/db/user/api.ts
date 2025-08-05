import type { SQL } from "bun";

export interface ApiKeyRow {
    id: number;
    user_id: number;
    key: string;
    created_at: Date;
}

/** Insert a new API key for a user. */
export async function insertApiKey(
    db: SQL,
    userId: number,
    key: string
): Promise<ApiKeyRow> {
    const rows: ApiKeyRow[] = await db`
        INSERT INTO auth.api_keys (user_id, key)
             VALUES (${userId}, ${key})
        RETURNING id, user_id, key, created_at
    `;
    return rows[0];
}

/** Retrieve a user's API key record. */
export async function getApiKey(
    db: SQL,
    key: string
): Promise<ApiKeyRow | null> {
    const rows: ApiKeyRow[] = await db`
        SELECT id, user_id, key, created_at
          FROM auth.api_keys
         WHERE key = ${key}
    `;
    const [row] = rows;
    return row ?? null;
}

/** Get or create an API key for a given user. */
export async function getOrCreateApiKey(
    db: SQL,
    userId: number,
    key: string
): Promise<ApiKeyRow> {
    const existing: ApiKeyRow[] = await db`
        SELECT id, user_id, key, created_at
          FROM auth.api_keys
         WHERE user_id = ${userId}
         LIMIT 1
    `;
    if (existing[0]) return existing[0];
    return insertApiKey(db, userId, key);
}
