import { describe, expect, it } from "vitest";
import { isFiltering, matchTask, projMatches, sectMatches, sortTasks, visibleProjetos, visibleTasks, type Filters } from "./filter";
import type { Project, Section, Task } from "./types";

const task = (over: Partial<Task> = {}): Task => ({
  id: "t1",
  text: "Enviar relatório pro cliente",
  status: "todo",
  note: "",
  blocked: false,
  prio: 3,
  due: "",
  doneAt: null, subs: [],
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
  blocked: false, archived: false, prio: 3, due: "", collapsed: false,
  sections: [section()],
  ...over,
});

const none: Filters = { query: "", status: null, prioSort: false, view: "list", archived: false };

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

  it("casa projeto cujo título contém a query", () => {
    expect(projMatches(project({ title: "Projeto Alfa" }), { ...none, query: "alfa" })).toBe(true);
    expect(projMatches(project({ title: "Projeto Beta" }), { ...none, query: "alfa" })).toBe(false);
  });
});

describe("visibleTasks", () => {
  const tasks = [
    task({ id: "t1", text: "relatório", status: "todo" }),
    task({ id: "t2", text: "reunião", status: "doing" }),
    task({ id: "t3", text: "café", status: "todo", blocked: true }),
  ];

  it("sem filtros, retorna todas", () => {
    expect(visibleTasks(tasks, none)).toHaveLength(3);
  });

  it("com query, retorna só as tarefas que casam", () => {
    const out = visibleTasks(tasks, { ...none, query: "re" });
    expect(out.map((t) => t.id)).toEqual(["t1", "t2"]);
  });

  it("com status, retorna só as tarefas do status", () => {
    const out = visibleTasks(tasks, { ...none, status: "doing" });
    expect(out.map((t) => t.id)).toEqual(["t2"]);
  });

  it("não muta a origem", () => {
    visibleTasks(tasks, { ...none, query: "café" });
    expect(tasks).toHaveLength(3);
  });
});

describe("sortTasks", () => {
  const mk = (prio: number, text: string) => ({ prio, text });

  it("sem prioSort, retorna o mesmo array", () => {
    const tasks = [mk(3, "a"), mk(1, "b")];
    expect(sortTasks(tasks, false, (t) => t.prio)).toBe(tasks);
  });

  it("com prioSort, P1 no topo", () => {
    const tasks = [mk(3, "a"), mk(1, "b"), mk(2, "c")];
    expect(sortTasks(tasks, true, (t) => t.prio).map((t) => t.text)).toEqual(["b", "c", "a"]);
  });

  it("não muta o array original", () => {
    const tasks = [mk(3, "a"), mk(1, "b")];
    const out = sortTasks(tasks, true, (t) => t.prio);
    expect(tasks.map((t) => t.prio)).toEqual([3, 1]);
    expect(out).not.toBe(tasks);
  });

  it("empates preservam a ordem original (estável)", () => {
    const tasks = [mk(1, "a"), mk(2, "b"), mk(1, "c")];
    expect(sortTasks(tasks, true, (t) => t.prio).map((t) => t.text)).toEqual(["a", "c", "b"]);
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

describe("visibleProjetos", () => {
  const ativo = project({ id: "a", title: "Ativo" });
  const arquivado = project({ id: "b", title: "Arquivado", archived: true });
  const projetos = [ativo, arquivado];

  it("sem chip arquivados, mostra só projetos ativos", () => {
    expect(visibleProjetos(projetos, none)).toEqual([ativo]);
  });

  it("com chip arquivados ativo, mostra só arquivados", () => {
    expect(visibleProjetos(projetos, { ...none, archived: true })).toEqual([arquivado]);
  });

  it("ordem preservada e não muta a origem", () => {
    const out = visibleProjetos([arquivado, ativo], none);
    expect(out).toEqual([ativo]);
    expect(projetos).toHaveLength(2);
  });
});