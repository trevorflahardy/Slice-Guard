import { promises as fs } from "fs";
import { gzipSync } from "zlib";

export const MAX_UPLOAD_SIZE = 30 * 1024 * 1024; // 30MB

/**
 * Saves a print request file to the uploads directory. The file is gzipped to
 * reduce disk usage. Returns the path to the stored file.
 */
export async function saveRequestFile(labId: number, data: ArrayBuffer | Uint8Array): Promise<string> {
    if (data.byteLength > MAX_UPLOAD_SIZE) {
        throw new Error('File exceeds maximum allowed size');
    }
    const dir = `./uploads/${labId}`;
    await fs.mkdir(dir, { recursive: true });
    const name = `${crypto.randomUUID()}.3mf.gz`;
    const path = `${dir}/${name}`;
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const compressed = gzipSync(bytes);
    await fs.writeFile(path, compressed);
    return path;
}
