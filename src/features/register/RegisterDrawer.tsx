'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { lenisStore } from '@/features/smooth-scroll/SmoothScroll';
import { REGISTER_PARAM, intentByKey, type Intent } from './intents';
import { RegisterForm } from './RegisterForm';
import styles from './RegisterDrawer.module.css';

interface Practice {
  slug: string;
  name: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The registration drawer, available on every page. It opens whenever the
 * URL carries `?register=<intent>` (so every "ways in" button is a real,
 * shareable link) and closes back to the page the visitor was reading.
 */
export function RegisterDrawer({ practices }: { practices: Practice[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const intent = intentByKey(params.get(REGISTER_PARAM));
  const open = Boolean(intent);

  // Keep the last intent rendered while the drawer slides closed.
  const [shown, setShown] = useState<Intent | undefined>(intent);
  if (intent && intent !== shown) setShown(intent);

  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    // Opened from a button on this page: step back, so history stays clean.
    if ((window.history.state as { inPage?: boolean } | null)?.inPage) {
      window.history.back();
      return;
    }
    // Arrived on a shared ?register= link: drop the parameters in place.
    const next = new URLSearchParams(params.toString());
    next.delete(REGISTER_PARAM);
    next.delete('service');
    const query = next.toString();
    window.history.replaceState(null, '', pathname + (query ? `?${query}` : '') + window.location.hash);
  }, [params, pathname]);

  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const lenis = lenisStore.get();
    lenis?.stop();
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const panel = panelRef.current!;
    // Focus the first field once the panel has started moving in.
    const t = window.setTimeout(() => panel.querySelector<HTMLElement>('input, select, textarea')?.focus({ preventScroll: true }), 120);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.closest('[aria-hidden="true"]'));
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
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = previousOverflow;
      lenis?.start();
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, close]);

  const serviceSlug = params.get('service');
  const preselected = practices.find((p) => p.slug === serviceSlug)?.name;

  return (
    <div className={styles.root} data-register data-open={open} aria-hidden={!open} inert={!open}>
      <button type="button" className={styles.scrim} tabIndex={-1} aria-label="Close" onClick={close} />
      <div ref={panelRef} className={styles.panel} data-theme="day" role="dialog" aria-modal="true" aria-labelledby="register-title">
        {shown && (
          <>
            <div className={styles.head}>
              <p className={styles.audience}>{shown.audience}</p>
              <button type="button" className={styles.close} onClick={close} aria-label="Close">
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
                </svg>
              </button>
            </div>
            <h2 id="register-title" className={styles.title}>
              {shown.title}
            </h2>
            <p className={styles.summary}>{shown.summary}</p>
            <RegisterForm
              key={`${shown.key}-${preselected ?? ''}`}
              intent={shown}
              practices={practices.map((p) => p.name)}
              practice={preselected}
              sourcePath={pathname}
              onDone={close}
            />
          </>
        )}
      </div>
    </div>
  );
}
