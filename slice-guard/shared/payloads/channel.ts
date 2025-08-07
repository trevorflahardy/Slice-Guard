// Shared request/response payloads for channel and message operations
import type { ChannelType } from '../db/channel';

/** Payload for creating a channel. */
export interface ChannelCreatePayload {
    type: ChannelType;
    name: string;
    position: number;
    categoryId?: number | null;
    description?: string | null;
    requestId?: number | null;
}

/** Payload for updating a channel. */
export interface ChannelUpdatePayload {
    name: string;
    description?: string | null;
    categoryId?: number | null;
}

/** Payload for setting a channel's position. */
export interface ChannelPositionPayload {
    position: number;
}

/** Payload for creating a message. */
export interface MessageCreatePayload {
    content: string;
    userMentions?: number[];
    roleMentions?: number[];
}

/** Payload for updating a message. */
export interface MessageUpdatePayload {
    content: string;
    userMentions?: number[];
    roleMentions?: number[];
}
