import { useEffect, useState } from "react";

export const THEME_KEY = "opsboard.theme";

function readTheme(): boolean {
  if (typeof window === "undefined") return true;
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light") return false;
  if (saved === "dark") return true;
  return true;
}

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(readTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
    window.localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  return { isDark, toggle: () => setIsDark((d) => !d) };
}