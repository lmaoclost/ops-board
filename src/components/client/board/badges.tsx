"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/hooks/useT";
import { LED, PRIO_CHIP_CLS } from "@/lib/tokens";
import { fmtDate } from "@/lib/date";
import { PRIO_KEYS, type Prio, type Status } from "@/lib/types";

export function StatusLed({ status, blocked, size = "sm", done }: { status: Status; blocked?: boolean; size?: "xs" | "sm"; done?: boolean }) {
  return (
    <span
      className={`${size === "xs" ? "h-1.5 w-1.5" : "h-2 w-2"} rounded-full ${blocked ? "bg-[var(--gave)]" : done ? "bg-[var(--fired)]" : LED[status]} transition-transform group-hover:scale-110`}
    />
  );
}

export function DueBadge({ due, overdue, dueSoon, size = "sm", dim = "text-[var(--muted-text)]" }: { due: string; overdue: boolean; dueSoon?: boolean; size?: "xs" | "sm" | "card"; dim?: string }) {
  const { t } = useT();
  const title = t("vencimento N").replace("N", due);
  if (overdue) {
    return (
      <Badge
        variant="destructive"
        className={`rounded-[4px] px-1.5 font-bold uppercase tracking-[0.08em] ${size === "card" ? "text-[11px]" : size === "xs" ? "text-[10.5px]" : "text-[11px]"}`}
        title={title}
      >
        {fmtDate(due)} {t("vencida")}
      </Badge>
    );
  }
  return (
    <span
      className={`shrink-0 font-semibold ${size === "card" ? "rounded border px-1.5 py-0.5 text-[10px]" : size === "xs" ? "text-[10.5px]" : "text-[10.5px]"} ${dueSoon ? "text-[var(--warn)]" : dim}`}
      title={size === "card" ? `${t("vencimento N").replace("N", fmtDate(due))}` : title}
    >
      {fmtDate(due)}
    </span>
  );
}

export function PrioChip({ prio, onClick, ariaLabel, title, className = "" }: { prio: Prio; onClick?: (e: React.MouseEvent) => void; ariaLabel?: string; title?: string; className?: string }) {
  const cls = `shrink-0 rounded border font-bold ${PRIO_CHIP_CLS[prio]} ${className || "px-1.5 py-0.5 text-[10.5px]"}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-label={ariaLabel} title={title} className={cls}>
        {PRIO_KEYS[prio]}
      </button>
    );
  }
  return (
    <span title={title} className={cls}>
      {PRIO_KEYS[prio]}
    </span>
  );
}