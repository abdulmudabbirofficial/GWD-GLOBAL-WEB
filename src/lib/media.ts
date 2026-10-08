import renders from '@/content/renders.json';

type RenderMeta = { file?: string; width: number; height: number; blur: string; alpha?: boolean };
const RENDERS = renders as Record<string, RenderMeta>;

/** Images the admin uploaded in place of a render (set once on the client by <ImageOverrides>). */
export type RenderOverride = { url: string; width: number; height: number; alt?: string };
let OVERRIDES: Record<string, RenderOverride> = {};
export function setRenderOverrides(map: Record<string, RenderOverride>) {
  OVERRIDES = map;
}

/**
 * Published media carry a content hash in their file names (scripts/media/
 * versioned.py), so a re-published image always loads fresh. These helpers
 * turn a render's name into its current URL, or the admin's replacement.
 */
export function renderUrl(name: string, small = false) {
  const o = OVERRIDES[name];
  if (o) return o.url;
  const stem = RENDERS[name]?.file ?? name;
  return `/media/renders/${stem}${small ? '-sm' : ''}.webp`;
}

/** The small variant of any versioned /media image (`x.webp` → `x-sm.webp`). Uploaded media have none. */
export function smallVariant(url: string) {
  return url.startsWith('/media/') && url.endsWith('.webp') && !url.endsWith('-sm.webp') ? url.replace(/\.webp$/, '-sm.webp') : url;
}
