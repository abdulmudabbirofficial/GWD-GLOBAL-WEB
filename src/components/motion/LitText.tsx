'use client';

import { useRef, type ElementType } from 'react';
import { gsap, SplitText as GsapSplit, useGsap } from '@/features/motion/gsap';
import { cn } from '@/lib/utils';
import { markup } from './SplitText';

interface LitTextProps {
  /** `*words*` take the red. */
  text: string;
  as?: ElementType;
  className?: string;
}

/**
 * A statement that lights up word by word as it is scrolled through: every
 * word starts dim and comes up to full strength in reading order, tied to the
 * scroll position. Plain text without scripting or with reduced motion.
 */
export function LitText({ text, as: Tag = 'p', className }: LitTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGsap(
    ({ reduced, scope }) => {
      if (reduced) return;
      GsapSplit.create(scope, {
        type: 'words',
        autoSplit: true,
        onSplit(self) {
          return gsap.fromTo(
            self.words,
            { opacity: 0.14 },
            { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: scope, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 } },
          );
        },
      });
    },
    ref,
    [text],
  );

  return (
    <Tag ref={ref} className={cn(className)}>
      {markup(text)}
    </Tag>
  );
}
