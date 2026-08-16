import { describe, expect, it } from "vitest";
import { migrateLegacy, normalizeState, SCHEMA_VERSION } from "./migrate";

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
    const t = out!.projetos[0].sections[0].tasks[0];
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
    const t = out!.projetos[0].sections[0].tasks[0];
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
    const sub = out!.projetos[0].sections[0].tasks[0].subs[0];
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
    const s = out!.projetos[0].sections[0];
    expect(s.tasks).toEqual([]);
    expect(s.notes).toBe("");
    expect(s.collapsed).toBe(false);
  });

  it("normaliza projeto sem sections e sem blocked", () => {
    const out = migrateLegacy({ projetos: [{ id: "p1", title: "P" }] });
    expect(out!.projetos[0].sections).toEqual([]);
    expect(out!.projetos[0].blocked).toBe(false);
    expect(out!.projetos[0].archived).toBe(false);
    expect(out!.projetos[0].prio).toBe(3);
    expect(out!.projetos[0].due).toBe("");
    expect(out!.projetos[0].collapsed).toBe(false);
  });

  it("preserva prio/due/collapsed do projeto quando presentes", () => {
    const out = migrateLegacy({ projetos: [{ id: "p1", title: "P", prio: 1, due: "2026-09-01", collapsed: true }] });
    expect(out!.projetos[0].prio).toBe(1);
    expect(out!.projetos[0].due).toBe("2026-09-01");
    expect(out!.projetos[0].collapsed).toBe(true);
  });

  it("força prio de projeto inválida para 3", () => {
    const out = migrateLegacy({ projetos: [{ id: "p1", title: "P", prio: 9 }] });
    expect(out!.projetos[0].prio).toBe(3);
  });

  it("preserva archived quando presente", () => {
    const out = migrateLegacy({ projetos: [{ id: "p1", title: "P", archived: true }] });
    expect(out!.projetos[0].archived).toBe(true);
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
    const p = out.projetos[0];
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
    expect(SCHEMA_VERSION).toBe(6);
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
    const t = out.projetos[0].sections[0].tasks[0];
    expect(t.status).toBe("todo");
    expect(t.prio).toBe(3);
  });

  it("rejeita estado sem formato de projetos", () => {
    expect(() => normalizeState({ foo: 1 })).toThrow();
  });
});