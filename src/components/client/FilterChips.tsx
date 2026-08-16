import { Button } from "@/components/ui/button";
import type { StatusFilter } from "@/lib/filter";
import type { Status } from "@/lib/types";
import { useT } from "@/hooks/useT";
import { } from "@/lib/types";

export interface ChipDef {
  key: StatusFilter;
  label: string;
  cls: string;
}

const CHIPS: ChipDef[] = [
  { key: "todo", label: "todo", cls: "text-[var(--todo)]" },
  { key: "doing", label: "doing", cls: "text-[var(--flow)]" },
  { key: "waiting", label: "waiting", cls: "text-[var(--warn)]" },
  { key: "done", label: "done", cls: "text-[var(--fired)]" },
  { key: "blocked", label: "bloq", cls: "text-[var(--gave)]" },
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
}: FilterChipsProps) {
  const { t, status } = useT();
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("filtros por status")}>
      {CHIPS.map(({ key, label, cls }) => {
        const count = key === "blocked" ? blockedCount : counts[key as Status];
        const isActive = active === key;
        return (
          <Button
            key={key}
            type="button"
            variant={isActive ? "outline" : "ghost"}
            size="xs"
            onClick={() => onToggleStatus(key)}
            title={`${t("filtro")}: ${key === "blocked" ? t("bloqueadas") : status(key as Status)}`}
            aria-pressed={isActive}
            className={`${cls} ${isActive ? "border-current bg-[var(--hover)]" : "opacity-60"}`}
          >
            {label}
            <span className="opacity-60">{count}</span>
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
        className={`text-[var(--violet)] ${archivedActive ? "border-current bg-[var(--hover)]" : "opacity-60"}`}
      >
        arquivados
        <span className="opacity-60">{archivedCount}</span>
      </Button>
      {filtering && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onClear}
          className="font-bold text-[var(--muted-text)]"
          title="limpar filtros (status, busca, arquivados)"
        >
          ✕ limpar
        </Button>
      )}
    </div>
  );
}