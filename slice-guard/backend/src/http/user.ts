import { withAuth } from "./middleware";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { setAvatarUrl, findPublicUserById, setName } from "../db/user";
import type State from "../utils/state";
import { WsEvent } from "@shared/payloads/ws";

const client = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY as string,
        secretAccessKey: process.env.S3_SECRET_KEY as string,
    },
});

export const uploadAvatar = withAuth(async (req, userId, state, params) => {
    const id = Number(params.id);
    if (userId !== id) {
        return new Response("Unauthorized", { status: 403 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
        return new Response("No file", { status: 400 });
    }

    const key = `avatars/${id}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await client.send(
        new PutObjectCommand({
            Bucket: process.env.S3_BUCKET as string,
            Key: key,
            Body: buffer,
            ContentType: file.type || "application/octet-stream",
        })
    );
    const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT;
    const url = `${publicEndpoint}/${process.env.S3_BUCKET}/${key}`;
    const user = await setAvatarUrl(state.db, id, url);
    state.broadcast({ op: WsEvent.USER_UPDATED, d: { user } });
    return Response.json(user);
});

export async function getAvatar(
    _req: Request,
    state: State,
    params: Record<string, string>
): Promise<Response> {
    const id = Number(params.id);
    const user = await findPublicUserById(state.db, id);
    if (!user) return new Response("Not found", { status: 404 });
    return Response.json({ avatar_url: user.avatar_url });
}

/**
 * PATCH /api/users/:id
 */
export const update = withAuth(async (req, userId, state, params) => {
    const id = Number(params.id);
    if (userId !== id) return new Response('Unauthorized', { status: 403 });
    const { name } = await req.json() as { name: string };
    const user = await setName(state.db, id, name);
    state.broadcast({ op: WsEvent.USER_UPDATED, d: { user } });
    return Response.json(user);
});
