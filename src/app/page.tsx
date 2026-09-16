"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Board } from "@/components/client/board/Board";
import { FilterChips } from "@/components/client/FilterChips";
import dynamic from "next/dynamic";
import { ConfirmDialog } from "@/components/client/ConfirmDialog";
import { HelpDialog } from "@/components/client/HelpDialog";
import { Toast, useToast } from "@/components/client/Toast";
import { PrivacyNotice } from "@/components/client/PrivacyNotice";
import { FooterLinks } from "@/components/client/FooterLinks";
import { Topbar } from "@/components/client/Topbar";
import { useT } from "@/hooks/useT";
import { useFilters } from "@/hooks/useFilters";
import { useShortcuts } from "@/hooks/useShortcuts";
import { useDueReminder } from "@/hooks/useDueReminder";
import { useTheme } from "next-themes";
import { celebrate, wasTransitionedToDone } from "@/lib/celebrate";
import { exportJson, parseImport } from "@/lib/io";
import { deriveStats } from "@/lib/selectors";
import { visibleProjetos } from "@/lib/filter";
import { useBoard } from "@/lib/store";
import { cyclePrio } from "@/lib/tokens";
import type { Status } from "@/lib/types";

const Modal = dynamic(() => import("@/components/client/Modal").then((m) => m.Modal));

export default function Home() {
  const projetos = useBoard((s) => s.projetos);
  const addProject = useBoard((s) => s.addProject);
  const editProject = useBoard((s) => s.editProject);
  const deleteProject = useBoard((s) => s.deleteProject);
  const toggleProjectArchive = useBoard((s) => s.toggleProjectArchive);
  const setProjectPrio = useBoard((s) => s.setProjectPrio);
  const toggleProjectCollapsed = useBoard((s) => s.toggleProjectCollapsed);
  const addSection = useBoard((s) => s.addSection);
  const editSection = useBoard((s) => s.editSection);
  const moveSection = useBoard((s) => s.moveSection);
  const moveProject = useBoard((s) => s.moveProject);
  const deleteSection = useBoard((s) => s.deleteSection);
  const addTask = useBoard((s) => s.addTask);
  const addTaskFull = useBoard((s) => s.addTaskFull);
  const editTask = useBoard((s) => s.editTask);
  const deleteTask = useBoard((s) => s.deleteTask);
  const purgeTask = useBoard((s) => s.purgeTask);
  const setTaskStatus = useBoard((s) => s.setTaskStatus);
  const cycleTaskPrio = useBoard((s) => s.cycleTaskPrio);
  const toggleTask = useBoard((s) => s.toggleTask);
  const toggleSection = useBoard((s) => s.toggleSection);
  const moveTask = useBoard((s) => s.moveTask);
  const importState = useBoard((s) => s.importState);
  const reset = useBoard((s) => s.reset);
  const undo = useBoard((s) => s.undo);
  const canUndo = useBoard((s) => s.canUndo);
  const { t } = useT();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const { filters, setQuery, toggleStatus, togglePrioSort, setView, toggleView, toggleArchived, clear } = useFilters();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const { showToast, toast } = useToast();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useDueReminder();

  const boardProjetos = useMemo(() => visibleProjetos(projetos, filters), [projetos, filters]);
  const stats = useMemo(() => deriveStats(boardProjetos), [boardProjetos]);

  // --- actions (callbacks pro Board) ---

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

  const handleFocusSearch = useCallback(() => {
    searchRef.current?.focus();
    searchRef.current?.select();
  }, []);

  const handleToggleArchive = useCallback(
    (id: string) => {
      const p = projetos.find((x) => x.id === id);
      if (!p) return;
      toggleProjectArchive(id);
      showToast(p.archived ? t("projeto desarquivado") : t("projeto arquivado"));
    },
    [projetos, toggleProjectArchive, showToast, t],
  );

  const handleExport = useCallback(() => {
    const blob = new Blob([exportJson(projetos)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `opsboard-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t("backup exportado"));
  }, [projetos, showToast, t]);

  const handleImportFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = parseImport(text);
        importState(parsed);
        showToast(t("importado: N projeto(s)").replace("N", String(parsed.length)));
      } catch (e) {
        showToast(e instanceof Error ? e.message : t("import falhou"));
      }
    },
    [importState, showToast, t],
  );

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    undo();
    showToast(t("desfeito"));
  }, [canUndo, undo, showToast, t]);

  // --- actions (callbacks pro Board) ---

  const projectActions = useMemo(
    () => ({
      onAddSection: (pid: string, input: Parameters<typeof addSection>[1]) => addSection(pid, input),
      onEdit: (id: string, patch: Parameters<typeof editProject>[1]) => editProject(id, patch),
      onDelete: (id: string) => deleteProject(id),
      onToggleArchive: handleToggleArchive,
      onCyclePrio: (id: string) => {
        const p = projetos.find((x) => x.id === id);
        if (!p) return;
        setProjectPrio(id, cyclePrio(p.prio));
      },
      onToggleCollapse: (id: string) => toggleProjectCollapsed(id),
      onMoveProject: (pid: string, overPid: string) => moveProject(pid, overPid),
    }),
    [addSection, editProject, deleteProject, handleToggleArchive, projetos, setProjectPrio, toggleProjectCollapsed, moveProject],
  );

  const sectionActions = useMemo(
    () => ({
      onToggle: (pid: string, sid: string) => toggleSection(pid, sid),
      onAddTask: (pid: string, sid: string, text: string) => addTask(pid, sid, text),
      onAddTaskFull: (pid: string, sid: string, input: Parameters<typeof addTaskFull>[2]) => addTaskFull(pid, sid, input),
      onEdit: (pid: string, sid: string, patch: Parameters<typeof editSection>[2]) => editSection(pid, sid, patch),
      onMoveSection: (pid: string, sid: string, index: number) => moveSection(pid, sid, index),
      onDelete: (pid: string, sid: string) => deleteSection(pid, sid),
    }),
    [toggleSection, addTask, addTaskFull, editSection, moveSection, deleteSection],
  );

  const taskActions = useMemo(
    () => ({
      onToggle: handleToggleTask,
      onPrioCycle: (pid: string, sid: string, tid: string) => cycleTaskPrio(pid, sid, tid),
      onStatusChange: handleStatusChange,
      onEdit: (pid: string, sid: string, tid: string, patch: Parameters<typeof editTask>[3]) => editTask(pid, sid, tid, patch),
      onDelete: (pid: string, sid: string, tid: string) => deleteTask(pid, sid, tid),
      onPurge: (pid: string, sid: string, tid: string) => purgeTask(pid, sid, tid),
      onUpdate: (pid: string, sid: string, tid: string, patch: Parameters<typeof editTask>[3]) => editTask(pid, sid, tid, patch),
      onMoveTask: (pid: string, sid: string, tid: string, toPid: string, toSid: string, index: number) =>
        moveTask({ pid, sid, tid }, { pid: toPid, sid: toSid }, index),
    }),
    [handleToggleTask, cycleTaskPrio, handleStatusChange, editTask, deleteTask, purgeTask, moveTask],
  );

  useShortcuts(
    {
      onNewProject: () => setNewProjectOpen(true),
      onToggleView: toggleView,
      onToggleTheme: toggleTheme,
      onHelp: () => setHelpOpen(true),
      onClearFilters: clear,
      onFocusAdd: handleFocusAdd,
      onFocusSearch: handleFocusSearch,
      onFilterStatus: toggleStatus,
      onUndo: handleUndo,
    },
    { isModalOpen: () => newProjectOpen || helpOpen },
  );

  // --- render ---

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
        onViewChange={setView}
        onToggleTheme={toggleTheme}
        onNewProject={() => setNewProjectOpen(true)}
        onExport={handleExport}
        onImport={() => setConfirmImportOpen(true)}
        stats={stats}
        searchRef={searchRef}
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
          prioSort={filters.prioSort}
          onTogglePrioSort={togglePrioSort}
        />
      </div>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Board
          projetos={boardProjetos}
          filters={filters}
          onNewProject={() => setNewProjectOpen(true)}
          onClearFilters={clear}
          projectActions={projectActions}
          sectionActions={sectionActions}
          taskActions={taskActions}
        />
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-center">
        <button
          type="button"
          onClick={() => setConfirmClearOpen(true)}
          className="text-[11px] text-[var(--dimmer)] underline underline-offset-2 hover:text-[var(--gave)] cursor-pointer"
          title={t("apagar todos os dados deste navegador")}
        >
          {t("apagar todos os dados")}
        </button>
        <FooterLinks />
      </footer>

      {/* --- dialogs --- */}

      {confirmClearOpen && (
        <ConfirmDialog
          title={t("apagar todos os dados")}
          body={t("apagar_txt").replace("{n}", String(projetos.length))}
          confirmLabel={t("apagar tudo")}
          onConfirm={() => {
            reset();
            showToast(t("todos os dados apagados"));
          }}
          onCancel={() => setConfirmClearOpen(false)}
        />
      )}

      {confirmImportOpen && (
        <ConfirmDialog
          title={t("importar backup")}
          body={t("importar_txt").replace("{n}", String(projetos.length))}
          confirmLabel={t("escolher arquivo")}
          confirmVariant="default"
          onConfirm={() => fileRef.current?.click()}
          onCancel={() => setConfirmImportOpen(false)}
        />
      )}

      {newProjectOpen && (
        <Modal
          title={t("novo projeto")}
          submitLabel={t("criar")}
          fields={[
            { key: "title", label: t("título"), required: true },
            { key: "due", label: t("vencimento"), type: "date", value: "" },
            { key: "note", label: t("nota do projeto"), type: "textarea", value: "" },
          ]}
          onSubmit={(v) => {
            setNewProjectOpen(false);
            const title = String(v.title).trim();
            if (title)
              addProject({ title, note: String(v.note ?? "").trim(), due: String(v.due ?? "") });
          }}
          onCancel={() => setNewProjectOpen(false)}
        />
      )}

      {helpOpen && <HelpDialog onCancel={() => setHelpOpen(false)} />}

      <PrivacyNotice />

      <Toast message={toast} />
    </div>
  );
}