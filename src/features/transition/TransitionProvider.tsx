'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ScrollTrigger } from '@/features/motion/gsap';
import { scrollToTarget } from '@/features/smooth-scroll/SmoothScroll';
import { soundscape } from '@/features/sound/soundscape';
import { NAV, type NavItem } from '@/lib/site';
import styles from './Transition.module.css';

interface TransitionApi {
  navigate: (href: string) => void;
}

const TransitionContext = createContext<TransitionApi | null>(null);

export function useTransitionRouter(): TransitionApi {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('useTransitionRouter must be used inside <TransitionProvider>');
  return ctx;
}

type Phase = 'idle' | 'cover' | 'reveal';

const COVER_MS = 680;
const REVEAL_MS = 980;
/** Never leave the page covered: reveal anyway if the route takes this long. */
const SAFETY_MS = 4000;

/** The wipe's label. Home's href is "/", a prefix of every path, so it only matches itself. */
const destinationName = (pathname: string, items: readonly NavItem[]) => {
  if (pathname === '/') return items.find((n) => n.href === '/')?.label ?? 'Home';
  const nav = items.filter((n) => n.href !== '/').find((n) => pathname === n.href || pathname.startsWith(`${n.href}/`));
  if (nav) return nav.label;
  if (pathname === '/contact') return 'Contact';
  return pathname.split('/').filter(Boolean)[0]?.replace(/-/g, ' ') ?? '';
};

/**
 * Client navigation. Same-page anchors scroll; same-page queries (the
 * registration drawer) update in place; a new route plays the bracket wipe:
 * a navy panel rises with the GWD brackets closing around the destination,
 * the route commits underneath, and the panel lifts away. Back/forward skip
 * the wipe (the page simply settles in), and reduced motion skips it too.
 */
export function TransitionProvider({ children, nav = NAV }: { children: ReactNode; nav?: readonly NavItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const pendingHash = useRef<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [label, setLabel] = useState('');
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.assign(url.href);
        return;
      }
      if (url.pathname === window.location.pathname) {
        // Same page, new query (e.g. ?register=academy opens the drawer): update the URL in place.
        // Native pushState syncs useSearchParams without a server round trip, so the drawer opens instantly;
        // the marker lets the drawer close with history.back() instead of stacking entries.
        if (url.search !== window.location.search) {
          window.history.pushState({ inPage: true }, '', url.pathname + url.search + url.hash);
          return;
        }
        scrollToTarget(url.hash ? url.hash : 0);
        if (url.hash) window.history.replaceState(null, '', url.hash);
        return;
      }
      pendingHash.current = url.hash || '';
      const go = () => router.push(url.pathname + url.search + url.hash, { scroll: false });
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        go();
        return;
      }
      clearTimers();
      setLabel(destinationName(url.pathname, nav));
      setPhase('cover');
      soundscape?.cue('swell');
      timers.current.push(window.setTimeout(go, COVER_MS));
      timers.current.push(window.setTimeout(() => setPhase('reveal'), SAFETY_MS));
    },
    [router, nav],
  );

  // The new route has committed: reset scroll under the panel, then lift it.
  useEffect(() => {
    const hash = pendingHash.current;
    if (hash === null) return;
    pendingHash.current = null;
    scrollToTarget(0, { immediate: true });
    if (hash) requestAnimationFrame(() => scrollToTarget(hash, { immediate: true }));
    setPhase((p) => (p === 'cover' ? 'reveal' : p));
  }, [pathname]);

  useEffect(() => {
    if (phase !== 'reveal') return;
    clearTimers();
    // The new page's pinned and scrubbed sequences measure themselves now that layout has settled.
    requestAnimationFrame(() => ScrollTrigger.refresh());
    const t = window.setTimeout(() => setPhase('idle'), REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => clearTimers, []);

  const api = useMemo(() => ({ navigate }), [navigate]);
  return (
    <TransitionContext.Provider value={api}>
      {children}
      <div className={styles.wipe} data-phase={phase} aria-hidden="true">
        <div className={styles.frame}>
          <span className={styles.bl} />
          <span className={styles.label}>{label}</span>
          <span className={styles.br} />
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
