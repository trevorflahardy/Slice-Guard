export interface PrintRequest {
    id: number;
    lab_id: number;
    user_id: number;
    title?: string | null;
    description?: string | null;
    file_data: Uint8Array;
    metadata: unknown;
    is_closed: boolean;
    created_at: Date;
}

export interface RequestTag {
    id: number;
    lab_id: number;
    name: string;
    color: string;
    is_default: boolean;
    created_at: Date;
}
