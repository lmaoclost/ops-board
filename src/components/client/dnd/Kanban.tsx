import { useRef, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { sortTasks } from "@/lib/filter";
import { useT } from "@/hooks/useT";
import { isDueSoon, isOverdue, fmtDate } from "@/lib/date";
import { PRIO_CLS, PRIO_KEYS, STATUS_ORDER, type AddTaskInput, type Project, type Status, type Task, type TaskPatch } from "@/lib/types";
import { TaskEditModal } from "@/components/client/board/TaskEditModal";
import { NEXT_PRIO } from "@/components/client/board/TaskRow";

interface FlatTask {
  task: Project["sections"][number]["tasks"][number];
  pid: string;
  ptitle: string;
  sid: string;
  stitle: string;
}

interface KanbanProps {
  projetos: Project[];
  prioSort?: boolean;
  onEditTask: (pid: string, sid: string, tid: string, patch: TaskPatch) => void;
  onDeleteTask: (pid: string, sid: string, tid: string) => void;
  onAddTask: (pid: string, sid: string, input: AddTaskInput) => void;
}

function flatTasks(projetos: Project[]): FlatTask[] {
  return projetos.flatMap((p) =>
    p.sections.flatMap((s) => s.tasks.map((task) => ({ task, pid: p.id, ptitle: p.title, sid: s.id, stitle: s.title }))),
  );
}

function KanbanTask({
  item,
  onEdit,
  onUpdate,
  onDelete,
  onSubs,
}: {
  item: FlatTask;
  onEdit: () => void;
  onUpdate: (patch: TaskPatch) => void;
  onDelete: () => void;
  onSubs: () => void;
}) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `task:${item.task.id}` });
  const { setNodeRef: setCardDropRef } = useDroppable({ id: `task:${item.task.id}` });
  const setRefs = (el: HTMLDivElement | null) => {
    setNodeRef(el);
    setCardDropRef(el);
  };
  const start = useRef<{ x: number; y: number } | null>(null);
  const overdue = isOverdue(item.task.due, item.task.status);
  const dueSoon = isDueSoon(item.task.due, item.task.status);
  const onInteractive = (e: { target: EventTarget }) => (e.target as HTMLElement).closest("button") != null;
  return (
    <div
      ref={setRefs}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`cursor-grab rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-2.5 py-1.5 text-xs hover:bg-[var(--panel-3)] ${isDragging ? "opacity-90 shadow-lg ring-2 ring-[var(--fired)]/70 z-10" : ""}`}
      data-testid="kanban-task"
      aria-label={t("editar tarefa X").replace("X", item.task.text)}
      title={item.task.text}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        if (onInteractive(e)) return;
        const s = start.current;
        start.current = null;
        if (!s) {
          onEdit();
          return;
        }
        const moved = Math.abs(e.clientX - s.x) > 6 || Math.abs(e.clientY - s.y) > 6;
        if (!moved) onEdit();
      }}
      onKeyDown={(e) => {
        if (onInteractive(e)) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-1.5">
        <span className="min-w-0 flex-1">
          <span className={item.task.status === "done" ? "line-through text-[var(--dim)]" : "text-[var(--text)]"}>
            {item.task.text}
          </span>
          {item.task.note && <span className="text-[var(--dim)]"> — {item.task.note}</span>}
          <span className="mt-0.5 block text-[10px] text-[var(--dim)]">
            {item.ptitle} · {item.stitle}
          </span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ prio: NEXT_PRIO[item.task.prio] });
          }}
          aria-label={t("prioridade: clique pra mudar")}
          title={t("prioridade: clique pra mudar")}
          className={`shrink-0 rounded border px-1 py-0.5 text-[9px] font-bold ${PRIO_CLS[item.task.prio]}`}
        >
          {PRIO_KEYS[item.task.prio]}
        </button>
        {item.task.subs.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSubs();
            }}
            title={`${item.task.subs.filter((s) => s.status === "done").length}/${item.task.subs.length} sub-tarefas concluídas`}
            aria-label={`sub-tarefas ${item.task.subs.filter((s) => s.status === "done").length}/${item.task.subs.length}`}
            className="shrink-0 rounded border border-[var(--line-soft)] px-1 py-0.5 text-[9px] text-[var(--dim)] transition-colors hover:border-[var(--muted-text)] hover:text-[var(--text)]"
          >
            {item.task.subs.filter((s) => s.status === "done").length}/{item.task.subs.length}
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="excluir"
          aria-label="excluir"
          className="shrink-0 rounded px-1 text-xs leading-none text-[var(--dimmer)] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-[var(--fired)]"
        >
          ×
        </button>
      </div>
      <div className="mt-1 flex items-center gap-1.5">
        {item.task.blocked && (
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--gave)]" title={t("bloqueada")}>
            ⛔ bloqueada
          </span>
        )}
        {item.task.due &&
          (overdue ? (
            <span className="text-[10px] font-bold uppercase text-[var(--gave)]" title={`vencimento ${item.task.due}`}>
              {fmtDate(item.task.due)} vencida
            </span>
          ) : (
            <span
              className={`text-[10px] font-semibold ${dueSoon ? "text-[var(--warn)]" : "text-[var(--muted-text)]"}`}
              title={`vencimento ${item.task.due}`}
            >
              {fmtDate(item.task.due)}
            </span>
          ))}
      </div>
    </div>
  );
}

function DroppableCol({
  status,
  items,
  onEdit,
  onUpdate,
  onDelete,
  onSubs,
  onCreate,
  empty,
}: {
  status: Status;
  items: FlatTask[];
  onEdit: (item: FlatTask) => void;
  onUpdate: (item: FlatTask, patch: TaskPatch) => void;
  onDelete: (item: FlatTask) => void;
  onSubs: (item: FlatTask) => void;
  onCreate: () => void;
  empty: boolean;
}) {
  const { t, status: statusLabel } = useT();
  const { setNodeRef, isOver } = useDroppable({ id: `k:${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`group flex min-w-[200px] flex-1 flex-col rounded-lg border ${isOver ? "border-[var(--fired)]/60" : "border-[var(--line)]"} bg-[var(--panel)]`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-3 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-text)]">
          {statusLabel(status)} <span className="text-[var(--dimmer)]">{items.length}</span>
        </span>
        <button
          type="button"
          onClick={onCreate}
          aria-label={`${t("nova tarefa em")} ${statusLabel(status)}`}
          title={`${t("nova tarefa em")} ${statusLabel(status)}`}
          className="grid h-5 w-5 shrink-0 place-items-center rounded border border-[var(--line-soft)] text-xs leading-none text-[var(--muted-text)] transition-colors hover:border-[var(--muted-text)] hover:text-[var(--text)]"
        >
          +
        </button>
      </header>
      <div className={`flex flex-col gap-1 px-2 pb-2 ${empty ? "" : "pt-1"}`}>
        {items.map((item) => (
          <KanbanTask
            key={item.task.id}
            item={item}
            onEdit={() => onEdit(item)}
            onUpdate={(patch) => onUpdate(item, patch)}
            onDelete={() => onDelete(item)}
            onSubs={() => onSubs(item)}
          />
        ))}
      </div>
    </div>
  );
}

const emptyTask: Task = {
  id: "",
  text: "",
  status: "todo",
  note: "",
  blocked: false,
  prio: 3,
  due: "",
  doneAt: null,
  subs: [],
};

export function Kanban({ projetos, prioSort, onEditTask, onDeleteTask, onAddTask }: KanbanProps) {
  const { t } = useT();
  const [editing, setEditing] = useState<FlatTask | null>(null);
  const [creating, setCreating] = useState<Status | null>(null);
  const [focusSubs, setFocusSubs] = useState(false);

  if (!projetos.length) {
    return (
      <div className="fade-in rounded-lg border border-dashed border-[var(--line-soft)] p-10 text-center text-[var(--dim)]">
        <span className="block text-2xl">≡</span>
        <p>{t("nenhuma tarefa para o kanban")}.</p>
      </div>
    );
  }

  const available = projetos.filter((p) => !p.archived);
  const tasks = sortTasks(flatTasks(projetos), !!prioSort, (i) => i.task.prio);
  const grouped = STATUS_ORDER.map((s) => ({ status: s, items: tasks.filter((t) => t.task.status === s) }));

  return (
    <>
      <div className="fade-in flex flex-wrap gap-3">
        {grouped.map(({ status, items }) => (
          <DroppableCol
            key={status}
            status={status}
            items={items}
            onEdit={setEditing}
            onSubs={(item) => {
              setEditing(item);
              setFocusSubs(true);
            }}
            onUpdate={(item, patch) => onEditTask(item.pid, item.sid, item.task.id, patch)}
            onDelete={(item) => onDeleteTask(item.pid, item.sid, item.task.id)}
            onCreate={() => {
              if (available.length) setCreating(status);
            }}
            empty={items.length === 0}
          />
        ))}
      </div>
      {editing && (
        <TaskEditModal
          task={editing.task}
          focusSubs={focusSubs}
          onSubmit={(patch) => {
            onEditTask(editing.pid, editing.sid, editing.task.id, patch);
            setEditing(null);
            setFocusSubs(false);
          }}
          onCancel={() => {
            setEditing(null);
            setFocusSubs(false);
          }}
        />
      )}
      {creating && (
        <TaskEditModal
          task={emptyTask}
          status={creating}
          projetos={available}
          onSubmit={(patch, pid) => {
            const proj = projetos.find((p) => p.id === pid);
            const sid = proj?.sections[0]?.id;
            if (pid && sid && patch.text) {
              onAddTask(pid, sid, { ...patch, text: patch.text, status: creating });
              setCreating(null);
            }
          }}
          onCancel={() => setCreating(null)}
        />
      )}
    </>
  );
}
