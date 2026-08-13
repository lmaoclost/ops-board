"use client";

import { useEffect, useRef, useState } from "react";
import { FilterChips } from "@/components/client/FilterChips";
import { Stats } from "@/components/client/Stats";
import { Topbar } from "@/components/client/Topbar";
import { useFilters } from "@/hooks/useFilters";
import { useShortcuts } from "@/hooks/useShortcuts";
import { blockedCount, countByStatus } from "@/lib/selectors";
import { useBoard } from "@/lib/store";

export default function Home() {
  const projetos = useBoard((s) => s.projetos);
  const { filters, setQuery, toggleStatus, togglePrioSort, toggleView, clear } = useFilters();
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  useShortcuts(
    {
      onNewProject: () => showToast("novo projeto — chega na fase 2.4"),
      onToggleView: toggleView,
      onToggleTheme: () => showToast("tema completo na fase 3.4"),
      onHelp: () =>
        showToast("p projeto · n tarefa · 1-5 filtros · k kanban · t tema · ? ajuda · esc limpa"),
      onClearFilters: clear,
      onFocusAdd: () => {},
      onFilterStatus: toggleStatus,
    },
    { isModalOpen: () => false },
  );

  const counts = countByStatus(projetos);

  return (
    <div className="min-h-screen bg-[#0a0d12] text-zinc-300">
      <Topbar
        query={filters.query}
        view={filters.view}
        isDark
        onQueryChange={setQuery}
        onClearQuery={() => setQuery("")}
        onToggleView={toggleView}
        onToggleTheme={() => showToast("tema completo na fase 3.4")}
        onNewProject={() => showToast("novo projeto — chega na fase 2.4")}
      />
      <div className="mx-auto max-w-5xl px-4 pb-2">
        <FilterChips
          counts={counts}
          blockedCount={blockedCount(projetos)}
          active={filters.status}
          filtering={!!filters.query || !!filters.status}
          onToggleStatus={toggleStatus}
          onClear={clear}
        />
      </div>
      <div className="mx-auto max-w-5xl px-4 pb-2">
        <Stats projetos={projetos} filters={filters} onTogglePrioSort={togglePrioSort} />
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="border border-dashed border-zinc-700 rounded-lg p-10 text-center text-zinc-600">
          <span className="block text-2xl">_</span>
          <p className="mt-3">nenhum projeto na fila.</p>
          <button
            type="button"
            onClick={() => showToast("novo projeto — chega na fase 2.4")}
            className="mt-4 px-3 py-1.5 rounded-md bg-emerald-400 text-[#0a0d12] text-xs font-bold"
          >
            + criar primeiro projeto
          </button>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#1c2532] border border-zinc-600 text-zinc-300 text-xs px-4 py-2 rounded-md shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}