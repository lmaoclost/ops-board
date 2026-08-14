import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  queueMicrotask(cb);
  return () => {};
};

export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}