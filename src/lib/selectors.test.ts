import { describe, expect, it } from "vitest";
import { deriveStats } from "./selectors";
import type { Project } from "./types";

const projetos: Project[] = [
  {
    id: "p1",
    title: "A",
    blocked: true,
    archived: false,
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
  it("deriva contagens em uma passada", () => {
    expect(deriveStats(projetos)).toEqual({
      byStatus: { todo: 1, doing: 1, waiting: 0, done: 2 },
      total: 4,
      done: 2,
      pendentes: 2,
      doneToday: 1,
      blocked: 1,
    });
  });

  it("vazio zera tudo", () => {
    expect(deriveStats([])).toEqual({
      byStatus: { todo: 0, doing: 0, waiting: 0, done: 0 },
      total: 0,
      done: 0,
      pendentes: 0,
      doneToday: 0,
      blocked: 0,
    });
  });
});