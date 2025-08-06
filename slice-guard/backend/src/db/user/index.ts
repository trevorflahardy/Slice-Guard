import type { User } from "@shared/db/user";
import type { SQL } from "bun";

export * from "./tokens";
export * from "./api";

/** Row returned from the database containing a user's password hash. */
interface UserRow {
    password_hash: string;
}

/**
 * Extension of the public facing {@link User} interface with the internal
 * password hash used for authentication.
 */
export interface UserWithPassword extends User, UserRow { }

/** Fetch a user by their e-mail address. */
export async function findUserByEmail(
    db: SQL,
    email: string
): Promise<UserWithPassword | null> {
    const rows: UserWithPassword[] = await db`
        SELECT id, email, name, avatar_url, created_at, password_hash
          FROM auth.users
         WHERE email = ${email}
    `;
    const [row] = rows;
    return row ?? null;
}

/** Fetch a user by their database id. */
export async function findUserById(
    db: SQL,
    id: number
): Promise<UserWithPassword | null> {
    const rows: UserWithPassword[] = await db`
        SELECT id, email, name, avatar_url, created_at, password_hash
          FROM auth.users
         WHERE id = ${id}
    `;
    const [row] = rows;
    return row ?? null;
}

/** Fetch a user by id returning only public fields. */
export async function findPublicUserById(
    db: SQL,
    id: number
): Promise<User | null> {
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
    avatarUrl: string | null = null
): Promise<UserWithPassword> {
    const rows: UserWithPassword[] = await db`
        INSERT INTO auth.users (email, password_hash, name, avatar_url)
             VALUES (${email}, ${passwordHash}, ${name}, ${avatarUrl})
        RETURNING id, email, name, avatar_url, created_at, password_hash
    `;
    return rows[0];
}

/** Update a user's avatar URL. */
export async function setAvatarUrl(
    db: SQL,
    userId: number,
    url: string | null
): Promise<User> {
    const rows: User[] = await db`
        UPDATE auth.users
           SET avatar_url = ${url}
         WHERE id = ${userId}
        RETURNING id, email, name, avatar_url, created_at
    `;
    return rows[0];
}

/** Update a user's display name. */
export async function setName(
    db: SQL,
    userId: number,
    name: string
): Promise<User> {
    const rows: User[] = await db`
        UPDATE auth.users
           SET name = ${name}
         WHERE id = ${userId}
        RETURNING id, email, name, avatar_url, created_at
    `;
    return rows[0];
}
