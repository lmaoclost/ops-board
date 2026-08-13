import { DndContext, PointerSensor, TouchSensor, pointerWithin, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { useMemo } from "react";
import { isFiltering, projMatches, type Filters } from "@/lib/filter";
import { resolveDrop } from "@/lib/dnd";
import type { Project, Status, TaskPatch } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";
import { Kanban } from "@/components/client/dnd/Kanban";

export interface BoardProjectActions {
  onAddSection: (pid: string, title: string) => void;
  onRename: (id: string, title: string, blocked: boolean) => void;
  onDelete: (id: string) => void;
}

export interface BoardSectionActions {
  onToggle: (pid: string, sid: string) => void;
  onAddTask: (pid: string, sid: string, text: string) => void;
  onRename: (pid: string, sid: string, title: string) => void;
  onDelete: (pid: string, sid: string) => void;
}

export interface BoardTaskActions {
  onToggle: (pid: string, sid: string, tid: string) => void;
  onPrioCycle: (pid: string, sid: string, tid: string) => void;
  onStatusChange: (pid: string, sid: string, tid: string, status: Status) => void;
  onEdit: (pid: string, sid: string, tid: string, patch: TaskPatch) => void;
  onDelete: (pid: string, sid: string, tid: string) => void;
  onMoveTask: (pid: string, sid: string, tid: string, toPid: string, toSid: string, index: number) => void;
}

export interface SectionLevelActions {
  onToggle: (sid: string) => void;
  onAddTask: (sid: string, text: string) => void;
  onRename: (sid: string, title: string) => void;
  onDelete: (sid: string) => void;
}

export interface TaskLevelActions {
  onToggle: (sid: string, tid: string) => void;
  onPrioCycle: (sid: string, tid: string) => void;
  onStatusChange: (sid: string, tid: string, status: Status) => void;
  onEdit: (sid: string, tid: string, patch: TaskPatch) => void;
  onDelete: (sid: string, tid: string) => void;
}

export interface BoardProps {
  projetos: Project[];
  filters: Filters;
  onNewProject: () => void;
  projectActions: BoardProjectActions;
  sectionActions: BoardSectionActions;
  taskActions: BoardTaskActions;
}

export function Board({ projetos, filters, onNewProject, projectActions, sectionActions, taskActions }: BoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 6 } }),
  );

  const collectActions = (pid: string): { sectionActions: SectionLevelActions; taskActions: TaskLevelActions } => ({
    sectionActions: {
      onToggle: (sid: string) => sectionActions.onToggle(pid, sid),
      onAddTask: (sid: string, text: string) => sectionActions.onAddTask(pid, sid, text),
      onRename: (sid: string, title: string) => sectionActions.onRename(pid, sid, title),
      onDelete: (sid: string) => sectionActions.onDelete(pid, sid),
    },
    taskActions: {
      onToggle: (sid: string, tid: string) => taskActions.onToggle(pid, sid, tid),
      onPrioCycle: (sid: string, tid: string) => taskActions.onPrioCycle(pid, sid, tid),
      onStatusChange: (sid: string, tid: string, status: Status) =>
        taskActions.onStatusChange(pid, sid, tid, status),
      onEdit: (sid: string, tid: string, patch: TaskPatch) => taskActions.onEdit(pid, sid, tid, patch),
      onDelete: (sid: string, tid: string) => taskActions.onDelete(pid, sid, tid),
    },
  });

  const filtered = useMemo(
    () => (isFiltering(filters) ? projetos.filter((p) => projMatches(p, filters)) : projetos),
    [projetos, filters],
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const active = String(e.active.id);
    const over = e.over ? String(e.over.id) : null;
    if (!over) return;
    const drop = resolveDrop({ projetos, active, over });
    if (drop.kind === "move") {
      taskActions.onMoveTask(drop.src.pid, drop.src.sid, drop.src.tid, drop.dest.pid, drop.dest.sid, drop.index);
    } else if (drop.kind === "status") {
      taskActions.onStatusChange(drop.task.pid, drop.task.sid, drop.task.tid, drop.status);
    }
  };

  let content;
  if (!projetos.length) {
    content = (
      <div className="fade-in rounded-lg border border-dashed border-[var(--line-soft)] p-10 text-center text-[var(--dim)]">
        <span className="block text-2xl">_</span>
        <p className="mb-3">nenhum projeto na fila.</p>
        <button
          type="button"
          onClick={onNewProject}
          className="rounded-md bg-emerald-400 px-3 py-1.5 text-xs font-bold text-[#0a0d12]"
        >
          + criar primeiro projeto
        </button>
      </div>
    );
  } else if (!filtered.length) {
    content = (
      <div className="fade-in rounded-lg border border-dashed border-[var(--line-soft)] p-10 text-center text-[var(--dim)]">
        <span className="block text-2xl">∅</span>
        <p>nada casa com o filtro.</p>
      </div>
    );
  } else if (filters.view === "kanban") {
    content = <Kanban projetos={filtered} />;
  } else {
    content = (
      <div className="fade-in flex flex-col gap-4">
        {filtered.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            collectActions={collectActions}
            onAddSection={(title) => projectActions.onAddSection(p.id, title)}
            onRename={(id, title, blocked) => projectActions.onRename(id, title, blocked)}
            onDelete={(id) => projectActions.onDelete(id)}
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
      {content}
    </DndContext>
  );
}