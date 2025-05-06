import type { User } from "@shared/db/user";

interface UserRow {
    password_hash: string;
}

export interface UserWithPassword extends User, UserRow { }