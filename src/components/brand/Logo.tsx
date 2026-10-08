import { cn } from '@/lib/utils';
import { MARK, MARK_VIEWBOX } from './mark';
import styles from './Logo.module.css';

interface LogoProps {
  className?: string;
  /** Kept for older call sites: the logo always renders in its exact brand colours. */
  tone?: 'brand' | 'inverse';
  /** Accessible name; pass null when the logo is decorative inside a labelled link. */
  title?: string | null;
}

export function Logo({ className, tone = 'brand', title = 'GWD, Get Work Done' }: LogoProps) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      className={cn(styles.logo, styles[tone], className)}
      role={title ? 'img' : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <g className={styles.bracketBl}>
        <path d={MARK.brackets.bottomLeft} />
      </g>
      <g className={styles.bracketTr}>
        <path d={MARK.brackets.topRight} />
      </g>
      <g className={styles.letters}>
        <path d={MARK.letters.g} />
        <path d={MARK.letters.w} />
        <path d={MARK.letters.d} />
      </g>
    </svg>
  );
}
