export interface Lab {
    id: number;
    owner_id: number;
    name: string;
    description?: string | null;
    image_url?: string | null;
    created_at: Date;
}

export interface LabRole {
    id: number;
    lab_id: number;
    name: string;
    permissions: bigint | number;
    created_at: Date;
}

export interface LabMember {
    lab_id: number;
    user_id: number;
    role_id?: number | null;
    joined_at: Date;
}

export enum LabPermission {
    EDIT_LAB = 1 << 0,
    MANAGE_ROLES = 1 << 1,
    REMOVE_USER = 1 << 2,
    DELETE_LAB = 1 << 3,
    CREATE_REQUEST = 1 << 4,
    READ = 1 << 5,
    WRITE = 1 << 6,
}
