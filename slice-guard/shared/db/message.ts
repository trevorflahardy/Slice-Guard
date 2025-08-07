export interface Message {
    id: number;
    channel_id: number;
    user_id: number;
    content: string;
    /** List of user identifiers mentioned in this message. */
    user_mentions: number[];
    /** List of role identifiers mentioned in this message. */
    role_mentions: number[];
    created_at: Date;
    edited_at: Date | null;
}
