'use client';

import Image from 'next/image';
import manifest from '@/content/renders.json';
import { useRenderOverride } from '@/features/media/ImageOverrides';
import { renderUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import styles from './Render.module.css';

export type RenderName = keyof typeof manifest;

export const renderMeta = (name: string) => (manifest as Record<string, (typeof manifest)[RenderName]>)[name];

interface RenderProps {
  name: RenderName | string;
  alt: string;
  /** Responsive sizes hint for next/image. */
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Fill the parent box (object-fit cover) instead of keeping the image's own ratio. */
  fill?: boolean;
}

/**
 * One of the path-traced studio renders (scripts/render), served through
 * next/image (with a blur placeholder unless it is a cut-out), or the image
 * the admin uploaded in its place. Unknown names render nothing.
 */
export function Render({ name, alt, sizes, priority, className, fill }: RenderProps) {
  const meta = renderMeta(name);
  const override = useRenderOverride(name);
  if (override) {
    const common = { src: override.url, sizes, priority, quality: 90 };
    return fill ? (
      <Image {...common} alt={override.alt || alt} fill className={cn(styles.img, styles.fill, className)} />
    ) : (
      <Image {...common} alt={override.alt || alt} width={override.width} height={override.height} className={cn(styles.img, className)} />
    );
  }
  if (!meta) return null;
  // Cut-out (alpha) dioramas skip the blur placeholder: blurred, it reads as a white cloud.
  const cutout = 'alpha' in meta && meta.alpha;
  const common = {
    src: renderUrl(name),
    sizes,
    priority,
    quality: 90,
    ...(cutout ? { placeholder: 'empty' as const } : { placeholder: 'blur' as const, blurDataURL: meta.blur }),
  };
  return fill ? (
    <Image {...common} alt={alt} fill className={cn(styles.img, styles.fill, className)} />
  ) : (
    <Image {...common} alt={alt} width={meta.width} height={meta.height} className={cn(styles.img, className)} />
  );
}
