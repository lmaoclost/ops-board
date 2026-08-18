import { flatTasks } from "./flat";
import type { Project } from "./types";

export interface DueReminder {
  count: number;
  texts: string[];
}

/** Tarefas não concluídas com due hoje ou antes — base do lembrete de notificação. */
export function dueReminder(projetos: Project[], today: string): DueReminder | null {
  const pending = flatTasks(projetos).filter((i) => i.task.status !== "done" && !!i.task.due && i.task.due <= today);
  if (!pending.length) return null;
  return { count: pending.length, texts: pending.slice(0, 3).map((i) => i.task.text) };
}