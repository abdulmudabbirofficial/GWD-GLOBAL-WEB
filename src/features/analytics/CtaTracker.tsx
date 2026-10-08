'use client';

import { useEffect } from 'react';

/** What a click was on, as a short key the admin can group by; null when it is not a call to action. */
function describe(el: Element): { cta: string; label: string } | null {
  const marked = el.getAttribute('data-cta');
  const label = (el.getAttribute('data-cta-label') || el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const href = el.tagName === 'A' ? el.getAttribute('href') : null;
  let cta = marked || '';
  if (!cta && href) {
    let url: URL;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return null;
    }
    const intent = url.searchParams.get('register');
    if (intent) cta = `register:${intent}`;
    else if (url.protocol === 'mailto:' || url.protocol === 'tel:') cta = url.protocol.slice(0, -1);
    else if (url.origin !== window.location.origin) cta = `external:${url.host}${url.pathname}`.replace(/\/$/, '');
    else if (marked !== null || url.pathname === '/contact') cta = `link:${url.pathname}${url.hash}`;
  }
  if (!cta && marked !== null) cta = `button:${label || 'unnamed'}`;
  if (!cta) return null;
  return { cta: cta.replace(/[\s<>"'`]+/g, '-').slice(0, 120), label };
}

/**
 * Counts clicks on the site's calls to action (every button, form link,
 * outbound link and social mark) for the admin overview. One small beacon per
 * click, nothing about the person; skipped when the browser asks not to be
 * tracked.
 */
export function CtaTracker() {
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.globalPrivacyControl || nav.doNotTrack === '1') return;
    let last = { key: '', at: 0 };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('a, button');
      if (!el || el.closest('[data-no-track]')) return;
      const hit = describe(el);
      if (!hit) return;
      const now = performance.now();
      if (hit.cta === last.key && now - last.at < 1000) return;
      last = { key: hit.cta, at: now };
      const body = JSON.stringify({ page: window.location.pathname.slice(0, 200), ...hit });
      const blob = new Blob([body], { type: 'application/json' });
      if (!navigator.sendBeacon?.('/api/v1/track', blob)) {
        void fetch('/api/v1/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
      }
    };
    document.addEventListener('click', onClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);
  return null;
}
