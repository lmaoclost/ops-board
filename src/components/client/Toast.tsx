"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { setStorageErrorHandler } from "@/lib/store";
import { useT } from "@/hooks/useT";

const TOAST_MS = 2500;

export function useToast() {
  const { t } = useT();
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(() => {
    setStorageErrorHandler(() => showToast(t("armazenamento cheio: alterações podem não ser salvas")));
    return () => setStorageErrorHandler(null);
  }, [showToast, t]);

  return { showToast, toast };
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[var(--panel-3)] border border-[var(--line)] text-[var(--text)] text-xs px-4 py-2 rounded-md shadow-lg"
    >
      {message}
    </div>
  );
}