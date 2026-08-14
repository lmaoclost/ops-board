import type { Project, Status } from "@/lib/types";

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
  | { kind: "move"; src: TaskRef; dest: { pid: string; sid: string }; index: number }
  | { kind: "status"; task: TaskRef; status: Status }
  | { kind: "none" };

export function findTaskRef(projetos: Project[], tid: string): TaskRef | null {
  for (const p of projetos) {
    for (const s of p.sections) {
      if (s.tasks.some((t) => t.id === tid)) return { pid: p.id, sid: s.id, tid };
    }
  }
  return null;
}

export function resolveDrop(args: {
  projetos: Project[];
  active: string;
  over: string;
}): DropResult {
  const { projetos, active, over } = args;
  const tid = active.replace(/^task:/, "");
  const src = findTaskRef(projetos, tid);
  if (!src) return { kind: "none" };

  if (over.startsWith("sec:")) {
    const [, pid, sid] = over.split(":");
    const destSec = projetos.find((p) => p.id === pid)?.sections.find((s) => s.id === sid);
    if (!destSec) return { kind: "none" };
    return { kind: "move", src, dest: { pid, sid }, index: 0 };
  }

  if (over.startsWith("task:")) {
    const overTid = over.replace(/^task:/, "");
    const overRef = findTaskRef(projetos, overTid);
    if (!overRef) return { kind: "none" };
    const destSec = projetos.find((p) => p.id === overRef.pid)?.sections.find((s) => s.id === overRef.sid);
    if (!destSec) return { kind: "none" };
    return {
      kind: "move",
      src,
      dest: { pid: overRef.pid, sid: overRef.sid },
      index: destSec.tasks.findIndex((t) => t.id === overTid),
    };
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

export function applyStatusDrop(status: Status, wasDone = false, currentDoneAt: string | null = null): StatusDropPatch {
  const transitioningToDone = status === "done" && !wasDone;
  const transitioningFromDone = status !== "done" && wasDone;
  const patch: StatusDropPatch = { status };
  if (transitioningToDone) patch.doneAt = new Date().toISOString();
  if (transitioningFromDone) patch.doneAt = null;
  return patch;
}