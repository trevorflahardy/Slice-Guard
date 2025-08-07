import type { Message } from "@shared/db/message";
import type { SQL } from "bun";

export interface MessageRow extends Message {}

/** Convert raw database fields into a typed MessageRow. */
function normalizeMessage(row: MessageRow): MessageRow {
    return {
        ...row,
        id: Number(row.id),
        channel_id: Number(row.channel_id),
        user_id: Number(row.user_id),
    };
}

/** Insert a new message into a channel. */
export async function createMessage(
    db: SQL,
    channelId: number,
    userId: number,
    content: string,
    userMentions: number[] = [],
    roleMentions: number[] = []
): Promise<MessageRow> {
    const rows: MessageRow[] = await db`
        INSERT INTO lab.messages (channel_id, user_id, content, user_mentions, role_mentions)
             VALUES (${channelId}, ${userId}, ${content}, ${userMentions}, ${roleMentions})
        RETURNING id, channel_id, user_id, content, user_mentions, role_mentions, created_at, edited_at
    `;
    return normalizeMessage(rows[0]);
}

/** Update an existing message. */
export async function updateMessage(
    db: SQL,
    messageId: number,
    content: string,
    userMentions: number[] = [],
    roleMentions: number[] = []
): Promise<MessageRow> {
    const rows: MessageRow[] = await db`
        UPDATE lab.messages
           SET content = ${content}, user_mentions = ${userMentions}, role_mentions = ${roleMentions}, edited_at = NOW()
         WHERE id = ${messageId}
        RETURNING id, channel_id, user_id, content, user_mentions, role_mentions, created_at, edited_at
    `;
    return normalizeMessage(rows[0]);
}

/** Remove a message by id. */
export async function deleteMessage(db: SQL, messageId: number): Promise<void> {
    await db`
        DELETE FROM lab.messages
         WHERE id = ${messageId}
    `;
}

/** Retrieve a single message by id. */
export async function getMessage(db: SQL, messageId: number): Promise<MessageRow | null> {
    const rows: MessageRow[] = await db`
        SELECT id, channel_id, user_id, content, user_mentions, role_mentions, created_at, edited_at
          FROM lab.messages WHERE id = ${messageId}
    `;
    return rows.length ? normalizeMessage(rows[0]) : null;
}

/**
 * List messages in a channel ordered from newest to oldest. When `before` is
 * provided only messages with an id lower than the given value are returned,
 * allowing simple pagination on the client.
 */
export async function listMessages(
    db: SQL,
    channelId: number,
    limit: number = 50,
    before?: number
): Promise<MessageRow[]> {
    const rows: MessageRow[] = await db`
        SELECT id, channel_id, user_id, content, user_mentions, role_mentions, created_at, edited_at
          FROM lab.messages
         WHERE channel_id = ${channelId} ${before ? db`AND id < ${before}` : db``}
         ORDER BY id DESC
         LIMIT ${limit}
    `;
    // Return messages in chronological order (oldest first)
    return rows.map(normalizeMessage).reverse();
}
