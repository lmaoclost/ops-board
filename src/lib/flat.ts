import type { Project } from "./types";

export interface FlatTask {
  task: Project["sections"][number]["tasks"][number];
  pid: string;
  ptitle: string;
  sid: string;
  stitle: string;
}

export interface AgendaGroups {
  overdue: FlatTask[];
  today: FlatTask[];
  upcoming: FlatTask[];
}

export function flatTasks(projetos: Project[]): FlatTask[] {
  return projetos.flatMap((p) =>
    p.sections.flatMap((s) => s.tasks.map((task) => ({ task, pid: p.id, ptitle: p.title, sid: s.id, stitle: s.title }))),
  );
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const byDueThenPrio = (a: FlatTask, b: FlatTask) =>
  (a.task.due < b.task.due ? -1 : a.task.due > b.task.due ? 1 : a.task.prio - b.task.prio) ||
  a.task.text.localeCompare(b.task.text);

/** Agenda: tarefas não concluídas com due, agrupadas em vencidas / hoje / próximos 7 dias. */
export function groupAgenda(items: FlatTask[], today: string): AgendaGroups {
  const pending = items.filter((i) => i.task.status !== "done" && !!i.task.due).toSorted(byDueThenPrio);
  const limit = addDays(today, 7);
  return {
    overdue: pending.filter((i) => i.task.due < today),
    today: pending.filter((i) => i.task.due === today),
    upcoming: pending.filter((i) => i.task.due > today && i.task.due <= limit),
  };
}