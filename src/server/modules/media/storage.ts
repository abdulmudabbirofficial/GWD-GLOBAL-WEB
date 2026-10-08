import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '@/server/config/env';

/**
 * Storage driver contract. The local driver writes outside /public so files
 * are only ever served through the media route (with safe headers). Swap in an
 * S3/R2 implementation for multi-instance or serverless deployments.
 */
export interface MediaStorage {
  put(key: string, data: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
}

const SAFE_KEY = /^[a-f0-9-]{36}\.(png|jpg|webp|avif|gif)$/;

function resolveKey(key: string): string {
  // Keys are generated server-side, but validate anyway: no path traversal, ever.
  if (!SAFE_KEY.test(key)) throw new Error('Invalid storage key');
  // Uploads are runtime data, not deployable code: exclude this path from build-time file tracing.
  return path.join(/* turbopackIgnore: true */ process.cwd(), env().MEDIA_STORAGE_DIR, key);
}

export const localDiskStorage: MediaStorage = {
  async put(key, data) {
    const file = resolveKey(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, data, { flag: 'wx' });
  },
  async get(key) {
    try {
      return new Uint8Array(await readFile(resolveKey(key)));
    } catch {
      return null;
    }
  },
  async remove(key) {
    await rm(resolveKey(key), { force: true });
  },
};

export const storage: MediaStorage = localDiskStorage;
