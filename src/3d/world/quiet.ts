/**
 * Timing for heavy one-off work (building shaders, baking maps) that is not
 * needed this instant: it waits for the browser to be idle, and for the
 * visitor to pause scrolling, so it never interrupts a scroll.
 */
let lastScroll = 0;
if (typeof window !== 'undefined') {
  const mark = () => (lastScroll = performance.now());
  window.addEventListener('scroll', mark, { passive: true });
  window.addEventListener('wheel', mark, { passive: true });
  window.addEventListener('touchmove', mark, { passive: true });
}

/** True when the visitor has not scrolled for `ms`. */
export const scrollPaused = (ms = 700) => performance.now() - lastScroll >= ms;

/** Resolves in the browser's next idle period (or after `timeout` ms at the latest). */
export const nextIdle = (timeout: number) =>
  new Promise((res) => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => res(null), { timeout });
    else setTimeout(() => res(null), 50);
  });

/** Resolves once scrolling has paused for a moment, then in the next idle period. */
export async function nextQuiet() {
  while (!scrollPaused()) await new Promise((res) => setTimeout(res, 150));
  await nextIdle(800);
}
