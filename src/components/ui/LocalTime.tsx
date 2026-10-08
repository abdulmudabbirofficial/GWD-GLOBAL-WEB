'use client';

import { useSyncExternalStore } from 'react';

/* One shared minute clock for every LocalTime on the page. */
let now = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 15_000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string) {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Live local time in a given IANA zone. Renders a neutral placeholder on the server. */
export function LocalTime({ timeZone, className }: { timeZone: string; className?: string }) {
  const time = useSyncExternalStore(
    subscribe,
    () => formatter(timeZone).format(now || Date.now()),
    () => null,
  );
  return (
    <time className={className} suppressHydrationWarning>
      {time ?? '--:--'}
    </time>
  );
}
