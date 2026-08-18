import { describe, expect, it } from "vitest";
import { dueReminder } from "./notify";
import type { Project, Task } from "./types";

const makeTask = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  text: `tarefa ${id}`,
  status: "todo",
  note: "",
  blocked: false,
  prio: 3,
  due: "",
  doneAt: null,
  subs: [],
  ...over,
});

const proj = (tasks: Task[]): Project => ({
  id: "p1",
  title: "projeto",
  blocked: false,
  due: "",
  prio: 3,
  archived: false,
  collapsed: false,
  sections: [{ id: "s1", title: "seção", notes: "", collapsed: false, tasks }],
});

describe("dueReminder", () => {
  it("retorna null sem tarefas pendentes", () => {
    expect(dueReminder([proj([makeTask("a", { due: "2026-08-20" })])], "2026-08-18")).toBeNull();
    expect(dueReminder([proj([makeTask("a", { due: "" })])], "2026-08-18")).toBeNull();
    expect(dueReminder([proj([])], "2026-08-18")).toBeNull();
  });

  it("inclui vencidas e de hoje, exclui concluídas", () => {
    const r = dueReminder(
      [proj([
        makeTask("v", { due: "2026-08-17" }),
        makeTask("h", { due: "2026-08-18" }),
        makeTask("d", { status: "done", due: "2026-08-17" }),
        makeTask("a", { due: "2026-08-19" }),
      ])],
      "2026-08-18",
    );
    expect(r).toEqual({ count: 2, texts: ["tarefa v", "tarefa h"] });
  });

  it("limita textos a 3 mas conta todas", () => {
    const r = dueReminder(
      [proj([1, 2, 3, 4, 5].map((n) => makeTask(`t${n}`, { due: "2026-08-18" })))],
      "2026-08-18",
    );
    expect(r?.count).toBe(5);
    expect(r?.texts).toHaveLength(3);
  });
});