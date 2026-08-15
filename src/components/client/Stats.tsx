import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { BoardStats } from "@/lib/selectors";
import type { Filters } from "@/lib/filter";

interface StatsProps {
  stats: BoardStats;
  filters: Filters;
  onTogglePrioSort: () => void;
}

const fmtPct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

export function Stats({ stats, filters, onTogglePrioSort }: StatsProps) {
  const { done, total, pendentes, doneToday } = stats;
  const pct = fmtPct(done, total);

  const hint =
    filters.view === "kanban"
      ? "kanban: arraste cartão entre colunas p/ mudar status"
      : "lista: arraste tarefas entre seções/projetos p/ mover";

  return (
    <div className="text-[11px] text-[var(--muted-text)] flex flex-wrap gap-x-4 gap-y-1" role="status">
      <span>
        <span className="text-[var(--dimmer)]">total</span>{" "}
        <span data-testid="stat-total" className="font-bold text-[var(--text)]">{total}</span>
      </span>
      <span>
        <span className="text-[var(--dimmer)]">pendentes</span>{" "}
        <span data-testid="stat-pending" className="text-[var(--warn)]">{pendentes}</span>
      </span>
      <span>
        <span className="text-[var(--dimmer)]">concluídas</span>{" "}
        <span data-testid="stat-done" className="text-[var(--fired)]">{done}</span>{" "}
        <span className="text-[var(--dimmer)]">({pct}%)</span>
      </span>
      <span>
        <span className="text-[var(--dimmer)]">hoje</span>{" "}
        <span data-testid="stat-today" className="text-[var(--fired)]">+{doneToday}</span>
      </span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant={filters.prioSort ? "outline" : "ghost"}
              size="xs"
              onClick={onTogglePrioSort}
              className={`text-[var(--muted-text)] ${filters.prioSort ? "border-current text-[var(--warn)] bg-[var(--hover)]" : ""}`}
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