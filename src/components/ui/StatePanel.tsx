import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './StatePanel.module.css';

interface StatePanelProps {
  code: string;
  title: ReactNode;
  body: ReactNode;
  actions: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Shared composition for 404 and error screens: an oversized code framed by
 * the brand brackets, a plain explanation, and clear ways forward.
 */
export function StatePanel({ code, title, body, actions, footer, className }: StatePanelProps) {
  return (
    <section className={cn(styles.panel, className)}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.code} aria-hidden="true">
          <span className={styles.bracketBl} />
          {code}
          <span className={styles.bracketTr} />
        </p>
        <div className={styles.copy}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.body}>{body}</div>
          <div className={styles.actions}>{actions}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </div>
    </section>
  );
}
