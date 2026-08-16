import { PRIOS, STATUSES, type Prio, type Project, type Section, type Status, type SubTask, type Task } from "./types";

export const SCHEMA_VERSION = 6;

type UnknownRecord = Record<string, unknown>;

function normSub(s: UnknownRecord | undefined): SubTask {
  const status = STATUSES.includes(s?.status as Status) ? (s!.status as Status) : s?.done ? "done" : "todo";
  const prio = PRIOS.includes(s?.prio as Prio) ? (s!.prio as Prio) : 3;
  return {
    id: String(s?.id ?? ""),
    text: String(s?.text ?? ""),
    note: String(s?.note ?? ""),
    prio,
    due: String(s?.due ?? ""),
    status,
    blocked: Boolean(s?.blocked),
    subs: Array.isArray(s?.subs) ? s.subs.map((x) => normSub(x as UnknownRecord)) : [],
  };
}

function normTask(t: UnknownRecord | undefined): Task {
  const status = STATUSES.includes(t?.status as Status) ? (t!.status as Status) : "todo";
  const prio = PRIOS.includes(t?.prio as Prio) ? (t!.prio as Prio) : 3;
  return {
    id: String(t?.id ?? ""),
    text: String(t?.text ?? ""),
    status,
    note: String(t?.note ?? ""),
    blocked: Boolean(t?.blocked),
    prio,
    due: String(t?.due ?? ""),
    doneAt: t?.doneAt ? String(t.doneAt) : null,
    subs: Array.isArray(t?.subs) ? t.subs.map((s) => normSub(s as UnknownRecord)) : [],
  };
}

function normSection(s: UnknownRecord | undefined): Section {
  return {
    id: String(s?.id ?? ""),
    title: String(s?.title ?? ""),
    tasks: Array.isArray(s?.tasks) ? s.tasks.map((t) => normTask(t as UnknownRecord)) : [],
    notes: String(s?.notes ?? ""),
    collapsed: Boolean(s?.collapsed),
  };
}

export function normProject(p: UnknownRecord | undefined): Project {
  const prio = PRIOS.includes(p?.prio as Prio) ? (p!.prio as Prio) : 3;
  return {
    id: String(p?.id ?? ""),
    title: String(p?.title ?? ""),
    blocked: Boolean(p?.blocked),
    archived: Boolean(p?.archived),
    prio,
    due: String(p?.due ?? ""),
    collapsed: Boolean(p?.collapsed),
    sections: Array.isArray(p?.sections) ? p.sections.map((s) => normSection(s as UnknownRecord)) : [],
  };
}

/** Normaliza e valida estado; lança se não for { projetos: [...] }. */
export function normalizeState(state: unknown): { projetos: Project[] } {
  const projetos = (state as UnknownRecord | null)?.projetos;
  if (!Array.isArray(projetos)) throw new Error("estado inválido");
  return { projetos: projetos.map((p) => normProject(p as UnknownRecord)) };
}

/** Migra formato legado (localStorage opsboard.v1 sem versão). Null se vazio/inválido. */
export function migrateLegacy(raw: unknown): { projetos: Project[] } | null {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as UnknownRecord).projetos)) return null;
  const projetos = (raw as UnknownRecord).projetos as UnknownRecord[];
  if (projetos.length === 0) return null;
  return { projetos: projetos.map((p) => normProject(p)) };
}