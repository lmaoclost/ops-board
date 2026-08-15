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
import { celebrate, wasTransitionedToDone } from "@/lib/celebrate";
import { exportJson, parseImport } from "@/lib/io";
import { deriveStats } from "@/lib/selectors";
import { visibleProjetos } from "@/lib/filter";
import { useBoard, setStorageErrorHandler } from "@/lib/store";
import type { Status } from "@/lib/types";
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
  const undo = useBoard((s) => s.undo);
  const canUndo = useBoard((s) => s.canUndo);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const { filters, setQuery, toggleStatus, togglePrioSort, toggleView, toggleArchived, clear } = useFilters();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    setStorageErrorHandler(() => showToast("armazenamento cheio: alterações podem não ser salvas"));
    return () => setStorageErrorHandler(null);
  }, [showToast]);

  const boardProjetos = useMemo(() => visibleProjetos(projetos, filters), [projetos, filters]);
  const stats = useMemo(() => deriveStats(boardProjetos), [boardProjetos]);

  const celebrateIfDone = useCallback(
    (pid: string, sid: string, tid: string, next: Status) => {
      const t = projetos.find((p) => p.id === pid)?.sections.find((s) => s.id === sid)?.tasks.find((x) => x.id === tid);
      if (wasTransitionedToDone(t?.status, next)) celebrate();
    },
    [projetos],
  );

  const handleToggleTask = useCallback(
    (pid: string, sid: string, tid: string) => {
      const t = projetos.find((p) => p.id === pid)?.sections.find((s) => s.id === sid)?.tasks.find((x) => x.id === tid);
      if (t && wasTransitionedToDone(t.status, "done")) celebrate();
      toggleTask(pid, sid, tid);
    },
    [projetos, toggleTask],
  );

  const handleStatusChange = useCallback(
    (pid: string, sid: string, tid: string, status: Status) => {
      celebrateIfDone(pid, sid, tid, status);
      setTaskStatus(pid, sid, tid, status);
    },
    [celebrateIfDone, setTaskStatus],
  );

  const handleFocusAdd = useCallback(() => {
    const input = document.querySelector<HTMLInputElement>('input[aria-label="nova tarefa"]');
    if (!input) return;
    input.scrollIntoView({ block: "center", behavior: "smooth" });
    input.focus();
  }, []);

  const handleToggleArchive = useCallback(
    (id: string) => {
      const p = projetos.find((x) => x.id === id);
      if (!p) return;
      toggleProjectArchive(id);
      showToast(p.archived ? "projeto desarquivado" : "projeto arquivado");
    },
    [projetos, toggleProjectArchive, showToast],
  );

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

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    undo();
    showToast("desfeito");
  }, [canUndo, undo, showToast]);

  useShortcuts(
    {
      onNewProject: () => setNewProjectOpen(true),
      onToggleView: toggleView,
      onToggleTheme: toggleTheme,
      onHelp: () => setHelpOpen(true),
      onClearFilters: clear,
      onFocusAdd: handleFocusAdd,
      onFilterStatus: toggleStatus,
      onUndo: handleUndo,
    },
    { isModalOpen: () => newProjectOpen || helpOpen },
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
        onImport={() => setConfirmImportOpen(true)}
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
          filtering={!!filters.query || !!filters.status || filters.archived}
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
            onToggleArchive: handleToggleArchive,
          }}
          sectionActions={{
            onToggle: (pid, sid) => toggleSection(pid, sid),
            onAddTask: (pid, sid, text) => addTask(pid, sid, text),
            onRename: (pid, sid, title) => renameSection(pid, sid, title),
            onDelete: (pid, sid) => deleteSection(pid, sid),
          }}
          taskActions={{
            onToggle: handleToggleTask,
            onPrioCycle: (pid, sid, tid) => cycleTaskPrio(pid, sid, tid),
            onStatusChange: handleStatusChange,
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
          className="text-[11px] text-[var(--dimmer)] underline underline-offset-2 hover:text-[var(--gave)] cursor-pointer"
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
              Você pode desfazer com Ctrl+Z.
            </div>
            <div className="flex justify-end gap-2 px-4 pb-4">
              <Button type="button" variant="ghost" size="xs" onClick={() => setConfirmClearOpen(false)}>
                cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
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

      {confirmImportOpen && (
        <Dialog open onOpenChange={(o) => { if (!o) setConfirmImportOpen(false); }}>
          <DialogContent
            showCloseButton={false}
            className="!sm:max-w-[380px] gap-0 rounded-lg border border-[var(--line-soft)] bg-[var(--panel-2)] p-0 text-[var(--text)] shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <DialogTitle className="text-[13px] font-bold text-[var(--text)]">importar backup</DialogTitle>
              <DialogClose
                render={
                  <Button type="button" variant="ghost" size="icon-xs" title="fechar" aria-label="fechar">
                    ×
                  </Button>
                }
              />
            </div>
            <div className="px-4 py-4 text-xs leading-relaxed text-[var(--muted-text)]">
              Importar substitui {projetos.length} projeto(s) atual(is). Exporte um backup antes se quiser
              preservá-los. Você pode desfazer com Ctrl+Z.
            </div>
            <div className="flex justify-end gap-2 px-4 pb-4">
              <Button type="button" variant="ghost" size="xs" onClick={() => setConfirmImportOpen(false)}>
                cancelar
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => {
                  setConfirmImportOpen(false);
                  fileRef.current?.click();
                }}
              >
                escolher arquivo
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

      {helpOpen && (
        <Dialog open onOpenChange={(o) => { if (!o) setHelpOpen(false); }}>
          <DialogContent
            showCloseButton={false}
            className="!sm:max-w-[420px] gap-0 rounded-lg border border-[var(--line-soft)] bg-[var(--panel-2)] p-0 text-[var(--text)] shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <DialogTitle className="text-[13px] font-bold text-[var(--text)]">atalhos e dicas</DialogTitle>
              <DialogClose
                render={
                  <Button type="button" variant="ghost" size="icon-xs" title="fechar" aria-label="fechar">
                    ×
                  </Button>
                }
              />
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-4 py-4 text-xs">
              <span className="text-[var(--dimmer)]">p</span><span>novo projeto</span>
              <span className="text-[var(--dimmer)]">n</span><span>focar nova tarefa</span>
              <span className="text-[var(--dimmer)]">1–5</span><span>filtrar por status</span>
              <span className="text-[var(--dimmer)]">k</span><span>alternar lista/kanban</span>
              <span className="text-[var(--dimmer)]">t</span><span>alternar tema claro/escuro</span>
              <span className="text-[var(--dimmer)]">? </span><span>esta ajuda</span>
              <span className="text-[var(--dimmer)]">esc</span><span>limpar filtros</span>
              <span className="text-[var(--dimmer)]">ctrl+z</span><span>desfazer</span>
            </div>
            <div className="border-t border-[var(--line)] px-4 py-3 text-xs leading-relaxed text-[var(--muted-text)]">
              Lista: arraste tarefas entre seções/projetos para mover. Kanban: arraste cartões entre colunas
              para mudar o status. Dados ficam apenas neste navegador.
            </div>
          </DialogContent>
        </Dialog>
      )}

      <PrivacyNotice />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-[var(--panel-3)] border border-[var(--line)] text-[var(--text)] text-xs px-4 py-2 rounded-md shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}