import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
    <div className="text-[11px] text-[var(--muted-text)] flex flex-wrap gap-x-4 gap-y-1" role="status">
      <span>
        <span className="text-[var(--dimmer)]">total</span>{" "}
        <span className="font-bold text-[var(--text)]">{total}</span>
      </span>
      <span>
        <span className="text-[var(--dimmer)]">pendentes</span>{" "}
        <span className="text-amber-400">{pendentes}</span>
      </span>
      <span>
        <span className="text-[var(--dimmer)]">concluídas</span>{" "}
        <span className="text-emerald-400">{done}</span>{" "}
        <span className="text-[var(--dimmer)]">({pct}%)</span>
      </span>
      <span>
        <span className="text-[var(--dimmer)]">hoje</span>{" "}
        <span className="text-emerald-400">+{doneToday}</span>
      </span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant={filters.prioSort ? "outline" : "ghost"}
              size="xs"
              onClick={onTogglePrioSort}
              className={`text-[var(--muted-text)] ${filters.prioSort ? "border-current text-amber-400 bg-[var(--hover)]" : ""}`}
            >
              ↕ prio
            </Button>
          }
        />
        <TooltipContent side="bottom">ordenar por prioridade (P1 no topo)</TooltipContent>
      </Tooltip>
      <span className="ml-auto text-[var(--dim)] hidden sm:inline">{hint}</span>
    </div>
  );
}