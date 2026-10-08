'use client';

import { useEffect, useState, type RefObject } from 'react';

/*
 * One IntersectionObserver per distinct option set, shared by every element
 * that uses those options, hundreds of reveals cost a handful of observers.
 */
type Callback = (entry: IntersectionObserverEntry) => void;
const pools = new Map<string, { observer: IntersectionObserver; callbacks: Map<Element, Callback> }>();

function observe(el: Element, options: IntersectionObserverInit, cb: Callback) {
  const key = `${options.rootMargin ?? ''}|${String(options.threshold ?? 0)}`;
  let pool = pools.get(key);
  if (!pool) {
    const callbacks = new Map<Element, Callback>();
    const observer = new IntersectionObserver((entries) => entries.forEach((e) => callbacks.get(e.target)?.(e)), options);
    pool = { observer, callbacks };
    pools.set(key, pool);
  }
  pool.callbacks.set(el, cb);
  pool.observer.observe(el);
  return () => {
    pool.callbacks.delete(el);
    pool.observer.unobserve(el);
  };
}

export interface InViewOptions {
  rootMargin?: string;
  threshold?: number;
  /** Stop observing after the first intersection (default true). */
  once?: boolean;
}

export function useInView(ref: RefObject<Element | null>, { rootMargin = '0px 0px -12% 0px', threshold = 0, once = true }: InViewOptions = {}) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let stop: (() => void) | undefined = observe(el, { rootMargin, threshold }, (entry) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting && once) {
        stop?.();
        stop = undefined;
      }
    });
    return () => stop?.();
  }, [ref, rootMargin, threshold, once]);
  return inView;
}
