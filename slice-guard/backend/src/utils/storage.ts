import { gzipSync } from "zlib";

export const MAX_UPLOAD_SIZE = 30 * 1024 * 1024; // 30MB

/**
 * Gzips a print request file after validating its size. The compressed data can
 * then be stored directly in the database.
 */
export function compressRequestFile(data: ArrayBuffer | Uint8Array): Buffer {
    if (data.byteLength > MAX_UPLOAD_SIZE) {
        throw new Error('File exceeds maximum allowed size');
    }
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    return gzipSync(bytes);
}
