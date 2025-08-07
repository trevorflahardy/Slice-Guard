export enum ChannelType {
    TEXT = "text",
    CATEGORY = "category",
}

export interface Channel {
    id: number;
    type: ChannelType;
    /** Identifier of the category this channel belongs to. */
    category_id: number | null;
    /** Identifier of the lab this channel belongs to. Null for DMs. */
    lab_id: number | null;
    name: string;
    description: string | null;
    /** Optional request this channel is associated with. */
    request_id: number | null;
    /** Position of this channel in the sidebar UI. */
    position: number;
    created_at: Date;
}
