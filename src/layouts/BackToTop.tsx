'use client';

import { scrollToTarget } from '@/features/smooth-scroll/SmoothScroll';

export function BackToTop({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        scrollToTarget(0);
        document.getElementById('main')?.focus({ preventScroll: true });
      }}
    >
      Back to top ↑
    </button>
  );
}
