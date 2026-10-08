import 'server-only';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { COPY, COPY_PAGES } from '@/content/copy';
import { validateCopy } from '@/content/copy/conform';
import renders from '@/content/renders.json';
import { getDb, schema } from '@/server/db/client';
import { AppError, notFound } from '@/server/lib/errors';
import { IMAGE_PREFIX, isImageOverride, type ImageOverride } from './image-overrides';

/*
 * Site settings: the admin's overrides for every piece of copy in the
 * registry (src/content/copy) and for every studio render (image:<name>).
 * Each value is validated against its field before it is stored, and a save
 * regenerates the whole site, since copy can appear on any page.
 */

const RENDER_NAMES = new Set(Object.keys(renders));

export function isSettingKey(key: string) {
  return key in COPY || (key.startsWith(IMAGE_PREFIX) && RENDER_NAMES.has(key.slice(IMAGE_PREFIX.length)));
}

function validate(key: string, value: unknown): unknown {
  if (key in COPY) {
    const r = validateCopy(COPY[key as keyof typeof COPY], value);
    if (!r.ok) throw new AppError('VALIDATION_FAILED', r.message);
    return r.value;
  }
  if (key.startsWith(IMAGE_PREFIX) && RENDER_NAMES.has(key.slice(IMAGE_PREFIX.length))) {
    if (!isImageOverride(value)) throw new AppError('VALIDATION_FAILED', 'Choose an uploaded image.');
    const v = value as ImageOverride;
    return { url: v.url, width: Math.round(v.width), height: Math.round(v.height), ...(v.alt ? { alt: v.alt.slice(0, 300) } : {}) };
  }
  throw notFound('Setting');
}

/** The registry (fields with their defaults) plus what the admin has changed. */
export async function settingsOverview() {
  const rows = await getDb()
    .select({ key: schema.siteSettings.key, value: schema.siteSettings.value, updatedAt: schema.siteSettings.updatedAt, by: schema.users.name })
    .from(schema.siteSettings)
    .leftJoin(schema.users, eq(schema.users.id, schema.siteSettings.updatedBy));
  const overrides: Record<string, { value: unknown; updatedAt: Date; by: string | null }> = {};
  for (const r of rows) if (isSettingKey(r.key)) overrides[r.key] = { value: r.value, updatedAt: r.updatedAt, by: r.by };
  const fields = Object.entries(COPY).map(([key, f]) => ({ key, ...f }));
  const images = Object.entries(renders).map(([name, m]) => ({
    name,
    url: `/media/renders/${(m as { file?: string }).file ?? name}.webp`,
    width: m.width,
    height: m.height,
  }));
  return { pages: COPY_PAGES, fields, images, overrides };
}

export async function saveSetting(key: string, value: unknown, userId: string) {
  const clean = validate(key, value);
  await getDb()
    .insert(schema.siteSettings)
    .values({ key, value: clean, updatedBy: userId, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.siteSettings.key, set: { value: clean, updatedBy: userId, updatedAt: new Date() } });
  revalidatePath('/', 'layout');
  return { key, value: clean };
}

export async function resetSetting(key: string) {
  if (!isSettingKey(key)) throw notFound('Setting');
  await getDb().delete(schema.siteSettings).where(eq(schema.siteSettings.key, key));
  revalidatePath('/', 'layout');
  return { key, reset: true };
}
