'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { Button } from '@/components/ui/Button';
import { lenisStore } from '@/features/smooth-scroll/SmoothScroll';
import { TransitionLink } from '@/features/transition/TransitionLink';
import { LocalTime } from '@/components/ui/LocalTime';
import { isActivePath, type NavItem, type PageAction } from '@/lib/site';
import styles from './Menu.module.css';

interface MenuProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
  /** The page's own next step, repeated at the foot of the menu. */
  action: PageAction;
  nav: readonly NavItem[];
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Full-screen dark sheet for phones and tablets. Links rise in one after another. */
export function Menu({ open, onClose, pathname, action, nav }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close whenever the route changes (a link inside the menu was followed).
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname && open) onClose();
    lastPath.current = pathname;
  }, [pathname, open, onClose]);

  useEffect(() => {
    if (!open) return;
    const lenis = lenisStore.get();
    lenis?.stop();
    const root = ref.current!;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    root.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      // Trap focus inside the dialog while it is open.
      const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [open, onClose]);

  return (
    <div
      ref={ref}
      id="site-menu"
      className={styles.menu}
      data-tone="dark"
      data-open={open}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!open}
      inert={!open}
    >
      <div className={styles.body}>
        <nav aria-label="Menu">
          <ol role="list" className={styles.list}>
            {nav.map((item, i) => {
              const current = isActivePath(pathname, item.href);
              return (
                <li key={item.href} style={{ '--i': i } as CSSProperties}>
                  <TransitionLink
                    href={item.href}
                    className={styles.link}
                    aria-current={current ? 'page' : undefined}
                    onClick={() => {
                      if (current) onClose();
                    }}
                  >
                    <span className={styles.num} aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.text}>{item.label}</span>
                  </TransitionLink>
                </li>
              );
            })}
          </ol>
        </nav>
        {/* The action may open a drawer on the same page, so close the menu explicitly. */}
        <div className={styles.foot}>
          <div onClickCapture={onClose}>
            <Button href={action.href} size="lg">
              {action.label}
            </Button>
          </div>
          <p className={styles.meta}>
            <span>Hyderabad, India</span>
            <span>
              <LocalTime timeZone="Asia/Kolkata" /> IST
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
