import type { PrintRequest, RequestTag } from "@shared/db/request";
import type { SQL } from "bun";

export interface PrintRequestRow extends PrintRequest { }
export interface RequestTagRow extends RequestTag { }

export async function createPrintRequest(
    db: SQL,
    labId: number,
    userId: number,
    filePath: string,
    metadata: unknown,
    description: string | null = null,
): Promise<PrintRequestRow> {
    const [row] = await db.query<PrintRequestRow>(
        `INSERT INTO lab.print_requests (lab_id, user_id, file_path, metadata, description)
           VALUES ($1, $2, $3, $4, $5)
        RETURNING id, lab_id, user_id, file_path, metadata, description, created_at`,
        [labId, userId, filePath, JSON.stringify(metadata), description]
    );
    return row;
}

export async function getUserPrintRequests(
    db: SQL,
    labId: number,
    userId: number
): Promise<PrintRequestRow[]> {
    return db.query<PrintRequestRow>(
        `SELECT id, lab_id, user_id, file_path, metadata, description, created_at
           FROM lab.print_requests
          WHERE lab_id = $1 AND user_id = $2`,
        [labId, userId]
    );
}

export async function createTag(
    db: SQL,
    labId: number,
    name: string,
    isDefault = false
): Promise<RequestTagRow> {
    const [row] = await db.query<RequestTagRow>(
        `INSERT INTO lab.request_tags (lab_id, name, is_default)
           VALUES ($1, $2, $3)
        RETURNING id, lab_id, name, is_default, created_at`,
        [labId, name, isDefault]
    );
    return row;
}

export async function setTagDefault(
    db: SQL,
    tagId: number,
    isDefault: boolean
): Promise<RequestTagRow> {
    const [row] = await db.query<RequestTagRow>(
        `UPDATE lab.request_tags
            SET is_default = $2
          WHERE id = $1
        RETURNING id, lab_id, name, is_default, created_at`,
        [tagId, isDefault]
    );
    return row;
}

export async function assignTag(
    db: SQL,
    requestId: number,
    tagId: number
): Promise<void> {
    await db.run(
        `INSERT INTO lab.request_tag_assignments (request_id, tag_id)
           VALUES ($1, $2)
        ON CONFLICT DO NOTHING`,
        [requestId, tagId]
    );
}

export async function unassignTag(
    db: SQL,
    requestId: number,
    tagId: number
): Promise<void> {
    await db.run(
        `DELETE FROM lab.request_tag_assignments
          WHERE request_id = $1 AND tag_id = $2`,
        [requestId, tagId]
    );
}

export async function getTagsForRequest(
    db: SQL,
    requestId: number
): Promise<RequestTagRow[]> {
    return db.query<RequestTagRow>(
        `SELECT t.id, t.lab_id, t.name, t.is_default, t.created_at
           FROM lab.request_tag_assignments a
           JOIN lab.request_tags t ON a.tag_id = t.id
          WHERE a.request_id = $1`,
        [requestId]
    );
}
