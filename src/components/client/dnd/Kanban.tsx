import { useRef, useState, type ReactNode } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { sortTasks } from "@/lib/filter";
import { useT } from "@/hooks/useT";
import { isDueSoon, isOverdue, fmtDate } from "@/lib/date";
import { PRIO_CLS, PRIO_KEYS, STATUS_ORDER, type Prio, type Project, type Status } from "@/lib/types";
import { TaskEditModal } from "@/components/client/board/TaskEditModal";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  onEditTask: (pid: string, sid: string, tid: string, patch: import("@/lib/types").TaskPatch) => void;
  onAddTask: (pid: string, sid: string, text: string) => void;
}

function flatTasks(projetos: Project[]): FlatTask[] {
  return projetos.flatMap((p) =>
    p.sections.flatMap((s) => s.tasks.map((task) => ({ task, pid: p.id, ptitle: p.title, sid: s.id, stitle: s.title }))),
  );
}

function KanbanTask({ item, onEdit }: { item: FlatTask; onEdit: () => void }) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `task:${item.task.id}` });
  const start = useRef<{ x: number; y: number } | null>(null);
  const overdue = isOverdue(item.task.due, item.task.status);
  const dueSoon = isDueSoon(item.task.due, item.task.status);
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`cursor-grab rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-2.5 py-1.5 text-xs hover:bg-[var(--panel-3)] ${isDragging ? "opacity-90 shadow-lg ring-2 ring-[var(--fired)]/70 z-10" : ""}`}
      data-testid="kanban-task"
      aria-label={t("editar tarefa X").replace("X", item.task.text)}
      title={t("clique pra editar, arraste pra mover")}
      onPointerDown={(e) => {
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
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
        <span className={`shrink-0 rounded border px-1 py-0.5 text-[9px] font-bold ${PRIO_CLS[item.task.prio]}`}>
          {PRIO_KEYS[item.task.prio]}
        </span>
        {item.task.subs.length > 0 && (
          <span
            className="shrink-0 rounded border border-[var(--line-soft)] px-1 py-0.5 text-[9px] text-[var(--dim)]"
            title={`${item.task.subs.filter((s) => s.done).length}/${item.task.subs.length} sub-tarefas concluídas`}
            aria-label={`sub-tarefas ${item.task.subs.filter((s) => s.done).length}/${item.task.subs.length}`}
          >
            {item.task.subs.filter((s) => s.done).length}/{item.task.subs.length}
          </span>
        )}
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

function ColumnAddRow({
  draft,
  pid,
  projetos,
  empty,
  onDraftChange,
  onPidChange,
  onSubmit,
}: {
  draft: string;
  pid: string | undefined;
  projetos: Project[];
  empty: boolean;
  onDraftChange: (v: string) => void;
  onPidChange: (v: string | null) => void;
  onSubmit: () => void;
}) {
  const { t } = useT();
  return (
    <div
      className={`flex items-center gap-1 px-2 pb-2 pt-1.5 transition-opacity ${
        empty ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
      }`}
    >
      <Select value={pid} onValueChange={onPidChange} disabled={!projetos.length}>
        <SelectTrigger
          size="sm"
          aria-label={t("projeto")}
          className="h-7 max-w-32 shrink-0 border-[var(--line)] bg-[var(--field)] px-2 text-[11px] text-[var(--muted-text)] hover:border-[var(--muted-text)] hover:text-[var(--text)]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {projetos.map((p) => (
            <SelectItem key={p.id} value={p.id} className="py-1 text-xs">
              {p.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) {
            e.preventDefault();
            onSubmit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            onDraftChange("");
          }
        }}
        disabled={!projetos.length}
        className="h-7 min-w-0 flex-1 border-[var(--line)] bg-[var(--field)] px-2 text-xs"
        placeholder={`${t("nova tarefa")}…`}
        autoComplete="off"
        spellCheck={false}
        aria-label={t("nova tarefa")}
      />
    </div>
  );
}

function DroppableCol({
  status,
  items,
  onEdit,
  addRow,
  empty,
}: {
  status: Status;
  items: FlatTask[];
  onEdit: (item: FlatTask) => void;
  addRow: ReactNode;
  empty: boolean;
}) {
  const { status: statusLabel } = useT();
  const { setNodeRef, isOver } = useDroppable({ id: `k:${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`group flex min-w-[200px] flex-1 flex-col rounded-lg border ${isOver ? "border-[var(--fired)]/60" : "border-[var(--line)]"} bg-[var(--panel)]`}
    >
      <header className="border-b border-[var(--line)] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-text)]">
        {statusLabel(status)} <span className="text-[var(--dimmer)]">{items.length}</span>
      </header>
      {addRow}
      <div className={`flex flex-col gap-1 px-2 pb-2 ${empty ? "" : "pt-1"}`}>
        {items.map((item) => (
          <KanbanTask key={item.task.id} item={item} onEdit={() => onEdit(item)} />
        ))}
      </div>
    </div>
  );
}

export function Kanban({ projetos, prioSort, onEditTask, onAddTask }: KanbanProps) {
  const { t } = useT();
  const [editing, setEditing] = useState<FlatTask | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<Status, string>>>({});
  const [pids, setPids] = useState<Partial<Record<Status, string>>>({});

  if (!projetos.length) {
    return (
      <div className="fade-in rounded-lg border border-dashed border-[var(--line-soft)] p-10 text-center text-[var(--dim)]">
        <span className="block text-2xl">≡</span>
        <p>{t("nenhuma tarefa para o kanban")}.</p>
      </div>
    );
  }

  const available = projetos.filter((p) => !p.archived);
  const colPid = (s: Status): string | undefined =>
    pids[s] && available.some((p) => p.id === pids[s]) ? pids[s] : available[0]?.id;

  const submit = (s: Status) => {
    const text = drafts[s]?.trim();
    const pid = colPid(s);
    if (!text || !pid) return;
    const sid = projetos.find((p) => p.id === pid)?.sections[0]?.id;
    if (!sid) return;
    onAddTask(pid, sid, text);
    setDrafts((d) => ({ ...d, [s]: "" }));
  };

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
            empty={items.length === 0}
            addRow={
              <ColumnAddRow
                draft={drafts[status] ?? ""}
                pid={colPid(status)}
                projetos={available}
                empty={items.length === 0}
                onDraftChange={(v) => setDrafts((d) => ({ ...d, [status]: v }))}
                onPidChange={(v) => setPids((d) => ({ ...d, [status]: v ?? undefined }))}
                onSubmit={() => submit(status)}
              />
            }
          />
        ))}
      </div>
      {editing && (
        <TaskEditModal
          task={editing.task}
          onSubmit={(patch) => {
            onEditTask(editing.pid, editing.sid, editing.task.id, patch);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </>
  );
}