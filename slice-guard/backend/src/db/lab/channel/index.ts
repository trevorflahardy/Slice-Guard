import type { Channel, ChannelType } from "@shared/db/channel";
import type { SQL } from "bun";

export interface ChannelRow extends Channel {}

/** Normalize raw database values into a ChannelRow. */
function normalizeChannel(row: ChannelRow): ChannelRow {
    return {
        ...row,
        id: Number(row.id),
        category_id: row.category_id === null ? null : Number(row.category_id),
        lab_id: row.lab_id === null ? null : Number(row.lab_id),
        request_id: row.request_id === null ? null : Number(row.request_id),
        position: Number(row.position),
    };
}

/** Create a new channel entry. */
export async function createChannel(
    db: SQL,
    type: ChannelType,
    name: string,
    position: number,
    labId: number | null = null,
    categoryId: number | null = null,
    description: string | null = null,
    requestId: number | null = null
): Promise<ChannelRow> {
    const rows: ChannelRow[] = await db`
        INSERT INTO lab.channels (type, category_id, lab_id, name, description, request_id, position)
             VALUES (${type}, ${categoryId}, ${labId}, ${name}, ${description}, ${requestId}, ${position})
        RETURNING id, type, category_id, lab_id, name, description, request_id, position, created_at
    `;
    return normalizeChannel(rows[0]);
}

/** Retrieve all channels for the given lab (or DM when labId is null). */
export async function listChannels(
    db: SQL,
    labId: number | null
): Promise<ChannelRow[]> {
    const rows: ChannelRow[] = await db`
        SELECT id, type, category_id, lab_id, name, description, request_id, position, created_at
          FROM lab.channels
         WHERE lab_id IS NOT DISTINCT FROM ${labId}
         ORDER BY position ASC
    `;
    return rows.map(normalizeChannel);
}

/** Fetch a single channel by id. */
export async function getChannel(db: SQL, channelId: number): Promise<ChannelRow | null> {
    const rows: ChannelRow[] = await db`
        SELECT id, type, category_id, lab_id, name, description, request_id, position, created_at
          FROM lab.channels
         WHERE id = ${channelId}
    `;
    return rows.length ? normalizeChannel(rows[0]) : null;
}

/** Update basic channel fields. */
export async function updateChannel(
    db: SQL,
    channelId: number,
    name: string,
    description: string | null,
    categoryId: number | null
): Promise<ChannelRow> {
    const rows: ChannelRow[] = await db`
        UPDATE lab.channels
           SET name = ${name}, description = ${description}, category_id = ${categoryId}
         WHERE id = ${channelId}
        RETURNING id, type, category_id, lab_id, name, description, request_id, position, created_at
    `;
    return normalizeChannel(rows[0]);
}

/** Update the ordering position for a channel. */
export async function setChannelPosition(
    db: SQL,
    channelId: number,
    position: number
): Promise<ChannelRow> {
    const rows: ChannelRow[] = await db`
        UPDATE lab.channels
           SET position = ${position}
         WHERE id = ${channelId}
        RETURNING id, type, category_id, lab_id, name, description, request_id, position, created_at
    `;
    return normalizeChannel(rows[0]);
}

/** Delete a channel permanently. */
export async function deleteChannel(db: SQL, channelId: number): Promise<void> {
    await db`
        DELETE FROM lab.channels
         WHERE id = ${channelId}
    `;
}
