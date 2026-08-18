import { describe, expect, it } from "vitest";
import { flatTasks, groupAgenda, type FlatTask } from "./flat";
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

const makeProj = (id: string, tasks: Task[]): Project => ({
  id,
  title: `projeto ${id}`,
  blocked: false,
  due: "",
  prio: 3,
  archived: false,
  collapsed: false,
  sections: [{ id: `sec-${id}`, title: `seção ${id}`, notes: "", collapsed: false, tasks }],
});

describe("flatTasks", () => {
  it("achata projetos/seções em itens com contexto", () => {
    const p = makeProj("p1", [makeTask("t1"), makeTask("t2")]);
    const items = flatTasks([p]);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ pid: "p1", ptitle: "projeto p1", sid: "sec-p1", stitle: "seção p1" });
    expect(items[0].task.id).toBe("t1");
  });
});

describe("groupAgenda", () => {
  const items = (over: Partial<Task>[]) =>
    over.map((o, i) => ({ task: makeTask(`t${i}`, o), pid: "p", ptitle: "proj", sid: "s", stitle: "sec" }));

  it("ignora concluídas e tarefas sem due", () => {
    const list: FlatTask[] = [
      ...items([{ status: "done", due: "2026-08-18" }, { due: "2026-08-18" }, { due: "" }]),
    ];
    const g = groupAgenda(list, "2026-08-18");
    expect(g.today).toHaveLength(1);
    expect(g.overdue).toHaveLength(0);
    expect(g.upcoming).toHaveLength(0);
  });

  it("agrupa vencidas, hoje e próximos 7 dias", () => {
    const list = items([
      { due: "2026-08-17" },
      { due: "2026-08-18" },
      { due: "2026-08-20" },
      { due: "2026-08-25" },
      { due: "2026-08-26" },
    ]);
    const g = groupAgenda(list, "2026-08-18");
    expect(g.overdue.map((i) => i.task.due)).toEqual(["2026-08-17"]);
    expect(g.today.map((i) => i.task.due)).toEqual(["2026-08-18"]);
    expect(g.upcoming.map((i) => i.task.due)).toEqual(["2026-08-20", "2026-08-25"]);
  });

  it("ordena por due e depois por prioridade", () => {
    const list = items([
      { due: "2026-08-20", prio: 3 },
      { due: "2026-08-20", prio: 1 },
      { due: "2026-08-19", prio: 2 },
    ]);
    const g = groupAgenda(list, "2026-08-18");
    expect(g.upcoming.map((i) => `${i.task.due}-${i.task.prio}`)).toEqual(["2026-08-19-2", "2026-08-20-1", "2026-08-20-3"]);
  });
});