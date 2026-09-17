import type { Project, Status, SubTask } from "@/lib/types";
import { findSubTree } from "@/lib/subtasks";
import { rectIntersection, type CollisionDetection, type Collision } from "@dnd-kit/core";

function containsPoint(rect: { left: number; top: number; right: number; bottom: number }, x: number, y: number): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export const smartCollision: CollisionDetection = (args) => {
  const base = rectIntersection(args);
  const { pointerCoordinates, droppableRects } = args;
  if (!pointerCoordinates) return base;
  const containing = base
    .map((c): Collision & { area: number } => {
      const rect = droppableRects.get(c.id);
      return { ...c, area: rect ? rect.width * rect.height : Infinity };
    })
    .filter((c) => {
      const rect = droppableRects.get(c.id);
      return rect != null && containsPoint(rect, pointerCoordinates.x, pointerCoordinates.y);
    })
    .sort((a, b) => a.area - b.area);
  if (containing.length > 0) {
    return containing.map((c) => ({ id: c.id, data: c.data }));
  }
  return base;
};

export interface OverInfo {
  overIdx: number;
}

export function insertIndex({ overIdx }: OverInfo): number {
  return overIdx;
}

export interface TaskRef {
  pid: string;
  sid: string;
  tid: string;
}

export type DropResult =
  | { kind: "move"; src: TaskRef; dest: { pid: string; sid: string; parentId: string | null }; index: number }
  | { kind: "status"; task: TaskRef; status: Status }
  | { kind: "secmove"; pid: string; sid: string; index: number }
  | { kind: "projmove"; pid: string; overPid: string }
  | { kind: "none" };

export function findTaskRef(projetos: Project[], tid: string): TaskRef | null {
  for (const p of projetos) {
    for (const s of p.sections) {
      if (s.tasks.some((t) => t.id === tid)) return { pid: p.id, sid: s.id, tid };
      for (const t of s.tasks) {
        if (findSubTree(t.subs, tid)) return { pid: p.id, sid: s.id, tid };
      }
    }
  }
  return null;
}

/** Localiza uma task (raiz ou sub): retorno { parentId, index } descreve a posição atual. */
export function findTaskLocation(
  tasks: Project["sections"][number]["tasks"],
  tid: string,
): { parentId: string | null; index: number } | null {
  const rootIdx = tasks.findIndex((t) => t.id === tid);
  if (rootIdx !== -1) return { parentId: null, index: rootIdx };
  for (const t of tasks) {
    const inner = findSubLocation(t.subs, tid, t.id);
    if (inner) return inner;
  }
  return null;
}

function findSubLocation(subs: SubTask[], tid: string, parentId: string): { parentId: string; index: number } | null {
  const idx = subs.findIndex((s) => s.id === tid);
  if (idx !== -1) return { parentId, index: idx };
  for (const s of subs) {
    const inner = findSubLocation(s.subs, tid, s.id);
    if (inner) return inner;
  }
  return null;
}

export function resolveDrop(args: {
  projetos: Project[];
  active: string;
  over: string;
}): DropResult {
  const { projetos, active, over } = args;

  if (active.startsWith("project:")) {
    const pid = active.split(":")[1];
    if (!over.startsWith("project:")) return { kind: "none" };
    const overPid = over.split(":")[1];
    if (projetos.every((p) => p.id !== pid) || projetos.every((p) => p.id !== overPid)) return { kind: "none" };
    return { kind: "projmove", pid, overPid };
  }

  if (active.startsWith("section:")) {
    const [, pid, sid] = active.split(":");
    if (!over.startsWith("section:")) return { kind: "none" };
    const [, overPid, overSid] = over.split(":");
    if (pid !== overPid) return { kind: "none" };
    const proj = projetos.find((p) => p.id === pid);
    if (!proj) return { kind: "none" };
    const index = proj.sections.findIndex((s) => s.id === overSid);
    if (index === -1) return { kind: "none" };
    return { kind: "secmove", pid, sid, index };
  }

  const tid = active.replace(/^task:/, "");
  const src = findTaskRef(projetos, tid);
  if (!src) return { kind: "none" };
  const srcSec = projetos.find((p) => p.id === src.pid)?.sections.find((s) => s.id === src.sid);
  if (!srcSec) return { kind: "none" };

  if (over.startsWith("sec-end:")) {
    const [, pid, sid] = over.split(":");
    const destSec = projetos.find((p) => p.id === pid)?.sections.find((s) => s.id === sid);
    if (!destSec) return { kind: "none" };
    return { kind: "move", src, dest: { pid, sid, parentId: null }, index: destSec.tasks.length };
  }

  if (over.startsWith("sec:")) {
    const [, pid, sid] = over.split(":");
    const destSec = projetos.find((p) => p.id === pid)?.sections.find((s) => s.id === sid);
    if (!destSec) return { kind: "none" };
    return { kind: "move", src, dest: { pid, sid, parentId: null }, index: 0 };
  }

  if (over.startsWith("task:")) {
    const parts = over.split(":");
    const overTid = parts[1];
    const overRef = findTaskRef(projetos, overTid);
    if (!overRef) return { kind: "none" };
    const destSec = projetos.find((p) => p.id === overRef.pid)?.sections.find((s) => s.id === overRef.sid);
    if (!destSec) return { kind: "none" };
    const zone = parts[2] ?? "sib-ab";
    const overLoc = findTaskLocation(destSec.tasks, overTid);
    if (!overLoc) return { kind: "none" };

    if (zone === "nest") {
      if (overTid === tid) return { kind: "none" };
      const destSection = projetos.find((p) => p.id === overRef.pid)?.sections.find((s) => s.id === overRef.sid);
      const parent = destSection ? findSubTree(destSection.tasks, overTid) : null;
      return { kind: "move", src, dest: { pid: overRef.pid, sid: overRef.sid, parentId: overTid }, index: parent ? parent.subs.length : -1 };
    }

    const insertAt = zone === "sib-ae" ? overLoc.index + 1 : overLoc.index;
    if (overLoc.parentId === null) {
      return { kind: "move", src, dest: { pid: overRef.pid, sid: overRef.sid, parentId: null }, index: insertAt };
    }
    return { kind: "move", src, dest: { pid: overRef.pid, sid: overRef.sid, parentId: overLoc.parentId }, index: insertAt };
  }

  if (over.startsWith("k:")) {
    const status = over.replace(/^k:/, "") as Status;
    return { kind: "status", task: src, status };
  }

  return { kind: "none" };
}

export interface StatusDropPatch {
  status: Status;
  doneAt?: string | null;
}

export function applyStatusDrop(status: Status, wasDone = false): StatusDropPatch {
  const transitioningToDone = status === "done" && !wasDone;
  const transitioningFromDone = status !== "done" && wasDone;
  const patch: StatusDropPatch = { status };
  if (transitioningToDone) patch.doneAt = new Date().toISOString();
  if (transitioningFromDone) patch.doneAt = null;
  return patch;
}