"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Board } from "@/components/client/board/Board";
import { FilterChips } from "@/components/client/FilterChips";
import { Modal } from "@/components/client/Modal";
import { PrivacyNotice } from "@/components/client/PrivacyNotice";
import { Stats } from "@/components/client/Stats";
import { Topbar } from "@/components/client/Topbar";
import { useFilters } from "@/hooks/useFilters";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useTheme } from "next-themes";
import { celebrate } from "@/lib/celebrate";
import { exportJson, parseImport } from "@/lib/io";
import { deriveStats } from "@/lib/selectors";
import { useBoard, setStorageErrorHandler } from "@/lib/store";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Home() {
  const projetos = useBoard((s) => s.projetos);
  const addProject = useBoard((s) => s.addProject);
  const renameProject = useBoard((s) => s.renameProject);
  const deleteProject = useBoard((s) => s.deleteProject);
  const toggleProjectArchive = useBoard((s) => s.toggleProjectArchive);
  const addSection = useBoard((s) => s.addSection);
  const renameSection = useBoard((s) => s.renameSection);
  const deleteSection = useBoard((s) => s.deleteSection);
  const addTask = useBoard((s) => s.addTask);
  const editTask = useBoard((s) => s.editTask);
  const deleteTask = useBoard((s) => s.deleteTask);
  const setTaskStatus = useBoard((s) => s.setTaskStatus);
  const setTaskPrio = useBoard((s) => s.setTaskPrio);
  const cycleTaskPrio = useBoard((s) => s.cycleTaskPrio);
  const toggleTask = useBoard((s) => s.toggleTask);
  const toggleSection = useBoard((s) => s.toggleSection);
  const moveTask = useBoard((s) => s.moveTask);
  const importState = useBoard((s) => s.importState);
  const reset = useBoard((s) => s.reset);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const { filters, setQuery, toggleStatus, togglePrioSort, toggleView, toggleArchived, clear } = useFilters();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const prevDone = useRef(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  useEffect(() => {
    setStorageErrorHandler(() => showToast("armazenamento cheio: alterações podem não ser salvas"));
    return () => setStorageErrorHandler(null);
  }, [showToast]);

  const boardProjetos = useMemo(
    () => (filters.archived ? projetos : projetos.filter((p) => !p.archived)),
    [projetos, filters.archived],
  );
  const stats = useMemo(() => deriveStats(boardProjetos), [boardProjetos]);
  useEffect(() => {
    if (stats.done > prevDone.current) celebrate();
    prevDone.current = stats.done;
  }, [stats.done]);

  const handleExport = useCallback(() => {
    const blob = new Blob([exportJson(projetos)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opsboard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("backup exportado");
  }, [projetos]);

  const handleImportFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = parseImport(text);
        importState(parsed);
        showToast(`importado: ${parsed.length} projeto(s)`);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "import falhou");
      }
    },
    [importState],
  );

  useShortcuts(
    {
      onNewProject: () => setNewProjectOpen(true),
      onToggleView: toggleView,
      onToggleTheme: toggleTheme,
      onHelp: () =>
        showToast("p projeto · n tarefa · 1-5 filtros · k kanban · t tema · ? ajuda · esc limpa"),
      onClearFilters: clear,
      onFocusAdd: () => {},
      onFilterStatus: toggleStatus,
    },
    { isModalOpen: () => newProjectOpen },
  );

  const counts = stats.byStatus;
  const archivedCount = projetos.filter((p) => p.archived).length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Topbar
        query={filters.query}
        view={filters.view}
        isDark={isDark}
        onQueryChange={setQuery}
        onClearQuery={() => setQuery("")}
        onToggleView={toggleView}
        onToggleTheme={toggleTheme}
        onNewProject={() => setNewProjectOpen(true)}
        onExport={handleExport}
        onImport={() => fileRef.current?.click()}
      />
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleImportFile(f);
          e.target.value = "";
        }}
      />
      <div className="mx-auto max-w-5xl px-4 pb-2">
        <FilterChips
          counts={counts}
          blockedCount={stats.blocked}
          archivedCount={archivedCount}
          archivedActive={filters.archived}
          active={filters.status}
          filtering={!!filters.query || !!filters.status}
          onToggleStatus={toggleStatus}
          onToggleArchived={toggleArchived}
          onClear={clear}
        />
      </div>
      <div className="mx-auto max-w-5xl px-4 pb-2">
        <Stats stats={stats} filters={filters} onTogglePrioSort={togglePrioSort} />
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Board
          projetos={boardProjetos}
          filters={filters}
          onNewProject={() => setNewProjectOpen(true)}
          projectActions={{
            onAddSection: (pid, title) => addSection(pid, title),
            onRename: (id, title, blocked) => renameProject(id, title, blocked),
            onDelete: (id) => deleteProject(id),
            onToggleArchive: toggleProjectArchive,
          }}
          sectionActions={{
            onToggle: (pid, sid) => toggleSection(pid, sid),
            onAddTask: (pid, sid, text) => addTask(pid, sid, text),
            onRename: (pid, sid, title) => renameSection(pid, sid, title),
            onDelete: (pid, sid) => deleteSection(pid, sid),
          }}
          taskActions={{
            onToggle: (pid, sid, tid) => toggleTask(pid, sid, tid),
            onPrioCycle: (pid, sid, tid) => cycleTaskPrio(pid, sid, tid),
            onStatusChange: (pid, sid, tid, status) => setTaskStatus(pid, sid, tid, status),
            onEdit: (pid, sid, tid, patch) => editTask(pid, sid, tid, patch),
            onDelete: (pid, sid, tid) => deleteTask(pid, sid, tid),
            onMoveTask: (pid, sid, tid, toPid, toSid, index) =>
              moveTask({ pid, sid, tid }, { pid: toPid, sid: toSid }, index),
          }}
        />
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-center">
        <button
          type="button"
          onClick={() => setConfirmClearOpen(true)}
          className="text-[11px] text-[var(--dimmer)] underline underline-offset-2 hover:text-red-400 cursor-pointer"
          title="remove todos os projetos deste navegador"
        >
          apagar todos os dados
        </button>
      </footer>

      {confirmClearOpen && (
        <Dialog open onOpenChange={(o) => { if (!o) setConfirmClearOpen(false); }}>
          <DialogContent
            showCloseButton={false}
            className="!sm:max-w-[380px] gap-0 rounded-lg border border-[var(--line-soft)] bg-[var(--panel-2)] p-0 text-[var(--text)] shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <DialogTitle className="text-[13px] font-bold text-[var(--text)]">apagar todos os dados</DialogTitle>
              <DialogClose
                render={
                  <Button type="button" variant="ghost" size="icon-xs" title="fechar" aria-label="fechar">
                    ×
                  </Button>
                }
              />
            </div>
            <div className="px-4 py-4 text-xs leading-relaxed text-[var(--muted-text)]">
              Isso remove {projetos.length} projeto(s) deste navegador. Considere exportar um backup antes.
              Esta ação não pode ser desfeita.
            </div>
            <div className="flex justify-end gap-2 px-4 pb-4">
              <Button type="button" variant="ghost" size="xs" onClick={() => setConfirmClearOpen(false)}>
                cancelar
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="bg-red-500 hover:bg-red-600"
                onClick={() => {
                  reset();
                  setConfirmClearOpen(false);
                  showToast("todos os dados apagados");
                }}
              >
                apagar tudo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {newProjectOpen && (
        <Modal
          title="novo projeto"
          submitLabel="criar"
          fields={[{ key: "title", label: "título" }]}
          onSubmit={(v) => {
            setNewProjectOpen(false);
            const title = String(v.title).trim();
            if (title) addProject(title);
          }}
          onCancel={() => setNewProjectOpen(false)}
        />
      )}

      <PrivacyNotice />

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[var(--panel-3)] border border-zinc-600 text-[var(--text)] text-xs px-4 py-2 rounded-md shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}