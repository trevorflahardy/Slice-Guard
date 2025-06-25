import type { User } from "@shared/db/user";
import type { SQL } from "bun";

/** Row returned from the database containing a user's password hash. */
interface UserRow {
    password_hash: string;
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
    const [row] = await db.query<UserWithPassword>(
        `SELECT id, email, name, created_at, password_hash
           FROM auth.users
          WHERE email = $1`,
        [email]
    );
    return row ?? null;
}

/** Fetch a user by their database id. */
export async function findUserById(db: SQL, id: number): Promise<UserWithPassword | null> {
    const [row] = await db.query<UserWithPassword>(
        `SELECT id, email, name, created_at, password_hash
           FROM auth.users
          WHERE id = $1`,
        [id]
    );
    return row ?? null;
}

/** Create a new user in the database. */
export async function createUser(db: SQL, email: string, passwordHash: string, name: string): Promise<UserWithPassword> {
    const [row] = await db.query<UserWithPassword>(
        `INSERT INTO auth.users (email, password_hash, name)
           VALUES ($1, $2, $3)
        RETURNING id, email, name, created_at, password_hash`,
        [email, passwordHash, name]
    );
    return row;
}

/** Store a refresh token for a user. */
export async function insertRefreshToken(db: SQL, userId: number, token: string, expiresAt: Date): Promise<RefreshTokenRow> {
    const [row] = await db.query<RefreshTokenRow>(
        `INSERT INTO auth.refresh_tokens (user_id, token, expires_at)
           VALUES ($1, $2, $3)
        RETURNING id, user_id, token, created_at, expires_at`,
        [userId, token, expiresAt]
    );
    return row;
}

/** Retrieve a refresh token record if it exists. */
export async function getRefreshToken(db: SQL, token: string): Promise<RefreshTokenRow | null> {
    const [row] = await db.query<RefreshTokenRow>(
        `SELECT id, user_id, token, created_at, expires_at
           FROM auth.refresh_tokens
          WHERE token = $1`,
        [token]
    );
    return row ?? null;
}

/** Delete a specific refresh token. */
export async function deleteRefreshToken(db: SQL, token: string): Promise<void> {
    await db.run(`DELETE FROM auth.refresh_tokens WHERE token = $1`, [token]);
}

/** Remove all refresh tokens belonging to a user. */
export async function deleteTokensForUser(db: SQL, userId: number): Promise<void> {
    await db.run(`DELETE FROM auth.refresh_tokens WHERE user_id = $1`, [userId]);
}