import type { Project, Status } from "@/lib/types";

export const MAX_BYTES = 2 * 1024 * 1024;
export const MAX_PROJECTS = 100;
export const MAX_SECTIONS = 500;
export const MAX_TASKS = 5000;

const STATUSES: Status[] = ["todo", "doing", "waiting", "done"];

const isNullableString = (v: unknown) => v === null || typeof v === "string";

const isTask = (t: unknown): boolean => {
  if (!t || typeof t !== "object") return false;
  const o = t as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    o.id.length > 0 &&
    typeof o.text === "string" &&
    STATUSES.includes(o.status as Status) &&
    Number.isInteger(o.prio) &&
    (o.prio as number) >= 1 &&
    (o.prio as number) <= 3 &&
    isNullableString(o.note) &&
    isNullableString(o.due) &&
    isNullableString(o.doneAt) &&
    typeof o.blocked === "boolean"
  );
};

const isSection = (s: unknown): boolean => {
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    o.id.length > 0 &&
    typeof o.title === "string" &&
    typeof o.collapsed === "boolean" &&
    typeof o.notes === "string" &&
    Array.isArray(o.tasks) &&
    o.tasks.every(isTask)
  );
};

const isProject = (p: unknown): boolean => {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    o.id.length > 0 &&
    typeof o.title === "string" &&
    typeof o.blocked === "boolean" &&
    (o.archived === undefined || typeof o.archived === "boolean") &&
    Array.isArray(o.sections) &&
    o.sections.every(isSection)
  );
};

export function exportJson(projetos: Project[]): string {
  return JSON.stringify({ projetos }, null, 2);
}

export function parseImport(raw: string): Project[] {
  if (raw.length > MAX_BYTES) {
    throw new Error("arquivo muito grande (máx. 2 MB)");
  }

  let data: unknown;
  try {
    data = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("arquivo em formato inválido");
  }

  const projetos = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { projetos?: unknown }).projetos)
      ? (data as { projetos: unknown[] }).projetos
      : null;
  if (!projetos) throw new Error("arquivo em formato inválido");
  if (projetos.length > MAX_PROJECTS) {
    throw new Error(`limite excedido: máx. ${MAX_PROJECTS} projetos`);
  }
  if (!projetos.every(isProject)) {
    throw new Error("dados inválidos: estrutura de projeto, seção ou tarefa incorreta");
  }

  const list = projetos as Project[];
  const ids = new Set<string>();
  let sections = 0;
  let tasks = 0;
  for (const p of list) {
    if (ids.has(p.id)) throw new Error("dados inválidos: IDs duplicados");
    ids.add(p.id);
    for (const s of p.sections) {
      if (ids.has(s.id)) throw new Error("dados inválidos: IDs duplicados");
      ids.add(s.id);
      sections++;
      for (const t of s.tasks) {
        if (ids.has(t.id)) throw new Error("dados inválidos: IDs duplicados");
        ids.add(t.id);
        tasks++;
      }
    }
  }
  if (sections > MAX_SECTIONS) {
    throw new Error(`limite excedido: máx. ${MAX_SECTIONS} seções`);
  }
  if (tasks > MAX_TASKS) {
    throw new Error(`limite excedido: máx. ${MAX_TASKS} tarefas`);
  }

  return list;
}
