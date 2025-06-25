export interface PrintRequest {
    id: number;
    lab_id: number;
    user_id: number;
    description?: string | null;
    file_path: string;
    metadata: unknown;
    created_at: Date;
}

export interface RequestTag {
    id: number;
    lab_id: number;
    name: string;
    is_default: boolean;
    created_at: Date;
}
