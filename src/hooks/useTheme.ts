import { useEffect, useSyncExternalStore } from "react";

export const THEME_KEY = "opsboard.theme";
const THEME_EVENT = "opsboard:theme";

function readTheme(): boolean {
  if (typeof window === "undefined") return true;
  const saved = window.localStorage.getItem(THEME_KEY);
  return saved !== "light";
}

function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  window.addEventListener(THEME_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(THEME_EVENT, cb);
  };
}

export function useTheme() {
  const isDark = useSyncExternalStore(subscribe, readTheme, () => true);

  useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  return {
    isDark,
    toggle: () => {
      const next = !readTheme();
      window.localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      window.dispatchEvent(new Event(THEME_EVENT));
    },
  };
}