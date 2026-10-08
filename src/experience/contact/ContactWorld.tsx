'use client';

import { Fragment, type FormEvent, type PointerEvent, type ReactNode } from 'react';

/**
 * Contact sits on still water. Every key typed into the form drops a ripple
 * into the backdrop from the field being typed in ('gwd:keystroke' carries
 * the field's position in viewport UV space).
 */
export function KeystrokeRelay({ children, className }: { children: ReactNode; className?: string }) {
  const onInput = (e: FormEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    const r = el.getBoundingClientRect();
    const x = (r.left + Math.min(r.width, 24 + Math.random() * (r.width - 48))) / window.innerWidth;
    const y = 1 - (r.top + r.height / 2) / window.innerHeight;
    window.dispatchEvent(new CustomEvent('gwd:keystroke', { detail: { x, y } }));
  };
  return (
    <div className={className} onInput={onInput}>
      {children}
    </div>
  );
}

/** The title falls into place letter by letter, like drops onto water. */
export function DropTitle({ text, id, className, letterClass }: { text: string; id: string; className?: string; letterClass?: string }) {
  let n = 0;
  const words = text.split(' ');
  return (
    <h1 id={id} className={className} aria-label={text}>
      {words.map((word, w) => (
        <Fragment key={w}>
          <span aria-hidden="true" style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
            {[...word].map((c, i) => (
              <span key={i} className={letterClass} style={{ animationDelay: `${0.2 + n++ * 0.045}s` }}>
                {c}
              </span>
            ))}
          </span>
          {w < words.length - 1 && ' '}
        </Fragment>
      ))}
    </h1>
  );
}

/** Links whose hover light spreads from wherever the pointer came in. */
export function RippleGroup({ children, className }: { children: ReactNode; className?: string }) {
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest<HTMLElement>('a');
    if (!link) return;
    const r = link.getBoundingClientRect();
    link.style.setProperty('--rx', `${e.clientX - r.left}px`);
    link.style.setProperty('--ry', `${e.clientY - r.top}px`);
  };
  return (
    <div className={className} onPointerOver={move}>
      {children}
    </div>
  );
}
