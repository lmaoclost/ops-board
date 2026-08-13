import type { StatusFilter } from "@/lib/filter";
import type { Status } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

export interface ChipDef {
  key: StatusFilter;
  label: string;
  cls: string;
}

const CHIPS: ChipDef[] = [
  { key: "todo", label: "todo", cls: "text-slate-400" },
  { key: "doing", label: "doing", cls: "text-cyan-400" },
  { key: "waiting", label: "waiting", cls: "text-amber-400" },
  { key: "done", label: "done", cls: "text-emerald-400" },
  { key: "blocked", label: "bloq", cls: "text-red-400" },
];

interface FilterChipsProps {
  counts: Record<Status, number>;
  blockedCount: number;
  active: StatusFilter;
  filtering: boolean;
  onToggleStatus: (status: StatusFilter) => void;
  onClear: () => void;
}

export function FilterChips({ counts, blockedCount, active, filtering, onToggleStatus, onClear }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="filtros por status">
      {CHIPS.map(({ key, label, cls }) => {
        const count = key === "blocked" ? blockedCount : counts[key as Status];
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onToggleStatus(key)}
            title={`filtra: ${key === "blocked" ? "bloqueadas" : STATUS_LABEL[key as Status]}`}
            className={`chip ${cls} ${isActive ? "border-current" : ""} ${isActive ? "" : "opacity-60"}`}
          >
            {label}
            <span className="opacity-60">{count}</span>
          </button>
        );
      })}
      {filtering && (
        <button
          type="button"
          onClick={onClear}
          className="chip font-bold text-zinc-400"
          title="limpar filtros (status + busca)"
        >
          ✕ limpar
        </button>
      )}
    </div>
  );
}