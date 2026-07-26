"use client";

import { useCallback, useSyncExternalStore } from "react";

// Small useSyncExternalStore-backed localStorage hook. Reading external
// mutable state (localStorage) belongs in useSyncExternalStore rather than
// "read in an effect, setState" — the latter trips React's
// set-state-in-effect rule and, more importantly, is the wrong tool: this
// *is* an external store, which is exactly what useSyncExternalStore is for.

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

function subscribe(key: string) {
  return (callback: Listener) => {
    if (!listeners.has(key)) listeners.set(key, new Set());
    const set = listeners.get(key)!;
    set.add(callback);
    return () => set.delete(callback);
  };
}

export function useLocalStorage(key: string, defaultValue: string) {
  const subscribeToKey = useCallback((callback: Listener) => subscribe(key)(callback), [key]);

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return defaultValue;
    return window.localStorage.getItem(key) ?? defaultValue;
  }, [key, defaultValue]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  const value = useSyncExternalStore(subscribeToKey, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: string) => {
      window.localStorage.setItem(key, next);
      emit(key);
    },
    [key]
  );

  return [value, setValue] as const;
}
