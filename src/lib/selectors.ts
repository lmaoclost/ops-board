import { todayISO } from "./date";
import type { Project, Status, Task } from "./types";

export interface BoardStats {
  byStatus: Record<Status, number>;
  total: number;
  done: number;
  pendentes: number;
  doneToday: number;
  blocked: number;
}

const localDay = (iso: string): string => {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

/** Derivada em uma única varredura: evita múltiplos allTasks()/filter() por render. */
export function deriveStats(projetos: Project[]): BoardStats {
  const byStatus: Record<Status, number> = { todo: 0, doing: 0, waiting: 0, done: 0 };
  let total = 0;
  let done = 0;
  let doneToday = 0;
  let blocked = 0;
  const today = todayISO();
  for (const p of projetos) {
    for (const s of p.sections) {
      for (const t of s.tasks) {
        total++;
        byStatus[t.status]++;
        if (t.blocked) blocked++;
        if (t.status === "done") {
          done++;
          if (t.doneAt && localDay(t.doneAt) === today) doneToday++;
        }
      }
    }
  }
  return { byStatus, total, done, pendentes: total - done, doneToday, blocked };
}

export const allTasks = (projetos: Project[]): Task[] =>
  projetos.flatMap((p) => p.sections.flatMap((s) => s.tasks));