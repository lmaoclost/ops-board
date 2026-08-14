import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Modal } from "@/components/client/Modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { sortTasks } from "@/lib/filter";
import type { TaskPatch, Task } from "@/lib/types";
import { SortableTaskItem } from "@/components/client/dnd/SortableTaskItem";
import { esc } from "@/lib/escape";

export interface SectionTaskActions {
  onToggle: (tid: string) => void;
  onPrioCycle: (tid: string) => void;
  onStatusChange: (tid: string, status: Task["status"]) => void;
  onEdit: (tid: string, patch: TaskPatch) => void;
  onDelete: (tid: string) => void;
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
  onRename: (title: string) => void;
  onDelete: () => void;
  taskActions: SectionTaskActions;
  prioSort?: boolean;
}

export function Section({ projectId, section, onToggleSection, onAddTask, onRename, onDelete, taskActions, prioSort }: SectionProps) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `sec:${projectId}:${section.id}` });

  const open = !section.collapsed;
  const doneCount = section.tasks.filter((t) => t.status === "done").length;

  const editing = editingId ? section.tasks.find((t) => t.id === editingId) : null;

  const submitRename = (v: Record<string, string | boolean>) => {
    setRenaming(false);
    if (String(v.title).trim()) onRename(String(v.title).trim());
  };

  const submitTask = (v: Record<string, string | boolean>) => {
    if (editingId) {
      taskActions.onEdit(editingId, {
        text: String(v.text).trim(),
        note: String(v.note).trim(),
        blocked: Boolean(v.blocked),
        prio: (Number(v.prio) || 3) as Task["prio"],
        due: String(v.due ?? ""),
      });
      setEditingId(null);
    }
  };

  return (
    <div className="border-t border-dashed border-[var(--line-soft)] first:border-t-0">
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleSection}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleSection();
          }
        }}
        className="flex w-full items-center gap-2 bg-[var(--panel-2)] px-3.5 py-2 text-left hover:bg-[var(--panel-3)]"
        title="expandir/recolher"
      >
        <span className={`text-[11px] text-[var(--dimmer)] transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--muted-text)]">{section.title}</h3>
        <span className="text-[11px] text-[var(--dimmer)]">
          {doneCount}/{section.tasks.length}
        </span>
        {section.notes && <span className="ml-auto hidden text-[11px] text-[var(--dimmer)] sm:inline">notas</span>}
        <span className="ml-auto flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => e.stopPropagation()}
                  title="ações da seção"
                  aria-label="ações da seção"
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
                renomear seção
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--line)]" />
              <DropdownMenuItem
                variant="destructive"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                excluir seção
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      {open && (
        <div className="px-2 pb-2">
          {section.notes && (
            <div className="whitespace-pre-wrap break-words px-2 pb-2 text-[11.5px] leading-relaxed text-[var(--muted-text)]">
              {esc(section.notes)}
            </div>
          )}
          <div
            ref={setDropRef}
            className={`flex flex-col gap-0.5 rounded-md ${isOver ? "outline outline-1 outline-emerald-400/50" : ""}`}
          >
            {sortTasks(section.tasks, !!prioSort, (t) => t.prio).map((t) => (
              <SortableTaskItem
                key={t.id}
                task={t}
                onToggle={() => taskActions.onToggle(t.id)}
                onPrioCycle={() => taskActions.onPrioCycle(t.id)}
                onStatusChange={(status) => taskActions.onStatusChange(t.id, status)}
                onEdit={() => setEditingId(t.id)}
                onDelete={() => taskActions.onDelete(t.id)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 px-2 pt-2">
            <span className="text-emerald-400 font-bold text-xs" aria-hidden>
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
              placeholder="nova tarefa…"
              autoComplete="off"
              spellCheck={false}
              aria-label="nova tarefa"
            />
          </div>
        </div>
      )}

      {renaming && (
        <Modal
          title="renomear seção"
          submitLabel="salvar"
          fields={[{ key: "title", label: "título", value: section.title }]}
          onSubmit={submitRename}
          onCancel={() => setRenaming(false)}
        />
      )}

      {editing && (
        <Modal
          title="editar tarefa"
          submitLabel="salvar"
          fields={[
            { key: "text", label: "tarefa", value: editing.text },
            {
              key: "prio",
              label: "prioridade",
              type: "select",
              value: editing.prio,
              options: [
                { value: 1, label: "P1 — urgente" },
                { value: 2, label: "P2 — em breve" },
                { value: 3, label: "P3 — normal" },
              ],
            },
            { key: "due", label: "vencimento", type: "date", value: editing.due },
            { key: "note", label: "nota", type: "textarea", value: editing.note, placeholder: "detalhe opcional…" },
            { key: "blocked", label: "marcar como bloqueada / stuck", type: "checkbox", value: editing.blocked },
          ]}
          onSubmit={submitTask}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}