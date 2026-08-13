import { describe, expect, it } from "vitest";
import { countByStatus, doneTodayCount, blockedCount } from "./selectors";
import type { Project } from "./types";

const projetos: Project[] = [
  {
    id: "p1",
    title: "A",
    blocked: true,
    sections: [
      {
        id: "s1",
        title: "geral",
        notes: "",
        collapsed: false,
        tasks: [
          { id: "t1", text: "a", status: "todo", note: "", blocked: true, prio: 1, due: "", doneAt: null },
          { id: "t2", text: "b", status: "doing", note: "", blocked: false, prio: 2, due: "", doneAt: null },
          { id: "t3", text: "c", status: "done", note: "", blocked: false, prio: 3, due: "", doneAt: null },
          {
            id: "t4",
            text: "d",
            status: "done",
            note: "",
            blocked: false,
            prio: 3,
            due: "",
            doneAt: new Date().toISOString(),
          },
        ],
      },
    ],
  },
];

describe("selectors", () => {
  it("conta por status", () => {
    expect(countByStatus(projetos)).toEqual({ todo: 1, doing: 1, waiting: 0, done: 2 });
  });

  it("conta bloqueadas", () => {
    expect(blockedCount(projetos)).toBe(1);
  });

  it("conta concluídas hoje", () => {
    expect(doneTodayCount(projetos)).toBe(1);
  });

  it("lista todas as tarefas achatadas", () => {
    expect(projetos.flatMap((p) => p.sections.flatMap((s) => s.tasks))).toHaveLength(4);
  });
});