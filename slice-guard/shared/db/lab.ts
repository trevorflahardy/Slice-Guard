export interface Lab {
    id: number;
    owner_id: number;
    name: string;
    description?: string | null;
    icon_url?: string | null;
    /**
     * Identifier of the default role that all members receive when joining
     * this lab.
     */
    default_role_id?: number | null;
    created_at: Date;
}

export interface LabRole {
    id: number;
    lab_id: number;
    name: string;
    permissions: bigint | number;
    color?: string | null;
    /**
     * Role hierarchy rank. Higher value means higher precedence.
     */
    rank: number;
    created_at: Date;
}

export interface LabMember {
    lab_id: number;
    user_id: number;
    /**
     * Full list of roles this member has ordered from highest to lowest
     * hierarchy. An empty array means the member has no explicit roles.
     */
    roles: LabRole[];
    joined_at: Date;
}

export interface LabInvite {
    id: number;
    lab_id: number;
    code: string;
    max_uses: number | null;
    uses: number;
    expires_at: Date | null;
    created_at: Date;
}

export enum LabPermission {
    EDIT_LAB = 1 << 0,
    MANAGE_ROLES = 1 << 1,
    REMOVE_USER = 1 << 2,
    DELETE_LAB = 1 << 3,
    CREATE_REQUEST = 1 << 4,
    MANAGE_REQUESTS = 1 << 5,
    READ = 1 << 6,
    WRITE = 1 << 7,
    CREATE_INVITES = 1 << 8,
    MANAGE_INVITES = 1 << 9,
    /**
     * Grants every permission regardless of explicit role entries.
     */
    ALL = 1 << 30,
}
