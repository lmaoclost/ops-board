import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { useMounted } from "@/hooks/useMounted";
import { useT } from "@/hooks/useT";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { View } from "@/lib/filter";
import { cn } from "@/lib/utils";
import { Stats } from "@/components/client/Stats";
import { LocaleToggle } from "@/components/client/LocaleToggle";
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
      <div className="mx-auto max-w-5xl px-4 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
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
          <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-1.5 lg:justify-start">
            <Tooltip>
            <TooltipTrigger closeDelay={300}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={onToggleTheme}
                  className="shrink-0 text-[var(--muted-text)] hover:text-[var(--text)]"
                >
                  {mounted ? (isDark ? "☾" : "☀") : "☾"}
                </Button>
              }
            />
            <TooltipContent side="bottom">{t("alternar tema (t)")}</TooltipContent>
          </Tooltip>
            <LocaleToggle />
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onViewChange(view === "kanban" ? "list" : "kanban")}
              className="shrink-0 text-[var(--muted-text)] hover:text-[var(--text)] lg:hidden"
              title={t("alternar lista/kanban")}
            >
              {view === "kanban" ? t("lista") : t("kanban")}
            </Button>
            <div className="hidden items-center gap-0.5 rounded-md border border-[var(--line-soft)] p-0.5 lg:flex">
              {(["list", "kanban", "agenda", "lixeira"] as View[]).map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => onViewChange(v)}
                  aria-pressed={view === v}
                  className={`text-[var(--muted-text)] hover:text-[var(--text)] ${view === v ? "bg-[var(--field)] text-[var(--text)]" : ""}`}
                >
                  {v === "list" ? t("lista") : v === "kanban" ? t("kanban") : v === "agenda" ? t("agenda") : t("lixeira")}
                </Button>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onExport}
              className="hidden text-[var(--muted-text)] hover:text-[var(--text)] lg:inline-flex"
              title={t("exportar JSON (backup)")}
            >
              ↓{t("exportar")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={onImport}
              className="hidden text-[var(--muted-text)] hover:text-[var(--text)] lg:inline-flex"
              title={t("importar JSON")}
            >
              ↑{t("importar")}
            </Button>
            <Link
              href="/privacy"
              className={cn(buttonVariants({ variant: "ghost", size: "xs" }), "hidden text-[var(--muted-text)] hover:text-[var(--text)] lg:inline-flex")}
              title={t("política de privacidade")}
            >
              {t("privacidade")}
            </Link>
            <Button type="button" variant="default" size="sm" onClick={onNewProject} className="shrink-0">
              <span className="mr-1">+</span>{t("projeto")}
            </Button>
            <span className="shrink-0 lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={t("menu")}
                      title={t("menu")}
                    >
                      ☰
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="bg-[var(--panel-2)] text-[var(--text)]">
                  <DropdownMenuItem
                    className="text-xs"
                    onClick={() => onViewChange("agenda")}
                  >
                    {t("agenda")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs"
                    onClick={() => onViewChange("lixeira")}
                  >
                    {t("lixeira")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[var(--line)]" />
                  <DropdownMenuItem className="text-xs" onClick={onExport}>
                    ↓{t("exportar")}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-xs" onClick={onImport}>
                    ↑{t("importar")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-xs"
                    render={<Link href="/privacy">{t("privacidade")}</Link>}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
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