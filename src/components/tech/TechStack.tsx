import type { CSSProperties } from 'react';
import brands from '@/content/tech-brands.json';
import { technologyByKey, type Technology } from '@/content/technologies';
import { cn } from '@/lib/utils';
import { LogoGate } from './LogoGate';
import styles from './TechStack.module.css';

const brandHex = brands as Record<string, string>;

/** Brand colours too dark or too light to read on either theme fall back to the text colour. */
function readableBrand(hex: string | undefined) {
  if (!hex) return null;
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return luminance > 0.045 && luminance < 0.8 ? hex : null;
}

const monogram = (name: string) =>
  name
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * A spec-sheet grid of the tools behind a practice: monochrome logos that
 * take their brand colour on hover, always with the name beside them.
 */
export function TechStack({ keys, className, compact = false }: { keys: string[]; className?: string; compact?: boolean }) {
  const items = keys.map((k) => technologyByKey.get(k)).filter((t): t is Technology => Boolean(t));
  if (!items.length) return null;
  return (
    <LogoGate>
      <ul role="list" className={cn(styles.grid, compact && styles.compact, className)}>
        {items.map((t) => {
          const style = {
            '--brand': readableBrand(brandHex[t.key]) ?? 'var(--fg)',
            ...(t.icon ? { '--icon': `url(/tech/${t.key}.svg)` } : {}),
          } as CSSProperties;
          return (
            <li key={t.key} className={styles.item} style={style} title={compact ? t.name : undefined}>
              {t.icon ? (
                <span className={styles.logo} aria-hidden="true" />
              ) : (
                <span className={styles.monogram} aria-hidden="true">
                  {monogram(t.name)}
                </span>
              )}
              <span className={styles.name}>{t.name}</span>
            </li>
          );
        })}
      </ul>
    </LogoGate>
  );
}
