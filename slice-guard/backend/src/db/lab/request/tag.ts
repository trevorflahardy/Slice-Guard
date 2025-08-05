import type { SQL } from "bun";

import { type RequestTagRow } from ".";

function normalizeTag(row: RequestTagRow): RequestTagRow {
    return {
        ...row,
        id: Number(row.id),
        lab_id: Number(row.lab_id),
    };
}

export async function createTag(
    db: SQL,
    labId: number,
    name: string,
    color: string,
    isDefault = false
): Promise<RequestTagRow> {
    const rows: RequestTagRow[] = await db`
        INSERT INTO lab.request_tags (lab_id, name, color, is_default)
             VALUES (${labId}, ${name}, ${color}, ${isDefault})
        RETURNING id, lab_id, name, color, is_default, created_at
    `;
    return normalizeTag(rows[0]);
}

export async function setTagDefault(
    db: SQL,
    tagId: number,
    isDefault: boolean
): Promise<RequestTagRow> {
    const rows: RequestTagRow[] = await db`
        UPDATE lab.request_tags
           SET is_default = ${isDefault}
         WHERE id = ${tagId}
        RETURNING id, lab_id, name, color, is_default, created_at
    `;
    return normalizeTag(rows[0]);
}

export async function assignTag(
    db: SQL,
    requestId: number,
    tagId: number
): Promise<void> {
    await db`
        INSERT INTO lab.request_tag_assignments (request_id, tag_id)
             VALUES (${requestId}, ${tagId})
        ON CONFLICT DO NOTHING
    `;
}

export async function unassignTag(
    db: SQL,
    requestId: number,
    tagId: number
): Promise<void> {
    await db`
        DELETE FROM lab.request_tag_assignments
         WHERE request_id = ${requestId} AND tag_id = ${tagId}
    `;
}

export async function getTagsForRequest(
    db: SQL,
    requestId: number
): Promise<RequestTagRow[]> {
    const rows: RequestTagRow[] = await db`
        SELECT t.id, t.lab_id, t.name, t.color, t.is_default, t.created_at
          FROM lab.request_tag_assignments a
          JOIN lab.request_tags t ON a.tag_id = t.id
         WHERE a.request_id = ${requestId}
    `;
    return rows.map(normalizeTag);
}

export async function listTags(
    db: SQL,
    labId: number,
): Promise<RequestTagRow[]> {
    const rows: RequestTagRow[] = await db`
        SELECT id, lab_id, name, color, is_default, created_at
          FROM lab.request_tags
         WHERE lab_id = ${labId}
    `;
    return rows.map(normalizeTag);
}