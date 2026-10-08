'use client';

import { useEffect, useRef, useState } from 'react';
import { soundscape } from './soundscape';
import styles from './SoundToggle.module.css';

/**
 * Turns the site's sound on and off. Off by default; a visitor who turned it
 * on before gets a gentle invitation to resume (browsers need a click to
 * start sound), never an autoplay. While on, the four bars follow the score.
 */
export function SoundToggle() {
  const [on, setOn] = useState(false);
  const [hint, setHint] = useState(false);
  const bars = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!soundscape) return;
    const off = soundscape.subscribe(setOn);
    const id = requestAnimationFrame(() => setHint(soundscape!.wanted() && !soundscape!.enabled));
    return () => {
      off();
      cancelAnimationFrame(id);
    };
  }, []);

  useEffect(() => {
    const el = bars.current;
    if (!on || !soundscape || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const levels = [0, 0, 0, 0];
    const items = Array.from(el.children) as HTMLElement[];
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 50) return;
      last = now;
      soundscape!.bands(levels);
      items.forEach((bar, i) => bar.style.setProperty('--level', String(0.22 + levels[i]! * 0.78)));
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      items.forEach((bar) => bar.style.removeProperty('--level'));
    };
  }, [on]);

  const toggle = () => {
    if (!soundscape) return;
    setHint(false);
    if (soundscape.enabled) soundscape.disable();
    else void soundscape.enable();
  };

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      data-hint={hint || undefined}
      data-silent
    >
      <span ref={bars} className={styles.bars} data-on={on || undefined} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className={styles.label}>{on ? 'Sound on' : 'Sound'}</span>
    </button>
  );
}
