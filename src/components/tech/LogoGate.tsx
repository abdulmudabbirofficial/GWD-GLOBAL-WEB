'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Holds back logo downloads until the list is near the viewport. The logos
 * are CSS masks, so gating the mask rule (see TechStack.module.css) is enough:
 * the browser never requests an image no rule applies. Boxes keep their size,
 * so nothing shifts when the logos arrive.
 */
export function LogoGate({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setOpen(true);
        observer.disconnect();
      },
      { rootMargin: '1200px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} data-logos={open ? 'on' : 'off'}>
      {children}
    </div>
  );
}
