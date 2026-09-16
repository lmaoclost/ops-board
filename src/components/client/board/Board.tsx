import { DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useT } from "@/hooks/useT";
import { isFiltering, prioSort, projMatches, type Filters } from "@/lib/filter";
import { resolveDrop, smartCollision } from "@/lib/dnd";
import type { AddSectionInput, AddTaskInput, Project, ProjectPatch, SectionPatch, Status, TaskPatch } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";

const Kanban = dynamic(() => import("@/components/client/dnd/Kanban").then((m) => m.Kanban));
const Agenda = dynamic(() => import("@/components/client/agenda/Agenda").then((m) => m.Agenda));
const Trash = dynamic(() => import("@/components/client/trash/Trash").then((m) => m.Trash));

export interface BoardProjectActions {
  onAddSection: (pid: string, input: AddSectionInput) => void;
  onEdit: (id: string, patch: ProjectPatch) => void;
  onDelete: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onCyclePrio: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onMoveProject: (pid: string, overPid: string) => void;
}

export interface BoardSectionActions {
  onToggle: (pid: string, sid: string) => void;
  onAddTask: (pid: string, sid: string, text: string) => void;
  onAddTaskFull: (pid: string, sid: string, input: AddTaskInput) => void;
  onEdit: (pid: string, sid: string, patch: SectionPatch) => void;
  onMoveSection: (pid: string, sid: string, index: number) => void;
  onDelete: (pid: string, sid: string) => void;
}

export interface BoardTaskActions {
  onToggle: (pid: string, sid: string, tid: string) => void;
  onPrioCycle: (pid: string, sid: string, tid: string) => void;
  onStatusChange: (pid: string, sid: string, tid: string, status: Status) => void;
  onEdit: (pid: string, sid: string, tid: string, patch: TaskPatch) => void;
  onDelete: (pid: string, sid: string, tid: string) => void;
  onPurge: (pid: string, sid: string, tid: string) => void;
  onUpdate: (pid: string, sid: string, tid: string, patch: TaskPatch) => void;
  onMoveTask: (pid: string, sid: string, tid: string, toPid: string, toSid: string, index: number) => void;
}

export interface SectionLevelActions {
  onToggle: (sid: string) => void;
  onAddTask: (sid: string, text: string) => void;
  onEdit: (sid: string, patch: SectionPatch) => void;
  onDelete: (sid: string) => void;
}

export interface TaskLevelActions {
  onToggle: (sid: string, tid: string) => void;
  onPrioCycle: (sid: string, tid: string) => void;
  onStatusChange: (sid: string, tid: string, status: Status) => void;
  onEdit: (sid: string, tid: string, patch: TaskPatch) => void;
  onDelete: (sid: string, tid: string) => void;
  onUpdate: (sid: string, tid: string, patch: TaskPatch) => void;
}

export interface BoardProps {
  projetos: Project[];
  filters: Filters;
  onNewProject: () => void;
  onClearFilters: () => void;
  projectActions: BoardProjectActions;
  sectionActions: BoardSectionActions;
  taskActions: BoardTaskActions;
}

export const Board = memo(function Board({ projetos, filters, onNewProject, onClearFilters, projectActions, sectionActions, taskActions }: BoardProps) {
  const { t } = useT();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 6 } }),
  );

  const actionsCache = useRef(new Map<string, { sectionActions: SectionLevelActions; taskActions: TaskLevelActions }>());
  const collectActions = useCallback((pid: string): { sectionActions: SectionLevelActions; taskActions: TaskLevelActions } => {
    const cached = actionsCache.current.get(pid);
    if (cached) return cached;
    const actions = {
      sectionActions: {
        onToggle: (sid: string) => sectionActions.onToggle(pid, sid),
        onAddTask: (sid: string, text: string) => sectionActions.onAddTask(pid, sid, text),
        onEdit: (sid: string, patch: SectionPatch) => sectionActions.onEdit(pid, sid, patch),
        onDelete: (sid: string) => sectionActions.onDelete(pid, sid),
      },
      taskActions: {
        onToggle: (sid: string, tid: string) => taskActions.onToggle(pid, sid, tid),
        onPrioCycle: (sid: string, tid: string) => taskActions.onPrioCycle(pid, sid, tid),
        onStatusChange: (sid: string, tid: string, status: Status) =>
          taskActions.onStatusChange(pid, sid, tid, status),
        onEdit: (sid: string, tid: string, patch: TaskPatch) => taskActions.onEdit(pid, sid, tid, patch),
        onDelete: (sid: string, tid: string) => taskActions.onDelete(pid, sid, tid),
        onUpdate: (sid: string, tid: string, patch: TaskPatch) => taskActions.onUpdate(pid, sid, tid, patch),
      },
    };
    actionsCache.current.set(pid, actions);
    return actions;
  }, [sectionActions, taskActions]);
  useEffect(() => {
    actionsCache.current.clear();
  }, [sectionActions, taskActions]);

  const filtered = useMemo(() => {
    const list = isFiltering(filters) ? projetos.filter((p) => projMatches(p, filters)) : projetos;
    return filters.prioSort ? [...list].sort((a, b) => prioSort(a.prio, b.prio)) : list;
  }, [projetos, filters]);

  const handleDragEnd = (e: DragEndEvent) => {
    const active = String(e.active.id);
    const over = e.over ? String(e.over.id) : null;
    if (!over) return;
    const drop = resolveDrop({ projetos, active, over });
    if (drop.kind === "move") {
      taskActions.onMoveTask(drop.src.pid, drop.src.sid, drop.src.tid, drop.dest.pid, drop.dest.sid, drop.index);
    } else if (drop.kind === "status") {
      taskActions.onStatusChange(drop.task.pid, drop.task.sid, drop.task.tid, drop.status);
    } else if (drop.kind === "secmove") {
      sectionActions.onMoveSection(drop.pid, drop.sid, drop.index);
    } else if (drop.kind === "projmove") {
      projectActions.onMoveProject(drop.pid, drop.overPid);
    }
  };

  let content;
  if (!projetos.length) {
    content = (
      <div className="fade-in rounded-lg border border-dashed border-[var(--line-soft)] p-10 text-center text-[var(--dim)]">
        <span className="block text-2xl">_</span>
        <p className="mb-3">{t("nenhum projeto na fila.")}</p>
        <button
          type="button"
          onClick={onNewProject}
          className="rounded-md bg-[var(--fired)] px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          {t("criar primeiro projeto")}
        </button>
      </div>
    );
  } else if (!filtered.length) {
    content = (
      <div className="fade-in rounded-lg border border-dashed border-[var(--line-soft)] p-10 text-center text-[var(--dim)]">
        <span className="block text-2xl">∅</span>
        <p className="mb-3">{t("nada casa com o filtro.")}</p>
        <button
          type="button"
          onClick={onClearFilters}
          className="rounded-md bg-[var(--fired)] px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          {t("✕ limpar filtros")}
        </button>
      </div>
    );
  } else if (filters.view === "kanban") {
    content = (
      <Kanban
        projetos={filtered}
        prioSort={filters.prioSort}
        onEditTask={(pid, sid, tid, patch) => taskActions.onEdit(pid, sid, tid, patch)}
        onDeleteTask={(pid, sid, tid) => taskActions.onDelete(pid, sid, tid)}
        onAddTask={(pid, sid, input) => sectionActions.onAddTaskFull(pid, sid, input)}
      />
    );
  } else if (filters.view === "agenda") {
    content = (
      <Agenda
        projetos={filtered}
        onToggle={(pid, sid, tid) => taskActions.onToggle(pid, sid, tid)}
        onEditTask={(pid, sid, tid, patch) => taskActions.onEdit(pid, sid, tid, patch)}
      />
    );
  } else if (filters.view === "lixeira") {
    content = (
      <Trash
        projetos={filtered}
        onRestore={(pid, sid, tid) => taskActions.onUpdate(pid, sid, tid, { deletedAt: null })}
        onPurge={(pid, sid, tid) => taskActions.onPurge(pid, sid, tid)}
      />
    );
  } else {
    content = (
      <div className="fade-in flex flex-col gap-4">
        <SortableContext
          items={filtered.map((p) => `project:${p.id}`)}
          strategy={verticalListSortingStrategy}
        >
        {filtered.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            collectActions={collectActions}
            onAddSection={(input) => projectActions.onAddSection(p.id, input)}
            onEdit={(id, patch) => projectActions.onEdit(id, patch)}
            onDelete={(id) => projectActions.onDelete(id)}
            onToggleArchive={() => projectActions.onToggleArchive(p.id)}
            onCyclePrio={() => projectActions.onCyclePrio(p.id)}
            onToggleCollapse={() => projectActions.onToggleCollapse(p.id)}
            prioSort={filters.prioSort}
            filters={filters}
          />
        ))}
        </SortableContext>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={smartCollision} onDragEnd={handleDragEnd}>
      {content}
    </DndContext>
  );
});