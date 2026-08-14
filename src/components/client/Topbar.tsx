import { useEffect, useRef, useState } from "react";
import { useMounted } from "@/hooks/useMounted";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  onExport: () => void;
  onImport: () => void;
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
  onExport,
  onImport,
}: TopbarProps) {
  const [draft, setDraft] = useState(query);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useMounted();

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
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-sm font-bold tracking-tight text-[var(--text)]">
            ops<span className="text-emerald-400">/</span>board
          </h1>
          <div className="flex items-center gap-1.5">
            <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={onToggleTheme}
                  className="text-[var(--muted-text)] hover:text-[var(--text)]"
                >
                  {mounted ? (isDark ? "☾" : "☀") : "☾"}
                </Button>
              }
            />
            <TooltipContent side="bottom">alternar tema claro/escuro (t)</TooltipContent>
          </Tooltip>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onToggleView}
              className="text-[var(--muted-text)] hover:text-[var(--text)]"
              title="alternar lista/kanban (k)"
            >
              {view === "list" ? "kanban" : "lista"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onExport}
              className="text-[var(--muted-text)] hover:text-[var(--text)]"
              title="exportar JSON (backup)"
            >
              ↓exportar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onImport}
              className="text-[var(--muted-text)] hover:text-[var(--text)]"
              title="importar JSON"
            >
              ↑importar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              render={<a href="/privacidade" />}
              className="text-[var(--muted-text)] hover:text-[var(--text)]"
              title="política de privacidade"
            >
              privacidade
            </Button>
            <Button type="button" variant="default" size="sm" onClick={onNewProject}>
              <span className="mr-1">+</span>projeto
            </Button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <label className="block relative flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-xs" aria-hidden>
              &gt;
            </span>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full flex-1 min-w-0 bg-[var(--field)] border-[var(--line)] pr-7 text-xs"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--dim)] hover:text-[var(--text)] cursor-pointer select-none"
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