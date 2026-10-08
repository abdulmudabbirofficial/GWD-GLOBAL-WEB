'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import styles from './TiltFrame.module.css';

/**
 * A frame that turns toward the pointer in 3D, with its content lifted off
 * the back plate, so a flat render reads as an object you can look around.
 */
export function TiltFrame({ children, className, depth = 60 }: { children: ReactNode; className?: string; depth?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== 'mouse') return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 14).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 18).toFixed(2)}deg`);
  };
  const leave = () => {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };
  return (
    <div className={cn(styles.stage, className)} onPointerMove={move} onPointerLeave={leave}>
      <div ref={ref} className={styles.frame} style={{ ['--z' as string]: `${depth}px` }}>
        <div className={styles.plate} aria-hidden="true" />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
