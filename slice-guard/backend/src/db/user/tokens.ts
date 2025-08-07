import type { SQL } from 'bun';

/** Raw row returned for refresh token queries. */
export interface RefreshTokenRow {
    id: number;
    user_id: number;
    token: string;
    created_at: Date;
    expires_at: Date;
}

/** Store a refresh token for a user. */
export async function insertRefreshToken(
    db: SQL,
    userId: number,
    token: string,
    expiresAt: Date,
): Promise<RefreshTokenRow> {
    const rows: RefreshTokenRow[] = await db`
        INSERT INTO auth.refresh_tokens (user_id, token, expires_at)
             VALUES (${userId}, ${token}, ${expiresAt})
        RETURNING id, user_id, token, created_at, expires_at
    `;
    return rows[0];
}

/** Retrieve a refresh token record if it exists. */
export async function getRefreshToken(db: SQL, token: string): Promise<RefreshTokenRow | null> {
    const rows: RefreshTokenRow[] = await db`
        SELECT id, user_id, token, created_at, expires_at
          FROM auth.refresh_tokens
         WHERE token = ${token}
    `;
    const [row] = rows;
    return row ?? null;
}

/** Delete a specific refresh token. */
export async function deleteRefreshToken(db: SQL, token: string): Promise<void> {
    await db`
        DELETE FROM auth.refresh_tokens
         WHERE token = ${token}
    `;
}

/** Remove all refresh tokens belonging to a user. */
export async function deleteTokensForUser(db: SQL, userId: number): Promise<void> {
    await db`
        DELETE FROM auth.refresh_tokens
         WHERE user_id = ${userId}
    `;
}
