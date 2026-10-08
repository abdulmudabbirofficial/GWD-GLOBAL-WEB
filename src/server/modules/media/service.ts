import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { env } from '@/server/config/env';
import { getDb, schema } from '@/server/db/client';
import { AppError, notFound } from '@/server/lib/errors';
import { readDimensions, sniffImage } from './sniff';
import { storage } from './storage';

export async function uploadImage(file: File, alt: string, userId: string) {
  const maxBytes = env().MAX_UPLOAD_MB * 1024 * 1024;
  if (file.size === 0) throw new AppError('BAD_REQUEST', 'The file is empty.');
  if (file.size > maxBytes) throw new AppError('PAYLOAD_TOO_LARGE', `Images must be ${env().MAX_UPLOAD_MB}MB or smaller.`);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) throw new AppError('UNSUPPORTED_MEDIA_TYPE', 'Upload a PNG, JPEG, WebP, AVIF or GIF image.');

  const id = randomUUID();
  const storageKey = `${id}.${type.ext}`;
  await storage.put(storageKey, bytes);

  const dims = readDimensions(bytes, type.mime);
  const originalName = file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 255) || 'upload';

  try {
    const [row] = await getDb()
      .insert(schema.mediaAssets)
      .values({
        id,
        storageKey,
        originalName,
        mimeType: type.mime,
        sizeBytes: bytes.byteLength,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        alt: alt.trim().slice(0, 300),
        uploadedBy: userId,
      })
      .returning();
    return { ...row!, url: `/api/v1/media/${id}` };
  } catch (error) {
    await storage.remove(storageKey);
    throw error;
  }
}

export async function listMedia(limit = 100) {
  const rows = await getDb().select().from(schema.mediaAssets).orderBy(desc(schema.mediaAssets.createdAt)).limit(limit);
  return rows.map((r) => ({ ...r, url: `/api/v1/media/${r.id}` }));
}

export async function readMedia(id: string) {
  const [row] = await getDb().select().from(schema.mediaAssets).where(eq(schema.mediaAssets.id, id));
  if (!row) throw notFound('Media');
  const data = await storage.get(row.storageKey);
  if (!data) throw notFound('Media');
  return { row, data };
}
