import type { Task } from "./types";

/** Primeira dependência não concluída de task, se houver. */
export function blockedBy(task: Task, tasks: Task[]): Task | undefined {
  const ids = task.dependsOn ?? [];
  for (const id of ids) {
    const dep = tasks.find((t) => t.id === id);
    if (dep && dep.status !== "done") return dep;
  }
  return undefined;
}