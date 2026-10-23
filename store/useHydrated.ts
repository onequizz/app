"use client";

import { useSyncExternalStore } from "react";
import { useSettings } from "./settings";
import { useStats } from "./stats";

function subscribe(cb: () => void) {
  const a = useSettings.persist.onFinishHydration(cb);
  const b = useStats.persist.onFinishHydration(cb);
  return () => {
    a();
    b();
  };
}

const snapshot = () => useSettings.persist.hasHydrated() && useStats.persist.hasHydrated();

/** true une fois les paramètres et statistiques relus depuis localStorage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
