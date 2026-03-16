import type { PrintRequest, RequestTag } from '@shared/db/request';
import type { SQL } from 'bun';

export interface PrintRequestRow extends PrintRequest {}
export interface RequestTagRow extends RequestTag {}

export * from './tag';

function normalizeRequest(row: PrintRequestRow): PrintRequestRow {
    return {
        ...row,
        id: Number(row.id),
        lab_id: Number(row.lab_id),
        user_id: Number(row.user_id),
    };
}

export async function createPrintRequest(
    db: SQL,
    labId: number,
    userId: number,
    fileData: Buffer,
    metadata: unknown,
    title: string,
    description: string | null = null,
): Promise<PrintRequestRow> {
    const rows: PrintRequestRow[] = await db`
        INSERT INTO lab.print_requests (lab_id, user_id, title, file_data, metadata, description)
             VALUES (${labId}, ${userId}, ${title}, ${fileData}, ${JSON.stringify(metadata)}, ${description})
        RETURNING id, lab_id, user_id, title, file_data, metadata, description, is_closed, created_at
    `;
    return normalizeRequest(rows[0]);
}

export async function getUserPrintRequests(
    db: SQL,
    labId: number,
    userId: number,
): Promise<PrintRequestRow[]> {
    const rows: PrintRequestRow[] = await db`
        SELECT id, lab_id, user_id, title, file_data, metadata, description, is_closed, created_at
          FROM lab.print_requests
         WHERE lab_id = ${labId} AND user_id = ${userId}
    `;
    return rows.map(normalizeRequest);
}

export async function getAllPrintRequests(db: SQL, labId: number): Promise<PrintRequestRow[]> {
    const rows: PrintRequestRow[] = await db`
        SELECT id, lab_id, user_id, title, file_data, metadata, description, is_closed, created_at
          FROM lab.print_requests
         WHERE lab_id = ${labId}
    `;
    return rows.map(normalizeRequest);
}

export async function getPrintRequestById(
    db: SQL,
    requestId: number,
): Promise<PrintRequestRow | null> {
    const rows: PrintRequestRow[] = await db`
        SELECT id, lab_id, user_id, title, file_data, metadata, description, is_closed, created_at
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
        RETURNING id, lab_id, user_id, title, file_data, metadata, description, is_closed, created_at
    `;
    return normalizeRequest(rows[0]);
}

export async function deletePrintRequest(db: SQL, requestId: number): Promise<void> {
    await db`
        DELETE FROM lab.print_requests
         WHERE id = ${requestId}
    `;
}

/**
 * Get all print requests for a lab with their tags and user info in batch.
 * Avoids N+1 queries when listing requests.
 */
export async function getRequestsWithDetails(
    db: SQL,
    labId: number,
): Promise<{ request: PrintRequestRow; user: { id: number; name: string; email: string; avatar_url: string | null; created_at: Date } | null; tags: RequestTagRow[] }[]> {
    // Get all requests with user info
    const requestUsers = await db`
        SELECT r.id, r.lab_id, r.user_id, r.title, r.file_data, r.metadata, r.description, r.is_closed, r.created_at,
               u.id AS u_id, u.name AS u_name, u.email AS u_email, u.avatar_url AS u_avatar_url, u.created_at AS u_created_at
          FROM lab.print_requests r
          LEFT JOIN auth.users u ON u.id = r.user_id
         WHERE r.lab_id = ${labId}
    `;

    if (requestUsers.length === 0) {
        return [];
    }

    const requestIds = (requestUsers as any[]).map((r) => r.id);

    // Get all tag assignments for these requests in one query
    const allTags = await db`
        SELECT rta.request_id, rt.id, rt.lab_id, rt.name, rt.color, rt.is_default, rt.created_at
          FROM lab.request_tag_assignments rta
          JOIN lab.request_tags rt ON rta.tag_id = rt.id
         WHERE rta.request_id = ANY(${requestIds})
    `;

    // Group tags by request_id
    const tagsByRequest = new Map<number, RequestTagRow[]>();
    for (const t of allTags as any[]) {
        const reqId = Number(t.request_id);
        if (!tagsByRequest.has(reqId)) {
            tagsByRequest.set(reqId, []);
        }
        tagsByRequest.get(reqId)!.push({
            id: t.id,
            lab_id: t.lab_id,
            name: t.name,
            color: t.color,
            is_default: t.is_default,
            created_at: t.created_at,
        });
    }

    return (requestUsers as any[]).map((row) => ({
        request: normalizeRequest({
            id: row.id,
            lab_id: row.lab_id,
            user_id: row.user_id,
            title: row.title,
            file_data: row.file_data,
            metadata: row.metadata,
            description: row.description,
            is_closed: row.is_closed,
            created_at: row.created_at,
        } as PrintRequestRow),
        user: row.u_id ? {
            id: row.u_id,
            name: row.u_name,
            email: row.u_email,
            avatar_url: row.u_avatar_url,
            created_at: row.u_created_at,
        } : null,
        tags: tagsByRequest.get(Number(row.id)) || [],
    }));
}
