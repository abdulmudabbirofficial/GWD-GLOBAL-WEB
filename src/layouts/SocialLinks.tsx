'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { INSTAGRAM, LINKEDIN } from '@/components/brand/social-glyphs';
import type { DocOf } from '@/content/copy';
import { pageSocial } from '@/lib/site';
import styles from './SocialLinks.module.css';

const safe = (u: string | undefined) => {
  const v = u?.trim();
  return v && /^https:\/\/[^\s<>"']+$/.test(v) ? v : null;
};

/** "@gwdsports.in" from an Instagram profile link; null for anything else. */
const handle = (href: string) => {
  try {
    const u = new URL(href);
    const name = u.pathname.split('/').filter(Boolean)[0];
    return u.hostname.endsWith('instagram.com') && name ? `@${name}` : null;
  } catch {
    return null;
  }
};

/**
 * The page's own Instagram and LinkedIn as two small marks: a quiet dock in
 * the corner while reading (it steps aside once the footer, which carries the
 * same marks, comes into view), and a pair in the footer. Each page points to
 * its own accounts, edited in the admin (global.social).
 */
export function SocialLinks({ social, variant }: { social: DocOf<'global.social'>; variant: 'dock' | 'inline' }) {
  const pathname = usePathname();
  const links = pageSocial(pathname, social);
  const [away, setAway] = useState(false);

  useEffect(() => {
    if (variant !== 'dock') return;
    const footer = document.querySelector('footer');
    if (!footer) return;
    const io = new IntersectionObserver(([e]) => setAway(Boolean(e?.isIntersecting)), { rootMargin: '0px 0px -8% 0px' });
    io.observe(footer);
    return () => io.disconnect();
  }, [variant, pathname]);

  const items = [
    { key: 'instagram', name: 'Instagram', href: safe(links.instagramUrl), glyph: INSTAGRAM },
    { key: 'linkedin', name: 'LinkedIn', href: safe(links.linkedinUrl), glyph: LINKEDIN },
  ].flatMap((i) => (i.href ? [{ ...i, href: i.href, tip: handle(i.href) ?? 'GWD Global' }] : []));
  if (!items.length) return null;

  return (
    <ul role="list" aria-label="GWD on social media" className={variant === 'dock' ? styles.dock : styles.inline} data-away={away || undefined}>
      {items.map((i) => (
        <li key={i.key}>
          <a
            href={i.href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.icon}
            aria-label={`${i.tip} on ${i.name} (opens in a new tab)`}
            data-cta={`social-${i.key}`}
            data-cta-label={`${i.name} ${i.tip}`}
          >
            <svg viewBox={i.glyph.viewBox} aria-hidden="true" focusable="false">
              <path d={i.glyph.path} />
            </svg>
            <span className={styles.tip} aria-hidden="true">
              {i.tip}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
