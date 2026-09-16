import type { Prio, Status } from "@/lib/types";

// --- tokens visuais de domínio (status e prioridade) ---

export const LED: Record<Status, string> = {
  todo: "bg-[var(--todo)]",
  doing: "bg-[var(--flow)]",
  waiting: "bg-[var(--warn)]",
  done: "bg-[var(--fired)]",
};

export const PRIO_CHIP_CLS: Record<Prio, string> = {
  1: "text-[var(--gave)] border-[var(--gave)]/40 bg-[var(--gave)]/10",
  2: "text-[var(--warn)] border-[var(--warn)]/40 bg-[var(--warn)]/10",
  3: "text-[var(--muted-text)] border-[var(--line)]",
  4: "text-[var(--muted-text)] border-[var(--line)]",
  5: "text-[var(--dimmer)] border-[var(--line-soft)]",
};

export const NEXT_PRIO: Record<Prio, Prio> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 1 };

export function cyclePrio(prio: Prio): Prio {
  return ((prio % 5) + 1) as Prio;
}