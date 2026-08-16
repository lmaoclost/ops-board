import { useEffect } from "react";
import type { StatusFilter } from "../lib/filter";

export interface ShortcutHandlers {
  onNewProject: () => void;
  onToggleView: () => void;
  onToggleTheme: () => void;
  onHelp: () => void;
  onClearFilters: () => void;
  onFocusAdd: () => void;
  onFocusSearch: () => void;
  onFilterStatus: (status: StatusFilter) => void;
  onUndo: () => void;
}

const STATUS_KEYS: StatusFilter[] = ["todo", "doing", "waiting", "done", "blocked"];

export function useShortcuts(h: ShortcutHandlers, opts?: { isModalOpen?: () => boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = document.activeElement as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable;
      if (typing) return;

      const modalOpen = opts?.isModalOpen?.() ?? false;

      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        h.onUndo();
        return;
      }
      if (e.key === "Escape" && !modalOpen) {
        h.onClearFilters();
        return;
      }
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        h.onHelp();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (modalOpen) return;

      const k = e.key.toLowerCase();
      switch (k) {
        case "p":
          e.preventDefault();
          h.onNewProject();
          break;
        case "k":
          e.preventDefault();
          h.onToggleView();
          break;
        case "t":
          h.onToggleTheme();
          break;
        case "n":
          e.preventDefault();
          h.onFocusAdd();
          break;
        case "/":
          e.preventDefault();
          h.onFocusSearch();
          break;
        default:
          if (/^[1-5]$/.test(k)) {
            e.preventDefault();
            h.onFilterStatus(STATUS_KEYS[Number(k) - 1]);
          }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [h, opts?.isModalOpen]);
}