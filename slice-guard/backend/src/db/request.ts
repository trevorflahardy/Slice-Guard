import type { PrintRequest, RequestTag } from "@shared/db/request";
import type { SQL } from "bun";

export interface PrintRequestRow extends PrintRequest { }
export interface RequestTagRow extends RequestTag { }

function normalizeRequest(row: PrintRequestRow): PrintRequestRow {
    return {
        ...row,
        id: Number(row.id),
        lab_id: Number(row.lab_id),
        user_id: Number(row.user_id),
    };
}

function normalizeTag(row: RequestTagRow): RequestTagRow {
    return {
        ...row,
        id: Number(row.id),
        lab_id: Number(row.lab_id),
    };
}

export async function createPrintRequest(
    db: SQL,
    labId: number,
    userId: number,
    fileData: Buffer,
    metadata: unknown,
    description: string | null = null,
): Promise<PrintRequestRow> {
    const rows: PrintRequestRow[] = await db`
        INSERT INTO lab.print_requests (lab_id, user_id, file_data, metadata, description)
             VALUES (${labId}, ${userId}, ${fileData}, ${JSON.stringify(metadata)}, ${description})
        RETURNING id, lab_id, user_id, file_data, metadata, description, is_closed, created_at
    `;
    return normalizeRequest(rows[0]);
}

export async function getUserPrintRequests(
    db: SQL,
    labId: number,
    userId: number
): Promise<PrintRequestRow[]> {
    const rows: PrintRequestRow[] = await db`
        SELECT id, lab_id, user_id, file_data, metadata, description, is_closed, created_at
          FROM lab.print_requests
         WHERE lab_id = ${labId} AND user_id = ${userId}
    `;
    return rows.map(normalizeRequest);
}

export async function createTag(
    db: SQL,
    labId: number,
    name: string,
    isDefault = false
): Promise<RequestTagRow> {
    const rows: RequestTagRow[] = await db`
        INSERT INTO lab.request_tags (lab_id, name, is_default)
             VALUES (${labId}, ${name}, ${isDefault})
        RETURNING id, lab_id, name, is_default, created_at
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
        RETURNING id, lab_id, name, is_default, created_at
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
        SELECT t.id, t.lab_id, t.name, t.is_default, t.created_at
          FROM lab.request_tag_assignments a
          JOIN lab.request_tags t ON a.tag_id = t.id
         WHERE a.request_id = ${requestId}
    `;
    return rows.map(normalizeTag);
}

export async function getAllPrintRequests(
    db: SQL,
    labId: number,
): Promise<PrintRequestRow[]> {
    const rows: PrintRequestRow[] = await db`
        SELECT id, lab_id, user_id, file_data, metadata, description, is_closed, created_at
          FROM lab.print_requests
         WHERE lab_id = ${labId}
    `;
    return rows.map(normalizeRequest);
}

export async function listTags(
    db: SQL,
    labId: number,
): Promise<RequestTagRow[]> {
    const rows: RequestTagRow[] = await db`
        SELECT id, lab_id, name, is_default, created_at
          FROM lab.request_tags
         WHERE lab_id = ${labId}
    `;
    return rows.map(normalizeTag);
}

export async function getPrintRequestById(
    db: SQL,
    requestId: number,
): Promise<PrintRequestRow | null> {
    const rows: PrintRequestRow[] = await db`
        SELECT id, lab_id, user_id, file_data, metadata, description, is_closed, created_at
          FROM lab.print_requests
         WHERE id = ${requestId}
    `;
    return rows[0] ? normalizeRequest(rows[0]) : null;
}

export async function setRequestClosed(
    db: SQL,
    requestId: number,
    isClosed: boolean,
): Promise<PrintRequestRow> {
    const rows: PrintRequestRow[] = await db`
        UPDATE lab.print_requests
           SET is_closed = ${isClosed}
         WHERE id = ${requestId}
        RETURNING id, lab_id, user_id, file_data, metadata, description, is_closed, created_at
    `;
    return normalizeRequest(rows[0]);
}
