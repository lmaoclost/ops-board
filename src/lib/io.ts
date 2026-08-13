import type { Project, Status } from "@/lib/types";

const STATUSES: Status[] = ["todo", "doing", "waiting", "done"];
const isTask = (t: unknown): t is Project["sections"][number]["tasks"][number] => {
  if (!t || typeof t !== "object") return false;
  const o = t as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.text === "string" &&
    STATUSES.includes(o.status as Status) &&
    typeof o.prio === "number"
  );
};

const isSection = (s: unknown): s is Project["sections"][number] => {
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.collapsed === "boolean" &&
    Array.isArray(o.tasks) &&
    o.tasks.every(isTask)
  );
};

const isProject = (p: unknown): p is Project => {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.blocked === "boolean" &&
    Array.isArray(o.sections) &&
    o.sections.every(isSection)
  );
};

export function exportJson(projetos: Project[]): string {
  return JSON.stringify({ projetos }, null, 2);
}

export function parseImport(raw: string): Project[] {
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
  if (!projetos.every(isProject)) throw new Error("arquivo em formato inválido");
  return projetos as Project[];
}