import { describe, expect, it } from "vitest";
import { exportJson, MAX_BYTES, MAX_PROJECTS, MAX_TASKS, parseImport } from "./io";
import type { Project } from "./types";

const projeto = (over: Partial<Project> = {}): Project => ({
  id: "p1",
  title: "P",
  blocked: false,
  archived: false,
  sections: [
    {
      id: "s1",
      title: "geral",
      notes: "",
      collapsed: false,
      tasks: [
        { id: "t1", text: "x", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null },
      ],
    },
  ],
  ...over,
});

describe("exportJson", () => {
  it("serializa projetos em JSON", () => {
    const out = exportJson([projeto()]);
    expect(JSON.parse(out)).toHaveProperty("projetos");
    expect(JSON.parse(out).projetos).toHaveLength(1);
  });
});

describe("parseImport", () => {
  it("aceita JSON válido", () => {
    expect(parseImport(exportJson([projeto()]))).toHaveLength(1);
  });

  it("preserva archived no round-trip export→import", () => {
    const out = parseImport(exportJson([projeto({ archived: true })]));
    expect(out[0].archived).toBe(true);
  });

  it("rejeita JSON inválido", () => {
    expect(() => parseImport("não é json")).toThrow(/formato inválido/i);
  });

  it("rejeita shape estranho", () => {
    expect(() => parseImport(JSON.stringify({ foo: 1 }))).toThrow(/formato inválido/i);
  });

  it("rejeita projeto sem seções", () => {
    expect(() => parseImport(JSON.stringify([{ id: "x", title: "X" }]))).toThrow(/inválido/i);
  });

  it("rejeita tarefa nula dentro de seção", () => {
    const raw = JSON.parse(exportJson([projeto()]));
    raw.projetos[0].sections[0].tasks = [null];
    expect(() => parseImport(JSON.stringify(raw))).toThrow(/inválido/i);
  });

  it("rejeita seção nula dentro de projeto", () => {
    const raw = JSON.parse(exportJson([projeto()]));
    raw.projetos[0].sections = [null];
    expect(() => parseImport(JSON.stringify(raw))).toThrow(/inválido/i);
  });

  it("rejeita projeto nulo na lista", () => {
    expect(() => parseImport(JSON.stringify([null]))).toThrow(/inválido/i);
  });

  it("rejeita tarefa com prio não numérico", () => {
    const raw = JSON.parse(exportJson([projeto()]));
    raw.projetos[0].sections[0].tasks[0].prio = "3";
    expect(() => parseImport(JSON.stringify(raw))).toThrow(/inválido/i);
  });

  it("rejeita tarefa com status desconhecido", () => {
    const raw = JSON.parse(exportJson([projeto()]));
    raw.projetos[0].sections[0].tasks[0].status = "urgente";
    expect(() => parseImport(JSON.stringify(raw))).toThrow(/inválido/i);
  });

  it("aceita array direto de projetos", () => {
    expect(parseImport(JSON.stringify([projeto()]))).toHaveLength(1);
  });

  it("formata JSON com indentação", () => {
    expect(exportJson([projeto()])).toContain("\n  ");
  });

  it("round-trip export → import restaura 100% do estado", () => {
    const original = [projeto()];
    const restored = parseImport(exportJson(original));
    expect(restored).toEqual(original);
  });

  it("rejeita prio fora de 1..3", () => {
    for (const prio of [0, 4, 1.5]) {
      const raw = JSON.parse(exportJson([projeto()]));
      raw.projetos[0].sections[0].tasks[0].prio = prio;
      expect(() => parseImport(JSON.stringify(raw))).toThrow(/inválido/i);
    }
  });

  it("rejeita tarefa sem campos obrigatórios (note/doneAt)", () => {
    const raw = JSON.parse(exportJson([projeto()]));
    delete raw.projetos[0].sections[0].tasks[0].doneAt;
    expect(() => parseImport(JSON.stringify(raw))).toThrow(/inválido/i);
  });

  it("rejeita IDs duplicados (projeto, seção, tarefa)", () => {
    const raw = JSON.parse(exportJson([projeto()]));
    raw.projetos[0].sections.push(raw.projetos[0].sections[0]);
    expect(() => parseImport(JSON.stringify(raw))).toThrow(/duplicado/i);

    const raw2 = JSON.parse(exportJson([projeto(), projeto()]));
    expect(() => parseImport(JSON.stringify(raw2))).toThrow(/duplicado/i);

    const raw3 = JSON.parse(exportJson([projeto()]));
    raw3.projetos[0].sections[0].tasks.push(raw3.projetos[0].sections[0].tasks[0]);
    expect(() => parseImport(JSON.stringify(raw3))).toThrow(/duplicado/i);
  });

  it("rejeita arquivo acima de 2 MB", () => {
    const big = JSON.stringify({ projetos: [] }).padEnd(MAX_BYTES + 1, " ");
    expect(() => parseImport(big)).toThrow(/muito grande/i);
  });

  it("rejeita número de nós acima dos limites", () => {
    const manyTasks = JSON.parse(exportJson([projeto()]));
    manyTasks.projetos[0].sections[0].tasks = Array.from({ length: MAX_TASKS + 1 }, (_, i) => ({
      ...manyTasks.projetos[0].sections[0].tasks[0],
      id: `t${i}`,
    }));
    expect(() => parseImport(JSON.stringify(manyTasks))).toThrow(/limite/i);

    const manyProjects = Array.from({ length: MAX_PROJECTS + 1 }, (_, i) => {
      const p = JSON.parse(exportJson([projeto()])).projetos[0];
      return { ...p, id: `p${i}` };
    });
    expect(() => parseImport(JSON.stringify(manyProjects))).toThrow(/limite/i);
  });

  it("exporta apenas projetos (sem outros campos de estado)", () => {
    const out = exportJson([projeto()]);
    expect(out).toContain('"projetos"');
    expect(out).not.toContain('"filtros"');
    expect(out).not.toContain("version");
  });
});