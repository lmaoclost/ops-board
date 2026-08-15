import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { sortTasks } from "@/lib/filter";
import { STATUS_LABEL, STATUS_ORDER, type Project, type Status } from "@/lib/types";

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
}

function flatTasks(projetos: Project[]): FlatTask[] {
  return projetos.flatMap((p) =>
    p.sections.flatMap((s) => s.tasks.map((task) => ({ task, pid: p.id, ptitle: p.title, sid: s.id, stitle: s.title }))),
  );
}

function KanbanTask({ item }: { item: FlatTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `task:${item.task.id}` });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`cursor-grab rounded-md border border-[var(--line)] bg-[var(--panel-2)] px-2.5 py-1.5 text-xs ${isDragging ? "opacity-50" : ""}`}
      {...attributes}
      {...listeners}
    >
      <span className={item.task.status === "done" ? "line-through text-[var(--dim)]" : "text-[var(--text)]"}>
        {item.task.text}
      </span>
      <span className="mt-0.5 block text-[10px] text-[var(--dim)]">
        {item.ptitle} · {item.stitle}
      </span>
      {item.task.note && <span className="text-[var(--dim)]"> — {item.task.note}</span>}
    </div>
  );
}

function DroppableCol({ status, items }: { status: Status; items: FlatTask[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `k:${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[200px] flex-1 flex-col rounded-lg border ${isOver ? "border-[var(--fired)]/60" : "border-[var(--line)]"} bg-[var(--panel)]`}
    >
      <header className="border-b border-[var(--line)] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted-text)]">
        {STATUS_LABEL[status]} <span className="text-[var(--dimmer)]">{items.length}</span>
      </header>
      <div className="flex min-h-[48px] flex-col gap-1 p-2">
        {items.map((item) => (
          <KanbanTask key={item.task.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function Kanban({ projetos, prioSort }: KanbanProps) {
  if (!projetos.length) {
    return (
      <div className="fade-in rounded-lg border border-dashed border-[var(--line-soft)] p-10 text-center text-[var(--dim)]">
        <span className="block text-2xl">≡</span>
        <p>nenhuma tarefa para o kanban.</p>
      </div>
    );
  }

  const tasks = sortTasks(flatTasks(projetos), !!prioSort, (i) => i.task.prio);

  return (
    <div className="fade-in flex flex-wrap gap-3">
      {STATUS_ORDER.map((s) => (
        <DroppableCol key={s} status={s} items={tasks.filter((t) => t.task.status === s)} />
      ))}
    </div>
  );
}