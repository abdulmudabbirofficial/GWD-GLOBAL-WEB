'use client';

import { useEffect, useRef, type ElementType } from 'react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>[]{}#*+=';

/**
 * Text that decodes itself: every letter cycles through technical glyphs and
 * settles into place from left to right, like a terminal resolving a name.
 * The real text is in the DOM from the start (crawlers, screen readers,
 * reduced motion).
 */
export function ScrambleText({ text, as: Tag = 'span', className, id, delay = 0 }: { text: string; as?: ElementType; className?: string; id?: string; delay?: number }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let start = 0;
    const DURATION = 900 + text.length * 28;
    const tick = (now: number) => {
      if (!start) start = now + delay;
      const t = Math.max(0, now - start) / DURATION;
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]!;
        const settle = i / text.length;
        out += ch === ' ' || t > settle + 0.18 ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (t < 1.2) raf = requestAnimationFrame(tick);
      else el.textContent = text;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = text;
    };
  }, [text, delay]);
  return (
    <Tag ref={ref} id={id} className={className} aria-label={text}>
      {text}
    </Tag>
  );
}
