import type { User } from "@shared/db/user";
import type { SQL } from "bun";

/** Row returned from the database containing a user's password hash. */
interface UserRow {
    password_hash: string;
}

export interface ApiKeyRow {
    id: number;
    user_id: number;
    key: string;
    created_at: Date;
}

/**
 * Extension of the public facing {@link User} interface with the internal
 * password hash used for authentication.
 */
export interface UserWithPassword extends User, UserRow { }

/** Raw row returned for refresh token queries. */
export interface RefreshTokenRow {
    id: number;
    user_id: number;
    token: string;
    created_at: Date;
    expires_at: Date;
}

/** Fetch a user by their e-mail address. */
export async function findUserByEmail(db: SQL, email: string): Promise<UserWithPassword | null> {
    const rows: UserWithPassword[] = await db`
        SELECT id, email, name, avatar_url, created_at, password_hash
          FROM auth.users
         WHERE email = ${email}
    `;
    const [row] = rows;
    return row ?? null;
}

/** Fetch a user by their database id. */
export async function findUserById(db: SQL, id: number): Promise<UserWithPassword | null> {
    const rows: UserWithPassword[] = await db`
        SELECT id, email, name, avatar_url, created_at, password_hash
          FROM auth.users
         WHERE id = ${id}
    `;
    const [row] = rows;
    return row ?? null;
}

/** Fetch a user by id returning only public fields. */
export async function findPublicUserById(db: SQL, id: number): Promise<User | null> {
    const rows: User[] = await db`
        SELECT id, email, name, avatar_url, created_at
          FROM auth.users
         WHERE id = ${id}
    `;
    const [row] = rows;
    return row ?? null;
}

/** Create a new user in the database. */
export async function createUser(
    db: SQL,
    email: string,
    passwordHash: string,
    name: string,
    avatarUrl: string | null = null,
): Promise<UserWithPassword> {
    const rows: UserWithPassword[] = await db`
        INSERT INTO auth.users (email, password_hash, name, avatar_url)
             VALUES (${email}, ${passwordHash}, ${name}, ${avatarUrl})
        RETURNING id, email, name, avatar_url, created_at, password_hash
    `;
    return rows[0];
}

/** Store a refresh token for a user. */
export async function insertRefreshToken(db: SQL, userId: number, token: string, expiresAt: Date): Promise<RefreshTokenRow> {
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

/** Insert a new API key for a user. */
export async function insertApiKey(db: SQL, userId: number, key: string): Promise<ApiKeyRow> {
    const rows: ApiKeyRow[] = await db`
        INSERT INTO auth.api_keys (user_id, key)
             VALUES (${userId}, ${key})
        RETURNING id, user_id, key, created_at
    `;
    return rows[0];
}

/** Retrieve a user's API key record. */
export async function getApiKey(db: SQL, key: string): Promise<ApiKeyRow | null> {
    const rows: ApiKeyRow[] = await db`
        SELECT id, user_id, key, created_at
          FROM auth.api_keys
         WHERE key = ${key}
    `;
    const [row] = rows;
    return row ?? null;
}

/** Get or create an API key for a given user. */
export async function getOrCreateApiKey(db: SQL, userId: number, key: string): Promise<ApiKeyRow> {
    const existing: ApiKeyRow[] = await db`
        SELECT id, user_id, key, created_at
          FROM auth.api_keys
         WHERE user_id = ${userId}
         LIMIT 1
    `;
    if (existing[0]) return existing[0];
    return insertApiKey(db, userId, key);
}

/** Update a user's avatar URL. */
export async function setAvatarUrl(db: SQL, userId: number, url: string | null): Promise<User> {
    const rows: User[] = await db`
        UPDATE auth.users
           SET avatar_url = ${url}
         WHERE id = ${userId}
        RETURNING id, email, name, avatar_url, created_at
    `;
    return rows[0];
}