import { describe, expect, it } from "vitest";
import { migrateLegacy, normalizeState, purgeExpired, SCHEMA_VERSION } from "./migrate";
import type { Project, Task } from "./types";

describe("migrateLegacy", () => {
  it("retorna null para entrada sem projetos", () => {
    expect(migrateLegacy(null)).toBeNull();
    expect(migrateLegacy({ projetos: "x" })).toBeNull();
    expect(migrateLegacy({ projetos: [] })).toBeNull();
  });

  it("preenche defaults ausentes em tarefa (prio, due, doneAt, note)", () => {
    const out = migrateLegacy({
      projetos: [
        {
          id: "p1",
          title: "Projeto",
          sections: [
            { id: "s1", title: "geral", tasks: [{ id: "t1", text: "tarefa", status: "todo" }] },
          ],
        },
      ],
    });
    const t = out![0].sections[0].tasks[0];
    expect(t.prio).toBe(3);
    expect(t.due).toBe("");
    expect(t.doneAt).toBeNull();
    expect(t.note).toBe("");
    expect(t.blocked).toBe(false);
    expect(t.subs).toEqual([]);
  });

  it("migra sub-tarefas legadas (done) para formato completo", () => {
    const out = migrateLegacy({
      projetos: [
        {
          id: "p1",
          title: "P",
          sections: [
            {
              id: "s1",
              title: "S",
              tasks: [
                { id: "t1", text: "x", status: "todo", subs: [{ id: "a", text: "sub", done: true }, { id: "b", text: "outra", done: 0 }] },
              ],
            },
          ],
        },
      ],
    });
    const t = out![0].sections[0].tasks[0];
    expect(t.subs).toEqual([
      { id: "a", text: "sub", note: "", prio: 3, due: "", status: "done", blocked: false, subs: [] },
      { id: "b", text: "outra", note: "", prio: 3, due: "", status: "todo", blocked: false, subs: [] },
    ]);
  });

  it("migra sub-tarefas legadas aninhadas recursivamente (v5 → v6)", () => {
    const out = migrateLegacy({
      projetos: [
        {
          id: "p1",
          title: "P",
          sections: [
            {
              id: "s1",
              title: "S",
              tasks: [
                {
                  id: "t1",
                  text: "x",
                  status: "todo",
                  subs: [{ id: "a", text: "sub", done: false, subs: [{ id: "c", text: "neta", done: true }] }],
                },
              ],
            },
          ],
        },
      ],
    });
    const sub = out![0].sections[0].tasks[0].subs[0];
    expect(sub).toEqual({
      id: "a",
      text: "sub",
      note: "",
      prio: 3,
      due: "",
      status: "todo",
      blocked: false,
      subs: [{ id: "c", text: "neta", note: "", prio: 3, due: "", status: "done", blocked: false, subs: [] }],
    });
  });

  it("normaliza seções sem tasks/notes/collapsed", () => {
    const out = migrateLegacy({ projetos: [{ id: "p1", title: "P", sections: [{ id: "s1", title: "S" }] }] });
    const s = out![0].sections[0];
    expect(s.tasks).toEqual([]);
    expect(s.notes).toBe("");
    expect(s.collapsed).toBe(false);
  });

  it("normaliza projeto sem sections e sem blocked", () => {
    const out = migrateLegacy({ projetos: [{ id: "p1", title: "P" }] });
    expect(out![0].sections).toEqual([]);
    expect(out![0].blocked).toBe(false);
    expect(out![0].archived).toBe(false);
    expect(out![0].prio).toBe(3);
    expect(out![0].due).toBe("");
    expect(out![0].collapsed).toBe(false);
  });

  it("preserva prio/due/collapsed do projeto quando presentes", () => {
    const out = migrateLegacy({ projetos: [{ id: "p1", title: "P", prio: 1, due: "2026-09-01", collapsed: true }] });
    expect(out![0].prio).toBe(1);
    expect(out![0].due).toBe("2026-09-01");
    expect(out![0].collapsed).toBe(true);
  });

  it("força prio de projeto inválida para 3", () => {
    const out = migrateLegacy({ projetos: [{ id: "p1", title: "P", prio: 9 }] });
    expect(out![0].prio).toBe(3);
  });

  it("preserva archived quando presente", () => {
    const out = migrateLegacy({ projetos: [{ id: "p1", title: "P", archived: true }] });
    expect(out![0].archived).toBe(true);
  });

  it("preserva dados existentes intactos", () => {
    const legacy = {
      projetos: [
        {
          id: "p1",
          title: "N8N",
          blocked: true,
          sections: [
            {
              id: "s1",
              title: "geral",
              notes: "nota",
              collapsed: true,
              tasks: [{ id: "t1", text: "feito", status: "done", prio: 1, due: "2026-01-01", doneAt: "2026-01-01T10:00:00.000Z", subs: [] }],
            },
          ],
        },
      ],
    };
    const out = migrateLegacy(legacy)!;
    const p = out[0];
    const s = p.sections[0];
    const t = s.tasks[0];
    expect(p.id).toBe("p1");
    expect(p.title).toBe("N8N");
    expect(p.blocked).toBe(true);
    expect(s.title).toBe("geral");
    expect(s.notes).toBe("nota");
    expect(s.collapsed).toBe(true);
    expect(t).toMatchObject({ id: "t1", text: "feito", status: "done", prio: 1, due: "2026-01-01", doneAt: "2026-01-01T10:00:00.000Z" });
  });

  it("mantém versão de schema estável e exportada", () => {
    expect(SCHEMA_VERSION).toBe(7);
  });

  it("normaliza repeat/deletedAt do schema v7", () => {
    const out = migrateLegacy({
      projetos: [
        {
          id: "p1",
          title: "P",
          sections: [
            {
              id: "s1",
              title: "S",
              tasks: [
                { id: "t1", text: "recorrente", status: "todo", repeat: "daily", deletedAt: "2026-08-18T10:00:00.000Z" },
                { id: "t2", text: "simples", status: "todo", repeat: "hourly" as string, deletedAt: "" },
              ],
            },
          ],
        },
      ],
    })!;
    const [t1, t2] = out[0].sections[0].tasks;
    expect(t1.repeat).toBe("daily");
    expect(t1.deletedAt).toBe("2026-08-18T10:00:00.000Z");
    expect(t2.repeat).toBeUndefined();
    expect(t2.deletedAt).toBeUndefined();
  });
});

describe("normalizeState", () => {
  it("ignora status/prio inválidos e forçando para seguros", () => {
    const out = normalizeState({
      projetos: [
        {
          id: "p1",
          title: "P",
          sections: [
            { id: "s1", title: "S", tasks: [{ id: "t1", text: "x", status: "feito", prio: 9 }] },
          ],
        },
      ],
    });
    const t = out[0].sections[0].tasks[0];
    expect(t.status).toBe("todo");
    expect(t.prio).toBe(3);
  });

  it("rejeita estado sem formato de projetos", () => {
    expect(() => normalizeState({ foo: 1 })).toThrow();
  });
});

describe("purgeExpired", () => {
  const task = (id: string, deletedAt?: string | null): Task => ({
    id,
    text: id,
    status: "todo" as const,
    note: "",
    blocked: false,
    prio: 3,
    due: "",
    doneAt: null,
    subs: [],
    deletedAt,
  });
  const NOW = Date.parse("2026-08-18T12:00:00Z");
  const project = (tasks: Task[]): Project => ({
    id: "p1",
    title: "P",
    blocked: false,
    archived: false,
    prio: 3,
    due: "",
    collapsed: false,
    sections: [{ id: "s1", title: "S", tasks, notes: "", collapsed: false }],
  });

  it("remove tarefa excluída há 8 dias", () => {
    const out = purgeExpired([project([task("t1", "2026-08-10T12:00:00Z")])], NOW);
    expect(out[0].sections[0].tasks).toEqual([]);
  });

  it("mantém tarefa excluída há 6 dias", () => {
    const out = purgeExpired([project([task("t1", "2026-08-12T12:00:00Z")])], NOW);
    expect(out[0].sections[0].tasks).toHaveLength(1);
  });

  it("remove tarefa excluída há exatamente 7 dias", () => {
    const out = purgeExpired([project([task("t1", "2026-08-11T12:00:00Z")])], NOW);
    expect(out[0].sections[0].tasks).toEqual([]);
  });

  it("mantém tarefas ativas e excluídas sem deletedAt", () => {
    const out = purgeExpired([project([task("t1"), task("t2", null)])], NOW);
    expect(out[0].sections[0].tasks).toHaveLength(2);
  });

  it("normalizeState purga expirados ao reidratar", () => {
    const out = normalizeState(
      {
        projetos: [project([task("t1", "2026-08-01T12:00:00Z"), task("t2", "2026-08-15T12:00:00Z")])],
      },
      NOW,
    );
    const tasks = out[0].sections[0].tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("t2");
  });
});