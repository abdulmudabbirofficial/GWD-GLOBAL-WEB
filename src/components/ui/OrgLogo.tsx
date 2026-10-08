import Image from 'next/image';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';
import type { Organization } from '@/types/content';
import styles from './OrgLogo.module.css';

/** An organisation's logo in a fixed box (object-fit: contain), or a wordmark fallback. */
export function OrgLogo({ org, className, size = 'md' }: { org: Organization; className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={cn(styles.box, styles[size], className)}>
      {org.logoUrl ? (
        <Image src={org.logoUrl} alt={org.name} fill sizes={size === 'lg' ? '200px' : size === 'md' ? '150px' : '80px'} className={styles.img} />
      ) : org.slug === 'gwd-club' ? (
        <Logo tone="brand" title={org.name} className={styles.gwd} />
      ) : (
        <span className={styles.wordmark}>{org.name}</span>
      )}
    </span>
  );
}
