import type { SubTask, Task } from "./types";
import { uid } from "./uid";

export const makeSub = (text: string): SubTask => ({
  id: uid(),
  text,
  note: "",
  prio: 5,
  due: "",
  status: "todo",
  blocked: false,
  blockedReason: "",
  subs: [],
});

interface SubLike {
  id: string;
  subs: SubLike[];
}

export function mapSubs(subs: SubTask[], id: string, fn: (s: SubTask) => SubTask): SubTask[] {
  return subs.map((s) => (s.id === id ? fn(s) : { ...s, subs: mapSubs(s.subs, id, fn) }));
}

function removeLike<T extends SubLike>(subs: T[], id: string): T[] {
  const out: T[] = [];
  for (const s of subs) {
    if (s.id === id) continue;
    out.push({ ...s, subs: removeLike(s.subs, id) });
  }
  return out;
}

export function removeSub(subs: SubTask[], id: string): SubTask[] {
  return removeLike(subs, id);
}

export function removeSubTask(subs: Task[], id: string): Task[] {
  return removeLike(subs, id);
}

export function addSub(subs: SubTask[], id: string, child: SubTask): SubTask[] {
  return subs.map((s) =>
    s.id === id ? { ...s, subs: [...s.subs, child] } : { ...s, subs: addSub(s.subs, id, child) },
  );
}

export function findSubTree<T extends SubLike>(subs: T[], id: string): T | null {
  for (const s of subs) {
    if (s.id === id) return s;
    const found = findSubTree(s.subs as T[], id);
    if (found) return found;
  }
  return null;
}

export function isDescendant(subs: SubLike[], ancestorId: string, candidateId: string): boolean {
  const ancestor = findSubTree(subs, ancestorId);
  if (!ancestor) return false;
  return findSubTree(ancestor.subs, candidateId) !== null;
}

function insertAtLike<T extends SubLike>(subs: T[], parentId: string, child: T, index: number): T[] {
  return subs.map((s) => {
    if (s.id === parentId) {
      const next = [...s.subs];
      next.splice(Math.max(0, Math.min(index, next.length)), 0, child);
      return { ...s, subs: next };
    }
    return { ...s, subs: insertAtLike(s.subs, parentId, child, index) };
  });
}

export function insertSubAt(subs: SubTask[], parentId: string, child: SubTask, index: number): SubTask[] {
  return insertAtLike(subs, parentId, child, index);
}

export function insertTaskAt(subs: Task[], parentId: string, child: Task, index: number): Task[] {
  return insertAtLike(subs, parentId, child, index);
}

// --- profundidade ---

// Task > Subtask (nível 1) > Subsubtask (nível 2). Nada além.
export const MAX_SUB_DEPTH = 2;

// Nível do id dentro das subs de uma task: 1 = sub direta, 2 = subsub, null = não é sub.
// `subs` deve ser o array de subs da task raiz (Task.subs), nunca a lista de tasks.
export function subLevel(subs: SubTask[], id: string): number | null {
  return subLevelIn({ id: "", subs }, id, 0);
}

function subLevelIn(node: SubLike, id: string, level: number): number | null {
  if (node.id === id && level > 0) return level;
  for (const c of node.subs) {
    const found = subLevelIn(c, id, level + 1);
    if (found !== null) return found;
  }
  return null;
}