'use client';

import { Fragment, useRef, type ElementType } from 'react';
import { gsap, SplitText as GsapSplit, useGsap } from '@/features/motion/gsap';
import { whenIntroDone } from '@/features/preloader/intro';
import { cn } from '@/lib/utils';

export type KineticMode = 'chars' | 'words' | 'lines';

interface SplitTextProps {
  /** `*words*` take the red; a newline is a deliberate line break. */
  text: string;
  as?: ElementType;
  className?: string;
  /** How the text arrives: by character (posters), word (statements) or line. */
  mode?: KineticMode;
  /** Kept for older call sites. */
  by?: 'word' | 'char';
  delay?: number;
  /** Seconds between pieces. */
  stagger?: number;
  /** Play on load (page titles) instead of when scrolled into view. */
  immediate?: boolean;
  /** Tie the reveal to scroll position instead of playing it. */
  scrub?: boolean;
  id?: string;
}

/** Splits `*…*` runs into emphasis (which may span lines) and newlines into line breaks. */
export function markup(text: string) {
  const lines = (s: string, key: string) =>
    s.split('\n').map((line, li, all) => (
      <Fragment key={`${key}-${li}`}>
        {line}
        {li < all.length - 1 && <br />}
      </Fragment>
    ));
  // Odd segments between asterisks are emphasised.
  return text.split('*').map((seg, i) => (i % 2 ? <em key={i}>{lines(seg, `e${i}`)}</em> : <Fragment key={i}>{lines(seg, `t${i}`)}</Fragment>));
}

/**
 * Kinetic headline: GSAP SplitText cuts it into masked lines and animates the
 * pieces in with a blur-rise (the reference video's reveal). Re-splits when
 * fonts load or the width changes. Rendered as plain text for crawlers,
 * reduced motion, and before hydration (hidden by CSS until split).
 */
export function SplitText({ text, as: Tag = 'p', className, mode, by, delay = 0, stagger, immediate = false, scrub = false, id }: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const kind: KineticMode = mode ?? (by === 'word' ? 'words' : 'chars');

  useGsap(
    ({ reduced, scope }) => {
      if (reduced) {
        gsap.set(scope, { visibility: 'visible' });
        return;
      }
      GsapSplit.create(scope, {
        type: 'lines,words,chars',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit(self) {
          gsap.set(scope, { visibility: 'visible' });
          const pieces = kind === 'chars' ? self.chars : kind === 'words' ? self.words : self.lines;
          const tween = gsap.from(pieces, {
            yPercent: kind === 'lines' ? 100 : 115,
            opacity: 0,
            filter: 'blur(10px)',
            duration: kind === 'chars' ? 1.2 : 1.1,
            stagger: stagger ?? (kind === 'chars' ? 0.022 : kind === 'words' ? 0.05 : 0.09),
            delay: immediate ? 0.15 + delay / 1000 : delay / 1000,
            ease: 'gwd',
            scrollTrigger: immediate
              ? undefined
              : { trigger: scope, start: 'top 92%', end: scrub ? 'top 58%' : 'top 40%', scrub: scrub ? 0.9 : false, once: !scrub },
          });
          // Page titles wait for the first-visit intro to lift.
          if (immediate) {
            tween.pause();
            whenIntroDone(() => tween.play());
          }
          return tween;
        },
      });
    },
    ref,
    [text, kind],
  );

  return (
    <Tag ref={ref} id={id} className={cn(className)} data-kinetic="">
      {markup(text)}
    </Tag>
  );
}
