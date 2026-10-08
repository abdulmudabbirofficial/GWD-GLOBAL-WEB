/**
 * Replacement images for the studio renders, stored in site settings as
 * `image:<render name>`. Only uploaded media (or published /media files) are
 * accepted, never an arbitrary URL.
 */
export const IMAGE_PREFIX = 'image:';

export interface ImageOverride {
  url: string;
  width: number;
  height: number;
  alt?: string;
}

const MEDIA_URL = /^\/api\/v1\/media\/[0-9a-f-]{36}$|^\/media\/[\w./-]+\.(webp|png|jpe?g|avif)$/;

export function isImageOverride(v: unknown): v is ImageOverride {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.url === 'string' &&
    MEDIA_URL.test(o.url) &&
    !o.url.includes('..') &&
    typeof o.width === 'number' &&
    typeof o.height === 'number' &&
    o.width > 0 &&
    o.height > 0 &&
    o.width < 20000 &&
    o.height < 20000 &&
    (o.alt === undefined || typeof o.alt === 'string')
  );
}

/** Picks the image overrides out of the settings map. */
export function imageOverrides(settings: Record<string, unknown>): Record<string, ImageOverride> {
  const out: Record<string, ImageOverride> = {};
  for (const [k, v] of Object.entries(settings)) {
    if (k.startsWith(IMAGE_PREFIX) && isImageOverride(v)) out[k.slice(IMAGE_PREFIX.length)] = v;
  }
  return out;
}
