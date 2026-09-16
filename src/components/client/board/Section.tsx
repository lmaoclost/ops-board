import { memo, useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Modal } from "@/components/client/Modal";
import { ConfirmDelete } from "@/components/client/ConfirmDelete";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { sortTasks, visibleTasks, type Filters } from "@/lib/filter";
import type { TaskPatch, SectionPatch, Task } from "@/lib/types";
import { SortableTaskItem } from "@/components/client/dnd/SortableTaskItem";
import { TaskEditModal } from "@/components/client/board/TaskEditModal";

export interface SectionTaskActions {
  onToggle: (tid: string) => void;
  onPrioCycle: (tid: string) => void;
  onStatusChange: (tid: string, status: Task["status"]) => void;
  onEdit: (tid: string, patch: TaskPatch) => void;
  onDelete: (tid: string) => void;
  onUpdate: (tid: string, patch: TaskPatch) => void;
}

export interface SectionProps {
  projectId: string;
  section: {
    id: string;
    title: string;
    tasks: Task[];
    notes: string;
    collapsed: boolean;
  };
  onToggleSection: () => void;
  onAddTask: (text: string) => void;
  onEdit: (patch: SectionPatch) => void;
  onDelete: () => void;
  taskActions: SectionTaskActions;
  prioSort?: boolean;
  filters?: Filters;
}

export const Section = memo(function Section({ projectId, section, onToggleSection, onAddTask, onEdit, onDelete, taskActions, prioSort, filters }: SectionProps) {
  const { t } = useT();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `sec:${projectId}:${section.id}` });
  const { setNodeRef: setEndRef, isOver: isEndOver } = useDroppable({ id: `sec-end:${projectId}:${section.id}` });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `section:${projectId}:${section.id}`,
  });

  const open = !section.collapsed;
  const doneCount = section.tasks.filter((t) => t.status === "done").length;

  const visible = useMemo(
    () =>
      sortTasks(
        filters ? visibleTasks(section.tasks, filters) : section.tasks.filter((t) => !t.deletedAt),
        !!prioSort,
        (t) => t.prio,
      ),
    [section.tasks, filters, prioSort],
  );
  const itemIds = useMemo(() => visible.map((t) => `task:${t.id}`), [visible]);

  const editing = editingId ? section.tasks.find((t) => t.id === editingId) : null;

  const submitEdit = (v: Record<string, string | boolean>) => {
    setRenaming(false);
    if (!String(v.title).trim()) return;
    onEdit({ title: String(v.title).trim(), notes: String(v.notes ?? "") });
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition: isDragging ? "none" : transition }}
      className={`border-t border-dashed border-[var(--line-soft)] first:border-t-0 ${isDragging ? "opacity-90 shadow-lg ring-2 ring-[var(--fired)]/70 z-10" : ""}`}
    >
      <div className="flex w-full items-center gap-2 bg-[var(--panel-2)] px-3.5 py-2 hover:bg-[var(--panel-3)]">
        <button
          type="button"
          aria-label={t("arrastar seção p/ reordenar")}
          title={t("arrastar seção p/ reordenar")}
          className="flex shrink-0 cursor-grab touch-none items-center text-[var(--dimmer)] transition-colors hover:text-[var(--text)] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={onToggleSection}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          title={t("expande/recolhe seção")}
        >
          <span className={`text-[11px] text-[var(--dimmer)] transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
          <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--muted-text)]">{section.title}</h3>
          <span className="text-[11px] text-[var(--dimmer)]">
            {doneCount}/{section.tasks.length}
          </span>
          {section.notes && <span className="ml-auto hidden text-[11px] text-[var(--dimmer)] sm:inline">{t("notas")}</span>}
        </button>
        <span className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  title={t("ações da seção")}
                  aria-label={t("ações da seção")}
                >
                  ⋯
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="bg-[var(--panel-2)] text-[var(--text)]">
              <DropdownMenuItem
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setRenaming(true);
                }}
              >
                {t("editar seção")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--line)]" />
              <DropdownMenuItem
                variant="destructive"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingDelete(true);
                }}
              >
                {t("excluir seção")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      {open && (
        <div className="px-2 pb-2">
          {section.notes && (
            <div className="whitespace-pre-wrap break-words px-2 pb-2 text-[11.5px] leading-relaxed text-[var(--muted-text)]">
              {section.notes}
            </div>
          )}
          <div
            ref={setDropRef}
            className={`flex flex-col gap-0.5 rounded-md ${isOver ? "outline outline-1 outline-[var(--fired)]/50" : ""}`}
          >
            <SortableContext
              items={itemIds}
              strategy={verticalListSortingStrategy}
            >
              {visible.map((t) => (
                <SortableTaskItem
                  key={t.id}
                  task={t}
                  onToggle={() => taskActions.onToggle(t.id)}
                  onPrioCycle={() => taskActions.onPrioCycle(t.id)}
                  onStatusChange={(status) => taskActions.onStatusChange(t.id, status)}
                  onEdit={() => setEditingId(t.id)}
                  onDelete={() => taskActions.onDelete(t.id)}
                  onUpdate={(patch) => taskActions.onUpdate(t.id, patch)}
                />
              ))}
            </SortableContext>
            <div
              ref={setEndRef}
              className={`h-2 rounded ${isEndOver ? "bg-[var(--fired)]/30" : ""}`}
              title={t("soltar no fim")}
            />
          </div>
          <div className="flex items-center gap-2 px-2 pt-2">
            <span className="text-[var(--fired)] font-bold text-xs" aria-hidden>
              &gt;
            </span>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) {
                  e.preventDefault();
                  onAddTask(draft.trim());
                  setDraft("");
                }
              }}
              className="min-w-0 flex-1 bg-[var(--field)] border-[var(--line)]"
              placeholder={`${t("nova tarefa")}…`}
              autoComplete="off"
              spellCheck={false}
              aria-label={t("nova tarefa")}
            />
          </div>
        </div>
      )}

      {renaming && (
        <Modal
          title={t("editar seção")}
          submitLabel={t("salvar")}
          fields={[
            { key: "title", label: t("título"), value: section.title, required: true },
            { key: "notes", label: t("nota"), type: "textarea", value: section.notes },
          ]}
          onSubmit={submitEdit}
          onCancel={() => setRenaming(false)}
        />
      )}

      {editing && (
        <TaskEditModal
          task={editing}
          onSubmit={(patch) => {
            taskActions.onEdit(editing.id, patch);
            setEditingId(null);
          }}
          onCancel={() => setEditingId(null)}
        />
      )}

      {confirmingDelete && (
        <ConfirmDelete
          title={t("excluir seção?")}
          message={t("excluir_secao_txt").replace("{n}", String(section.tasks.length))}
          onConfirm={() => {
            setConfirmingDelete(false);
            onDelete();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
});