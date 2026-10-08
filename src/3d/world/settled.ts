/**
 * "The 3D world has its first scenes ready": the first-visit preloader holds
 * its last few percent until then, so the page's heavy one-off work (shaders
 * being built) happens behind it rather than during its animation or the
 * world's intro. Devices without WebGL settle at once.
 */
let settled = false;
const waiting = new Set<() => void>();

export function markWorldSettled() {
  if (settled) return;
  settled = true;
  waiting.forEach((fn) => fn());
  waiting.clear();
}

/** Calls `fn` once the world has settled (at once if it already has). Returns a canceller. */
export function whenWorldSettled(fn: () => void) {
  if (settled) {
    fn();
    return () => {};
  }
  waiting.add(fn);
  return () => waiting.delete(fn);
}
