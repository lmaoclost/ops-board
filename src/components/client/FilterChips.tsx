import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StatusFilter } from "@/lib/filter";
import type { Status } from "@/lib/types";
import { useT } from "@/hooks/useT";
import {} from "@/lib/types";

export interface ChipDef {
  key: StatusFilter;
  cls: string;
  full: string;
}

const CHIPS: ChipDef[] = [
  { key: "todo", cls: "text-[var(--chip-todo)]", full: "text-[var(--todo)]" },
  { key: "doing", cls: "text-[var(--chip-flow)]", full: "text-[var(--flow)]" },
  {
    key: "waiting",
    cls: "text-[var(--chip-warn)]",
    full: "text-[var(--warn)]",
  },
  { key: "done", cls: "text-[var(--chip-fired)]", full: "text-[var(--fired)]" },
  {
    key: "blocked",
    cls: "text-[var(--chip-gave)]",
    full: "text-[var(--gave)]",
  },
];

interface FilterChipsProps {
  counts: Record<Status, number>;
  blockedCount: number;
  archivedCount: number;
  archivedActive: boolean;
  active: StatusFilter;
  filtering: boolean;
  onToggleStatus: (status: StatusFilter) => void;
  onToggleArchived: () => void;
  onClear: () => void;
  prioSort: boolean;
  onTogglePrioSort: () => void;
}

export function FilterChips({
  counts,
  blockedCount,
  archivedCount,
  archivedActive,
  active,
  filtering,
  onToggleStatus,
  onToggleArchived,
  onClear,
  prioSort,
  onTogglePrioSort,
}: FilterChipsProps) {
  const { t, status } = useT();
  return (
    <div
      className="flex flex-wrap justify-center items-center gap-1.5"
      role="group"
      aria-label={t("filtros por status")}
    >
      {CHIPS.map(({ key, cls, full }) => {
        const count = key === "blocked" ? blockedCount : counts[key as Status];
        const isActive = active === key;
        return (
          <Button
            key={key}
            type="button"
            variant={isActive ? "outline" : "ghost"}
            size="xs"
            onClick={() => onToggleStatus(key)}
            title={`${t("filtro")}: ${status(key as Status)}`}
            aria-pressed={isActive}
            className={`${isActive ? `${full} border-current bg-[var(--hover)]` : cls}`}
          >
            {status(key as Status)}
            <span className="text-[var(--chip-count)]">{count}</span>
          </Button>
        );
      })}
      <Button
        type="button"
        variant={archivedActive ? "outline" : "ghost"}
        size="xs"
        onClick={onToggleArchived}
        title={t("mostrar/ocultar projetos arquivados")}
        aria-pressed={archivedActive}
        className={`${archivedActive ? "text-[var(--violet)] border-current bg-[var(--hover)]" : "text-[var(--chip-violet)]"}`}
      >
        {t("arquivados")}
        <span className="text-[var(--chip-count)]">{archivedCount}</span>
      </Button>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant={prioSort ? "outline" : "ghost"}
              size="xs"
              onClick={onTogglePrioSort}
              aria-pressed={prioSort}
              className={`${prioSort ? "border-current text-[var(--warn)] bg-[var(--hover)]" : "text-[var(--chip-idle)]"}`}
            >
              {t("↕ prio")}
            </Button>
          }
        />
        <TooltipContent side="bottom">
          {t("filtro de prioridade (P1 no topo)")}
        </TooltipContent>
      </Tooltip>
      {filtering && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onClear}
          className="font-bold text-[var(--muted-text)]"
          title={t("limpar filtros")}
        >
          {t("✕ limpar")}
        </Button>
      )}
    </div>
  );
}
