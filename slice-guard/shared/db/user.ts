// Represents a front-facing user in the system. Does not include
// sensitive information like password hashes or tokens.
export interface User {
    id: number;
    email: string;
    name?: string | null;
    created_at: Date;
}