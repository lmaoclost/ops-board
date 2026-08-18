import { PRIOS, REPEATS, STATUSES, type Prio, type Project, type Repeat, type Section, type Status, type SubTask, type Task } from "./types";

export const SCHEMA_VERSION = 7;

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
  const repeat = REPEATS.includes(t?.repeat as Repeat) ? (t!.repeat as Repeat) : undefined;
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
    repeat,
    deletedAt: t?.deletedAt ? String(t.deletedAt) : undefined,
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

/** Duração da lixeira: tarefa excluída (soft) some após 7 dias. */
export const TRASH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Purga tarefas na lixeira há >= 7 dias (baseado em deletedAt). */
export function purgeExpired(projetos: Project[], now: number = Date.now()): Project[] {
  return projetos.map((p) => ({
    ...p,
    sections: p.sections.map((s) => ({
      ...s,
      tasks: s.tasks.filter((t) => {
        if (!t.deletedAt) return true;
        return now - new Date(t.deletedAt).getTime() < TRASH_TTL_MS;
      }),
    })),
  }));
}

/** Normaliza, valida e purga estado; lança se não for { projetos: [...] }. */
export function normalizeState(state: unknown, now: number = Date.now()): Project[] {
  const projetos = (state as UnknownRecord | null)?.projetos;
  if (!Array.isArray(projetos)) throw new Error("estado inválido");
  return purgeExpired(projetos.map((p) => normProject(p as UnknownRecord)), now);
}

/** Migra formato legado (localStorage opsboard.v1 sem versão). Null se vazio/inválido. */
export function migrateLegacy(raw: unknown, now: number = Date.now()): Project[] | null {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as UnknownRecord).projetos)) return null;
  const projetos = (raw as UnknownRecord).projetos as UnknownRecord[];
  if (projetos.length === 0) return null;
  return purgeExpired(projetos.map((p) => normProject(p)), now);
}