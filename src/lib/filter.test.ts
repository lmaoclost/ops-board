import { describe, expect, it } from "vitest";
import { isFiltering, matchTask, projMatches, sectMatches, type Filters } from "./filter";
import type { Project, Section, Task } from "./types";

const task = (over: Partial<Task> = {}): Task => ({
  id: "t1",
  text: "Enviar relatório pro cliente",
  status: "todo",
  note: "",
  blocked: false,
  prio: 3,
  due: "",
  doneAt: null,
  ...over,
});

const section = (over: Partial<Section> = {}): Section => ({
  id: "s1",
  title: "geral",
  tasks: [task()],
  notes: "",
  collapsed: false,
  ...over,
});

const project = (over: Partial<Project> = {}): Project => ({
  id: "p1",
  title: "Projeto Alfa",
  blocked: false,
  sections: [section()],
  ...over,
});

const none: Filters = { query: "", status: null, prioSort: false, view: "list" };

describe("matchTask", () => {
  it("casa qualquer tarefa sem filtros", () => {
    expect(matchTask(task(), none)).toBe(true);
  });

  it("busca por texto ignorando maiúsculas, incluindo nota", () => {
    expect(matchTask(task({ text: "Enviar relatório" }), { ...none, query: "RELATÓRIO" })).toBe(true);
    expect(matchTask(task({ text: "x", note: "detalhe importante" }), { ...none, query: "IMPORTANTE" })).toBe(true);
    expect(matchTask(task({ text: "x" }), { ...none, query: "nada" })).toBe(false);
  });

  it("filtra por status", () => {
    expect(matchTask(task({ status: "doing" }), { ...none, status: "doing" })).toBe(true);
    expect(matchTask(task({ status: "todo" }), { ...none, status: "doing" })).toBe(false);
  });

  it("filtra por bloqueada", () => {
    expect(matchTask(task({ blocked: true }), { ...none, status: "blocked" })).toBe(true);
    expect(matchTask(task({ blocked: false }), { ...none, status: "blocked" })).toBe(false);
  });

  it("combina status e query (ambos devem casar)", () => {
    expect(
      matchTask(task({ status: "waiting", text: "aguardando retorno" }), { ...none, status: "waiting", query: "aguardando" }),
    ).toBe(true);
    expect(
      matchTask(task({ status: "waiting", text: "aguardando retorno" }), { ...none, status: "waiting", query: "relatório" }),
    ).toBe(false);
  });
});

describe("sectMatches", () => {
  it("casa qualquer seção sem filtros", () => {
    expect(sectMatches(section(), none)).toBe(true);
  });

  it("casa seção cujo título ou notas contêm a query", () => {
    expect(sectMatches(section({ title: "história", notes: "fluxo do workspace" }), { ...none, query: "workspace" })).toBe(true);
    expect(sectMatches(section({ title: "história" }), { ...none, query: "história" })).toBe(true);
    expect(sectMatches(section({ title: "geral" }), { ...none, query: "inexistente" })).toBe(false);
  });
});

describe("projMatches", () => {
  it("casa qualquer projeto sem filtros", () => {
    expect(projMatches(project(), none)).toBe(true);
  });

  it("casa projeto com seção correspondente (tarefa ou título/notas)", () => {
    const p = project({
      sections: [
        section(),
        section({ id: "s2", title: "história", tasks: [], notes: "DataLake" }),
      ],
    });
    expect(projMatches(p, { ...none, query: "relatório" })).toBe(true);
    expect(projMatches(p, { ...none, query: "DataLake" })).toBe(true);
    expect(projMatches(p, { ...none, query: "sumiço" })).toBe(false);
  });

  it("não casa projeto sem seções correspondentes", () => {
    const p = project({ sections: [section({ tasks: [task({ text: "a" })] })] });
    expect(projMatches(p, { ...none, status: "doing" })).toBe(false);
  });
});

describe("isFiltering", () => {
  it("false sem query e sem status", () => {
    expect(isFiltering(none)).toBe(false);
  });
  it("true com query ou status", () => {
    expect(isFiltering({ ...none, query: "x" })).toBe(true);
    expect(isFiltering({ ...none, status: "todo" })).toBe(true);
    expect(isFiltering({ ...none, status: "blocked" })).toBe(true);
  });
});