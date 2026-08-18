import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { useMounted } from "@/hooks/useMounted";
import { useT } from "@/hooks/useT";
import type { Locale } from "@/lib/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { View } from "@/lib/filter";
import { Stats } from "@/components/client/Stats";
import type { BoardStats } from "@/lib/selectors";

interface TopbarProps {
  query: string;
  view: View;
  isDark: boolean;
  onQueryChange: (q: string) => void;
  onClearQuery: () => void;
  onViewChange: (v: View) => void;
  onToggleTheme: () => void;
  onNewProject: () => void;
  onExport: () => void;
  onImport: () => void;
  locale: Locale;
  onToggleLocale: () => void;
  stats: BoardStats;
  searchRef?: RefObject<HTMLInputElement | null>;
}

const DEBOUNCE_MS = 200;

export function Topbar({
  query,
  view,
  isDark,
  onQueryChange,
  onClearQuery,
  onViewChange,
  onToggleTheme,
  onNewProject,
  onExport,
  onImport,
  locale,
  onToggleLocale,
  stats,
  searchRef,
}: TopbarProps) {
  const { t } = useT();
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
          <Tooltip>
            <TooltipTrigger closeDelay={300}
              render={
                <h1 className="text-sm font-bold tracking-tight text-[var(--text)] cursor-help">
                  ops<span className="text-[var(--fired)]">/</span>board
                </h1>
              }
            />
            <TooltipContent side="bottom" className="z-40">
              <Stats stats={stats} view={view} />
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-1.5">
            <Tooltip>
            <TooltipTrigger closeDelay={300}
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
            <TooltipContent side="bottom">{t("alternar tema (t)")}</TooltipContent>
          </Tooltip>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onToggleLocale}
              className="text-[var(--muted-text)] hover:text-[var(--text)]"
              title={locale === "pt" ? "English" : "Português"}
            >
              {locale === "pt" ? "EN" : "PT"}
            </Button>
            <div className="flex items-center gap-0.5 rounded-md border border-[var(--line-soft)] p-0.5">
              {(["list", "kanban", "agenda"] as View[]).map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => onViewChange(v)}
                  aria-pressed={view === v}
                  className={`text-[var(--muted-text)] hover:text-[var(--text)] ${view === v ? "bg-[var(--field)] text-[var(--text)]" : ""}`}
                >
                  {v === "list" ? t("lista") : v === "kanban" ? t("kanban") : t("agenda")}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onExport}
              className="text-[var(--muted-text)] hover:text-[var(--text)]"
              title={t("exportar JSON (backup)")}
            >
              ↓exportar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onImport}
              className="text-[var(--muted-text)] hover:text-[var(--text)]"
              title={t("importar JSON")}
            >
              ↑importar
            </Button>
            <Link
              href="/privacidade"
              className={buttonVariants({ variant: "ghost", size: "xs" }) + " text-[var(--muted-text)] hover:text-[var(--text)]"}
              title={t("política de privacidade")}
            >
              {t("privacidade")}
            </Link>
            <Button type="button" variant="default" size="sm" onClick={onNewProject}>
              <span className="mr-1">+</span>projeto
            </Button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <label className="block relative flex items-center gap-2">
            <span className="text-[var(--fired)] font-bold text-xs" aria-hidden>
              &gt;
            </span>
            <Input
              ref={searchRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full flex-1 min-w-0 bg-[var(--field)] border-[var(--line)] pr-7 text-xs"
              type="search"
              placeholder={t("buscar tarefas") + "..."}
              autoComplete="off"
              spellCheck={false}
              aria-label={t("buscar tarefas")}
            />
            {query && (
              <button
                type="button"
                onClick={onClearQuery}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--dim)] hover:text-[var(--text)] cursor-pointer select-none"
                title={t("limpar busca")}
                aria-label={t("limpar busca")}
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