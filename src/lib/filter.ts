import type { Project, Section, Status, Task } from "./types";

export type View = "list" | "kanban";
export type StatusFilter = Status | "blocked" | null;

export interface Filters {
  query: string;
  status: StatusFilter;
  prioSort: boolean;
  view: View;
}

export const defaultFilters: Filters = { query: "", status: null, prioSort: false, view: "list" };

export const isFiltering = (f: Filters): boolean => !!f.query || !!f.status;

export function matchTask(t: Task, f: Filters): boolean {
  if (f.status === "blocked" && !t.blocked) return false;
  if (f.status && f.status !== "blocked" && t.status !== f.status) return false;
  if (!f.query) return true;
  const q = f.query.toLowerCase();
  return (t.text + " " + (t.note || "")).toLowerCase().includes(q);
}

const titleNotesMatch = (s: Section, query: string): boolean =>
  (s.title + " " + s.notes).toLowerCase().includes(query.toLowerCase());

/** Seção visível: tem tarefa que casa (status/query) ou título/notas casam com a query. */
export function sectMatches(s: Section, f: Filters): boolean {
  if (s.tasks.some((t) => matchTask(t, f))) return true;
  return !!f.query && titleNotesMatch(s, f.query);
}

/** Projeto visível: alguma seção visível. */
export function projMatches(p: Project, f: Filters): boolean {
  if (!isFiltering(f)) return true;
  return p.sections.some((s) => sectMatches(s, f));
}

/** Ordena tarefas por prioridade (P1 no topo) quando prioSort; estável; não muta a origem. */
export function sortTasks<T>(tasks: T[], prioSort: boolean, key: (t: T) => number): T[] {
  if (!prioSort) return tasks;
  return tasks.toSorted((a, b) => key(a) - key(b));
}