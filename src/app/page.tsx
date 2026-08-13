"use client";

import { useRef, useState } from "react";
import { Board } from "@/components/client/board/Board";
import { FilterChips } from "@/components/client/FilterChips";
import { Modal } from "@/components/client/Modal";
import { Stats } from "@/components/client/Stats";
import { Topbar } from "@/components/client/Topbar";
import { useFilters } from "@/hooks/useFilters";
import { useShortcuts } from "@/hooks/useShortcuts";
import { blockedCount, countByStatus } from "@/lib/selectors";
import { useBoard } from "@/lib/store";

export default function Home() {
  const projetos = useBoard((s) => s.projetos);
  const addProject = useBoard((s) => s.addProject);
  const renameProject = useBoard((s) => s.renameProject);
  const deleteProject = useBoard((s) => s.deleteProject);
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
  const { filters, setQuery, toggleStatus, togglePrioSort, toggleView, clear } = useFilters();
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  useShortcuts(
    {
      onNewProject: () => setNewProjectOpen(true),
      onToggleView: toggleView,
      onToggleTheme: () => showToast("tema completo na fase 3.4"),
      onHelp: () =>
        showToast("p projeto · n tarefa · 1-5 filtros · k kanban · t tema · ? ajuda · esc limpa"),
      onClearFilters: clear,
      onFocusAdd: () => {},
      onFilterStatus: toggleStatus,
    },
    { isModalOpen: () => newProjectOpen },
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
        onNewProject={() => setNewProjectOpen(true)}
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
        <Board
          projetos={projetos}
          filters={filters}
          onNewProject={() => setNewProjectOpen(true)}
          projectActions={{
            onAddSection: (pid, title) => addSection(pid, title),
            onRename: (id, title, blocked) => renameProject(id, title, blocked),
            onDelete: (id) => deleteProject(id),
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
          }}
        />
      </main>

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

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#1c2532] border border-zinc-600 text-zinc-300 text-xs px-4 py-2 rounded-md shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}