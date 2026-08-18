import { useT } from "@/hooks/useT";
import type { BoardStats } from "@/lib/selectors";
import type { View } from "@/lib/filter";


interface StatsProps {
  stats: BoardStats;
  view: View;
}

const fmtPct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

export function Stats({ stats, view }: StatsProps) {
  const { t } = useT();
  const { done, total, pendentes, doneToday } = stats;
  const pct = fmtPct(done, total);

  const hint =
    view === "kanban"
      ? t("kanban: arraste cartão entre colunas p/ mudar status")
      : view === "agenda"
        ? t("agenda: clique numa tarefa p/ editar")
        : t("lista: arraste tarefas entre seções/projetos p/ mover");

  return (
    <div className="text-[11px] leading-[26px] text-[var(--muted-text)] flex flex-wrap items-center gap-x-4 gap-y-1" role="status">
      <span>
        <span className="text-[var(--dimmer)]">{t("total")}</span>{" "}
        <span data-testid="stat-total" className="font-bold text-[var(--text)]">{total}</span>
      </span>
      <span>
        <span className="text-[var(--dimmer)]">{t("pendentes")}</span>{" "}
        <span data-testid="stat-pending" className="text-[var(--warn)]">{pendentes}</span>
      </span>
      <span>
        <span className="text-[var(--dimmer)]">{t("concluída")}s</span>{" "}
        <span data-testid="stat-done" className="text-[var(--fired)]">{done}</span>{" "}
        <span className="text-[var(--dimmer)]">({pct}%)</span>
      </span>
      <span>
        <span className="text-[var(--dimmer)]">{t("hoje")}</span>{" "}
        <span data-testid="stat-today" className="text-[var(--fired)]">+{doneToday}</span>
      </span>
      <span className="ml-auto text-[var(--dim)] hidden sm:inline">{hint}</span>
    </div>
  );
}