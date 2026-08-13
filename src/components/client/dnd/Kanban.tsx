import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { STATUS_LABEL, STATUS_ORDER, type Project, type Status } from "@/lib/types";

interface FlatTask {
  task: Project["sections"][number]["tasks"][number];
  pid: string;
  sid: string;
}

interface KanbanProps {
  projetos: Project[];
}

function flatTasks(projetos: Project[]): FlatTask[] {
  return projetos.flatMap((p) => p.sections.flatMap((s) => s.tasks.map((task) => ({ task, pid: p.id, sid: s.id }))));
}

function KanbanTask({ item }: { item: FlatTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `task:${item.task.id}` });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`cursor-grab rounded-md border border-zinc-800 bg-[#151c26] px-2.5 py-1.5 text-xs ${isDragging ? "opacity-50" : ""}`}
      {...attributes}
      {...listeners}
    >
      <span className={item.task.status === "done" ? "line-through text-zinc-600" : "text-zinc-300"}>
        {item.task.text}
      </span>
      {item.task.note && <span className="text-zinc-600"> — {item.task.note}</span>}
    </div>
  );
}

function DroppableCol({ status, items }: { status: Status; items: FlatTask[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `k:${status}` });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-w-[200px] flex-1 flex-col rounded-lg border ${isOver ? "border-emerald-400/60" : "border-zinc-800"} bg-[#0f141b]`}
    >
      <header className="border-b border-zinc-800 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
        {STATUS_LABEL[status]} <span className="text-zinc-700">{items.length}</span>
      </header>
      <div className="flex min-h-[48px] flex-col gap-1 p-2">
        {items.map((item) => (
          <KanbanTask key={item.task.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function Kanban({ projetos }: KanbanProps) {
  if (!projetos.length) {
    return (
      <div className="fade-in rounded-lg border border-dashed border-zinc-700 p-10 text-center text-zinc-600">
        <span className="block text-2xl">≡</span>
        <p>nenhuma tarefa para o kanban.</p>
      </div>
    );
  }

  const tasks = flatTasks(projetos);

  return (
    <div className="fade-in flex flex-wrap gap-3">
      {STATUS_ORDER.map((s) => (
        <DroppableCol key={s} status={s} items={tasks.filter((t) => t.task.status === s)} />
      ))}
    </div>
  );
}