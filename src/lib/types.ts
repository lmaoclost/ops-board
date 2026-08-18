export type Status = "todo" | "doing" | "waiting" | "done";
export type Prio = 1 | 2 | 3;
export type Repeat = "daily" | "weekly" | "monthly";

export interface SubTask {
  id: string;
  text: string;
  note: string;
  prio: Prio;
  due: string;
  status: Status;
  blocked: boolean;
  subs: SubTask[];
}

export interface Task {
  id: string;
  text: string;
  status: Status;
  note: string;
  blocked: boolean;
  prio: Prio;
  due: string;
  doneAt: string | null;
  subs: SubTask[];
  repeat?: Repeat;
  tags?: string[];
  deletedAt?: string | null;
}

export interface Section {
  id: string;
  title: string;
  tasks: Task[];
  notes: string;
  collapsed: boolean;
}

export interface Project {
  id: string;
  title: string;
  blocked: boolean;
  archived: boolean;
  prio: Prio;
  due: string;
  collapsed: boolean;
  sections: Section[];
}

export interface TaskPatch {
  text?: string;
  note?: string;
  blocked?: boolean;
  prio?: Prio;
  due?: string;
  subs?: SubTask[];
  repeat?: Repeat | null;
  tags?: string[];
  deletedAt?: string | null;
}

export interface AddTaskInput {
  text: string;
  status: Status;
  note?: string;
  blocked?: boolean;
  prio?: Prio;
  due?: string;
  subs?: SubTask[];
  repeat?: Repeat;
  tags?: string[];
}

export const STATUS_ORDER: Status[] = ["todo", "doing", "waiting", "done"];

export const STATUS_LABEL: Record<Status, string> = {
  todo: "a fazer",
  doing: "em andamento",
  waiting: "aguardando",
  done: "concluída",
};

export const PRIO_KEYS: Record<Prio, string> = { 1: "P1", 2: "P2", 3: "P3" };
export const PRIO_CLS: Record<Prio, string> = {
  1: "border-[var(--fired)] text-[var(--fired)]",
  2: "border-[var(--warn)] text-[var(--warn)]",
  3: "border-[var(--line-soft)] text-[var(--dimmer)]",
};

export const STATUSES: readonly Status[] = STATUS_ORDER;
export const PRIOS: readonly Prio[] = [1, 2, 3];
export const REPEATS: readonly Repeat[] = ["daily", "weekly", "monthly"];