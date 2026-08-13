import { countByStatus, doneTodayCount } from "@/lib/selectors";
import type { Project } from "@/lib/types";
import type { Filters } from "@/lib/filter";
import { todayISO } from "@/lib/date";

interface StatsProps {
  projetos: Project[];
  filters: Filters;
  onTogglePrioSort: () => void;
}

const fmtPct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

export function Stats({ projetos, filters, onTogglePrioSort }: StatsProps) {
  const counts = countByStatus(projetos);
  const done = counts.done;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const pendentes = total - done;
  const doneToday = doneTodayCount(projetos);

  const pct = fmtPct(done, total);

  const hint =
    filters.view === "kanban"
      ? "kanban: arraste cartão pra coluna p/ mudar status"
      : "status-dock: arraste tarefas p/ mudar status";

  return (
    <div className="text-[11px] text-zinc-500 flex flex-wrap gap-x-4 gap-y-1" role="status">
      <span>
        <span className="text-zinc-700">total</span>{" "}
        <span className="font-bold text-zinc-200">{total}</span>
      </span>
      <span>
        <span className="text-zinc-700">pendentes</span>{" "}
        <span className="text-amber-400">{pendentes}</span>
      </span>
      <span>
        <span className="text-zinc-700">concluídas</span>{" "}
        <span className="text-emerald-400">{done}</span>{" "}
        <span className="text-zinc-700">({pct}%)</span>
      </span>
      <span>
        <span className="text-zinc-700">hoje</span>{" "}
        <span className="text-emerald-400">+{doneToday}</span>
      </span>
      <button
        type="button"
        onClick={onTogglePrioSort}
        className={`chip ${filters.prioSort ? "text-amber-400 border-current" : "text-zinc-500"}`}
        title="ordenar por prioridade (P1 no topo)"
      >
        ↕ prio
      </button>
      <span className="ml-auto text-zinc-600 hidden sm:inline">{hint}</span>
    </div>
  );
}