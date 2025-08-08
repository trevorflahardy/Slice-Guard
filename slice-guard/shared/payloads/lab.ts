// Shared interfaces for lab management payloads

export interface LabCreatePayload {
    name: string;
    description?: string | null;
    iconUrl?: string | null;
}

export interface LabUpdatePayload {
    labId: number;
    name: string;
    description?: string | null;
    iconUrl?: string | null;
}

export interface LabDeletePayload {
    labId: number;
}

export interface RoleCreatePayload {
    labId: number;
    name: string;
    permissions: number;
    /** Optional role rank (default 0). */
    rank?: number;
    color?: string | null;
}

export interface RoleUpdatePayload {
    permissions: number;
    /** Optional new rank for the role. */
    rank?: number;
    /** Optional new name for the role. */
    name?: string;
    /** Optional new color for the role. */
    color?: string | null;
}

export interface MemberAddPayload {
    labId: number;
    userId: number;
    roleId: number | null;
}

export interface MemberRemovePayload {
    labId: number;
    userId: number;
}
