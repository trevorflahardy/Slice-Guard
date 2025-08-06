import type { PrintRequest, RequestTag } from "@shared/db/request";
import type { SQL } from "bun";

export interface PrintRequestRow extends PrintRequest { }
export interface RequestTagRow extends RequestTag { }

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
    userId: number
): Promise<PrintRequestRow[]> {
    const rows: PrintRequestRow[] = await db`
        SELECT id, lab_id, user_id, title, file_data, metadata, description, is_closed, created_at
          FROM lab.print_requests
         WHERE lab_id = ${labId} AND user_id = ${userId}
    `;
    return rows.map(normalizeRequest);
}

export async function getAllPrintRequests(
    db: SQL,
    labId: number,
): Promise<PrintRequestRow[]> {
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

export async function deletePrintRequest(
    db: SQL,
    requestId: number,
): Promise<void> {
    await db`
        DELETE FROM lab.print_requests
         WHERE id = ${requestId}
    `;
}
