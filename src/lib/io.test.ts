import { describe, expect, it } from "vitest";
import { exportJson, parseImport } from "./io";
import type { Project } from "./types";

const projeto = (): Project => ({
  id: "p1",
  title: "P",
  blocked: false,
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
});