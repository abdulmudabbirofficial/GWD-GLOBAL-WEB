import { useSyncExternalStore } from 'react';

/** A tiny external store for cross-tree client state (no context re-renders). */
export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next: T | ((prev: T) => T)) {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T>(store: ReturnType<typeof createStore<T>>, serverValue?: T): T {
  return useSyncExternalStore(store.subscribe, store.get, () => (serverValue !== undefined ? serverValue : store.get()));
}
