import { todayISO } from "./date";
import type { Project, Status, Task } from "./types";

export const allTasks = (projetos: Project[]): Task[] =>
  projetos.flatMap((p) => p.sections.flatMap((s) => s.tasks));

export function countByStatus(projetos: Project[]): Record<Status, number> {
  const m: Record<Status, number> = { todo: 0, doing: 0, waiting: 0, done: 0 };
  for (const t of allTasks(projetos)) m[t.status]++;
  return m;
}

export const blockedCount = (projetos: Project[]): number =>
  allTasks(projetos).filter((t) => t.blocked).length;

export const doneTodayCount = (projetos: Project[]): number =>
  allTasks(projetos).filter((t) => t.doneAt && t.doneAt.slice(0, 10) === todayISO()).length;