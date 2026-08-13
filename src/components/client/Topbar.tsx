import { useEffect, useRef, useState } from "react";
import type { View } from "@/lib/filter";

interface TopbarProps {
  query: string;
  view: View;
  isDark: boolean;
  onQueryChange: (q: string) => void;
  onClearQuery: () => void;
  onToggleView: () => void;
  onToggleTheme: () => void;
  onNewProject: () => void;
}

const DEBOUNCE_MS = 200;

export function Topbar({
  query,
  view,
  isDark,
  onQueryChange,
  onClearQuery,
  onToggleView,
  onToggleTheme,
  onNewProject,
}: TopbarProps) {
  const [draft, setDraft] = useState(query);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(query);
  }, [query]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onQueryChange(draft), DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-[#0a0d12]/95 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-sm font-bold tracking-tight text-zinc-200">
            ops<span className="text-emerald-400">/</span>board
          </h1>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleTheme}
              className="chip"
              title="alternar tema claro/escuro (t)"
            >
              {isDark ? "☾" : "☀"}
            </button>
            <button
              type="button"
              onClick={onToggleView}
              className="chip"
              title="alternar lista/kanban (k)"
            >
              {view === "list" ? "kanban" : "lista"}
            </button>
            <button type="button" onClick={onNewProject} className="chip text-emerald-400 border-zinc-700">
              <span className="mr-1 text-emerald-400">+</span>projeto
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <label className="block relative flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-xs" aria-hidden>
              &gt;
            </span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full flex-1 min-w-0 bg-[#0b1016] border border-zinc-800 rounded-md px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-emerald-500/50"
              type="search"
              placeholder="grep tarefas..."
              autoComplete="off"
              spellCheck={false}
              aria-label="buscar tarefas"
            />
            {query && (
              <button
                type="button"
                onClick={onClearQuery}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 cursor-pointer select-none"
                title="limpar busca"
                aria-label="limpar busca"
              >
                x
              </button>
            )}
          </label>
        </div>
      </div>
    </header>
  );
}