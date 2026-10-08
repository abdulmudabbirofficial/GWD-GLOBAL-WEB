/**
 * The first-visit intro. The boot script adds html.intro before first paint
 * when this session has not seen it; entrance animations wait for it to end.
 */
export const INTRO_KEY = 'gwd:intro-seen';

const waiting = new Set<() => void>();

export const introRunning = () => typeof document !== 'undefined' && document.documentElement.classList.contains('intro');

/** Calls `fn` once the intro has finished (immediately when there is none). Returns a canceller. */
export function whenIntroDone(fn: () => void) {
  if (!introRunning()) {
    fn();
    return () => {};
  }
  waiting.add(fn);
  return () => waiting.delete(fn);
}

export function finishIntro() {
  try {
    sessionStorage.setItem(INTRO_KEY, '1');
  } catch {}
  document.documentElement.classList.remove('intro');
  waiting.forEach((fn) => fn());
  waiting.clear();
}
