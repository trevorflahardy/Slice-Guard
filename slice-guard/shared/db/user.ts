/**
 * @fileoverview Public user interface for the Slice Guard system.
 * This interface is used to represent a user in the system and does
 * not contain sensitive information like password hashes or tokens.
 *
 * Any sensitive information is extended in the backend and kept
 * completely separate from the public interface. Any information
 * displayed here is safe to be sent to the client.
 */

// Represents a front-facing user in the system. Does not include
// sensitive information like password hashes or tokens.
export interface User {
    id: number;
    email: string;
    name?: string | null;
    avatar_url?: string | null;
    created_at: Date;
}