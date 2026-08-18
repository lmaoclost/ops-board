import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBoardStore, reconcileSubs, setStorageErrorHandler } from "./store";
import type { Project } from "./types";

const seedProjeto = (): Project => ({
  id: "p1",
  title: "Projeto A",
  blocked: false,
  archived: false, prio: 3, due: "", collapsed: false,
  sections: [
    { id: "s1", title: "geral", notes: "", collapsed: false, tasks: [
      { id: "t1", text: "tarefa 1", status: "todo" as const, note: "", blocked: false, prio: 3, due: "", doneAt: null, subs: [] },
      { id: "t2", text: "tarefa 2", status: "done" as const, note: "", blocked: false, prio: 3, due: "", doneAt: "2026-01-01T10:00:00.000Z", subs: [] },
    ] },
  ],
});

describe("board store", () => {
  let store: ReturnType<typeof createBoardStore>;

  beforeEach(() => {
    store = createBoardStore();
    store.setState({ projetos: [seedProjeto()] });
  });

  it("adiciona projeto com seção geral vazia", () => {
    store.getState().addProject("Novo");
    const p = store.getState().projetos.at(-1)!;
    expect(p.title).toBe("Novo");
    expect(p.sections).toHaveLength(1);
    expect(p.sections[0].title).toBe("geral");
    expect(p.sections[0].tasks).toEqual([]);
  });

  it("renomeia e marca projeto como bloqueado", () => {
    store.getState().renameProject("p1", "Renomeado", true);
    const p = store.getState().projetos[0];
    expect(p.title).toBe("Renomeado");
    expect(p.blocked).toBe(true);
  });

  it("renameProject sem due preserva o vencimento atual", () => {
    store.getState().setProjectPrio("p1", 1);
    store.getState().renameProject("p1", "X", false);
    expect(store.getState().projetos[0].due).toBe("");
    store.getState().renameProject("p1", "Y", false, "2026-09-01");
    expect(store.getState().projetos[0].due).toBe("2026-09-01");
    store.getState().renameProject("p1", "Z", false);
    expect(store.getState().projetos[0].due).toBe("2026-09-01");
  });

  it("exclui projeto", () => {
    store.getState().deleteProject("p1");
    expect(store.getState().projetos).toHaveLength(0);
  });

  it("define prioridade do projeto", () => {
    store.getState().setProjectPrio("p1", 1);
    expect(store.getState().projetos[0].prio).toBe(1);
  });

  it("alterna colapso do projeto", () => {
    store.getState().toggleProjectCollapsed("p1");
    expect(store.getState().projetos[0].collapsed).toBe(true);
    store.getState().toggleProjectCollapsed("p1");
    expect(store.getState().projetos[0].collapsed).toBe(false);
  });

  it("adiciona, renomeia e exclui seção", () => {
    store.getState().addSection("p1", "dev");
    expect(store.getState().projetos[0].sections.map((s) => s.title)).toEqual(["geral", "dev"]);
    store.getState().renameSection("p1", "s1", "geral 2");
    expect(store.getState().projetos[0].sections[0].title).toBe("geral 2");
    store.getState().deleteSection("p1", "s1");
    expect(store.getState().projetos[0].sections.map((s) => s.title)).toEqual(["dev"]);
  });

  it("adiciona tarefa nova em todo", () => {
    store.getState().addTask("p1", "s1", "  nova  ");
    const tasks = store.getState().projetos[0].sections[0].tasks;
    expect(tasks.at(-1)!.text).toBe("nova");
    expect(tasks.at(-1)!.status).toBe("todo");
  });

  it("addTaskFull cria tarefa com status, campos e subs", () => {
    store.getState().addTaskFull("p1", "s1", {
      text: "  kanban  ",
      status: "doing",
      note: "obs",
      prio: 1,
      due: "2026-03-01",
      blocked: true,
      subs: [{ id: "a", text: "sub", note: "", prio: 3, due: "", status: "todo", blocked: false, subs: [] }],
    });
    const t = store.getState().projetos[0].sections[0].tasks.at(-1)!;
    expect(t.text).toBe("kanban");
    expect(t.status).toBe("doing");
    expect(t.note).toBe("obs");
    expect(t.prio).toBe(1);
    expect(t.due).toBe("2026-03-01");
    expect(t.blocked).toBe(true);
    expect(t.subs).toHaveLength(1);
    expect(t.doneAt).toBeNull();
  });

  it("addTaskFull com status done marca doneAt", () => {
    store.getState().addTaskFull("p1", "s1", { text: "feita", status: "done" });
    const t = store.getState().projetos[0].sections[0].tasks.at(-1)!;
    expect(t.status).toBe("done");
    expect(t.doneAt).not.toBeNull();
  });

  it("addTaskFull é uma entrada única de undo", () => {
    store.getState().addTaskFull("p1", "s1", { text: "x", status: "todo", note: "n", prio: 1 });
    expect(store.getState().projetos[0].sections[0].tasks.some((x) => x.text === "x")).toBe(true);
    store.getState().undo();
    expect(store.getState().projetos[0].sections[0].tasks.map((x) => x.text)).toEqual(["tarefa 1", "tarefa 2"]);
  });

  it("edita campos de tarefa via patch", () => {
    store.getState().editTask("p1", "s1", "t1", { note: "nota", prio: 1, due: "2026-02-01", blocked: true });
    const t = store.getState().projetos[0].sections[0].tasks[0];
    expect(t.note).toBe("nota");
    expect(t.prio).toBe(1);
    expect(t.due).toBe("2026-02-01");
    expect(t.blocked).toBe(true);
  });

  it("subs: todas done tornam a tarefa pai done; parcial mantém todo", () => {
    const subA = { id: "a", text: "sub a", note: "", prio: 3 as const, due: "", status: "todo" as const, blocked: false, subs: [] };
    const subB = { id: "b", text: "sub b", note: "", prio: 3 as const, due: "", status: "todo" as const, blocked: false, subs: [] };
    store.getState().editTask("p1", "s1", "t1", { subs: [subA, subB] });
    store.getState().editTask("p1", "s1", "t1", { subs: [{ ...subA, status: "done" }, subB] });
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("todo");
    store.getState().editTask("p1", "s1", "t1", { subs: [{ ...subA, status: "done" }, { ...subB, status: "done" }] });
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("done");
  });

  it("subs: desmarcar uma sub em tarefa done volta o pai para todo", () => {
    const subA = { id: "a", text: "sub a", note: "", prio: 3 as const, due: "", status: "done" as const, blocked: false, subs: [] };
    const subB = { id: "b", text: "sub b", note: "", prio: 3 as const, due: "", status: "done" as const, blocked: false, subs: [] };
    store.getState().editTask("p1", "s1", "t1", { subs: [subA, subB] });
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("done");
    store.getState().editTask("p1", "s1", "t1", { subs: [{ ...subA, status: "todo" }, subB] });
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("todo");
  });

  it("reconcilia sub com subs próprias: só done quando todas as filhas são done", () => {
    const filha1 = { id: "x", text: "x", note: "", prio: 3 as const, due: "", status: "todo" as const, blocked: false, subs: [] };
    const filha2 = { id: "y", text: "y", note: "", prio: 3 as const, due: "", status: "todo" as const, blocked: false, subs: [] };
    const subA = { id: "a", text: "sub a", note: "", prio: 3 as const, due: "", status: "todo" as const, blocked: false, subs: [filha1, filha2] };
    store.getState().editTask("p1", "s1", "t1", { subs: [subA] });

    store.getState().editTask("p1", "s1", "t1", {
      subs: [{ ...subA, subs: [{ ...filha1, status: "done" }, filha2] }],
    });
    const t1 = store.getState().projetos[0].sections[0].tasks[0];
    expect(t1.subs[0].status).toBe("todo");
    expect(t1.status).toBe("todo");

    store.getState().editTask("p1", "s1", "t1", {
      subs: [{ ...subA, subs: [{ ...filha1, status: "done" }, { ...filha2, status: "done" }] }],
    });
    const t2 = store.getState().projetos[0].sections[0].tasks[0];
    expect(t2.subs[0].status).toBe("done");
    expect(t2.status).toBe("done");
  });

  it("reconcilia recursivamente: desmarcar neta volta sub e pai para todo", () => {
    const neta = { id: "x", text: "x", note: "", prio: 3 as const, due: "", status: "done" as const, blocked: false, subs: [] };
    const subA = { id: "a", text: "sub a", note: "", prio: 3 as const, due: "", status: "todo" as const, blocked: false, subs: [neta] };
    store.getState().editTask("p1", "s1", "t1", { subs: [subA] });
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("done");

    store.getState().editTask("p1", "s1", "t1", {
      subs: [{ ...subA, subs: [{ ...neta, status: "todo" }] }],
    });
    const t = store.getState().projetos[0].sections[0].tasks[0];
    expect(t.subs[0].status).toBe("todo");
    expect(t.status).toBe("todo");
  });

  it("reconcileSubs preserva status manual de sub sem filhas", () => {
    const out = reconcileSubs([
      { id: "a", text: "a", note: "", prio: 2 as const, due: "", status: "doing" as const, blocked: true, subs: [] },
    ]);
    expect(out[0].status).toBe("doing");
    expect(out[0].prio).toBe(2);
    expect(out[0].blocked).toBe(true);
  });

  it("exclui tarefa para a lixeira (soft delete)", () => {
    store.getState().deleteTask("p1", "s1", "t1");
    const t = store.getState().projetos[0].sections[0].tasks[0];
    expect(t.id).toBe("t1");
    expect(t.deletedAt).toBeTruthy();
  });

  it("restaura tarefa da lixeira e purge remove de vez", () => {
    store.getState().deleteTask("p1", "s1", "t1");
    store.getState().restoreTask("p1", "s1", "t1");
    expect(store.getState().projetos[0].sections[0].tasks[0].deletedAt).toBeNull();

    store.getState().deleteTask("p1", "s1", "t1");
    store.getState().purgeTask("p1", "s1", "t1");
    expect(store.getState().projetos[0].sections[0].tasks.map((t) => t.id)).toEqual(["t2"]);
  });

  it("toggleTask em tarefa recorrente re-agenda em vez de concluir", () => {
    store.getState().editTask("p1", "s1", "t1", { repeat: "daily", due: "2020-01-01" });
    store.getState().toggleTask("p1", "s1", "t1");
    const t = store.getState().projetos[0].sections[0].tasks[0];
    expect(t.status).toBe("todo");
    expect(t.doneAt).toBeNull();
    expect(t.due > "2020-01-01").toBe(true);
  });

  it("setTaskStatus done em tarefa recorrente re-agenda; toggle volta ao normal sem repeat", () => {
    store.getState().editTask("p1", "s1", "t1", { repeat: "weekly", due: "" });
    store.getState().setTaskStatus("p1", "s1", "t1", "done");
    const t = store.getState().projetos[0].sections[0].tasks[0];
    expect(t.status).toBe("todo");
    expect(t.repeat).toBe("weekly");

    store.getState().editTask("p1", "s1", "t1", { repeat: null });
    store.getState().setTaskStatus("p1", "s1", "t1", "done");
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("done");
  });

  it("grava doneAt ao concluir e limpa ao reabrir", () => {
    const before = Date.now();
    store.getState().setTaskStatus("p1", "s1", "t1", "done");
    const t = store.getState().projetos[0].sections[0].tasks[0];
    expect(t.status).toBe("done");
    expect(new Date(t.doneAt!).getTime()).toBeGreaterThanOrEqual(before);

    store.getState().setTaskStatus("p1", "s1", "t1", "todo");
    expect(store.getState().projetos[0].sections[0].tasks[0].doneAt).toBeNull();
  });

  it("toggleTask alterna entre todo e done", () => {
    store.getState().toggleTask("p1", "s1", "t1");
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("done");
    store.getState().toggleTask("p1", "s1", "t1");
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("todo");
  });

  it("muda prioridade ciclicamente", () => {
    store.getState().setTaskPrio("p1", "s1", "t1", 2);
    expect(store.getState().projetos[0].sections[0].tasks[0].prio).toBe(2);
  });

  it("cicla prioridade 1→2→3→1", () => {
    store.getState().setTaskPrio("p1", "s1", "t1", 1);
    store.getState().cycleTaskPrio("p1", "s1", "t1");
    expect(store.getState().projetos[0].sections[0].tasks[0].prio).toBe(2);
    store.getState().cycleTaskPrio("p1", "s1", "t1");
    expect(store.getState().projetos[0].sections[0].tasks[0].prio).toBe(3);
    store.getState().cycleTaskPrio("p1", "s1", "t1");
    expect(store.getState().projetos[0].sections[0].tasks[0].prio).toBe(1);
  });

  it("alterna collapse de seção", () => {
    store.getState().toggleSection("p1", "s1");
    expect(store.getState().projetos[0].sections[0].collapsed).toBe(true);
    store.getState().toggleSection("p1", "s1");
    expect(store.getState().projetos[0].sections[0].collapsed).toBe(false);
  });

  it("move tarefa entre seções em índice específico", () => {
    store.setState({
      projetos: [
        {
          ...seedProjeto(),
          sections: [
            seedProjeto().sections[0],
            { id: "s2", title: "outra", notes: "", collapsed: false, tasks: [] },
          ],
        },
      ],
    });
    store.getState().moveTask({ pid: "p1", sid: "s1", tid: "t1" }, { pid: "p1", sid: "s2" }, 0);
    const s2 = store.getState().projetos[0].sections[1];
    expect(s2.tasks.map((t) => t.id)).toEqual(["t1"]);
    expect(store.getState().projetos[0].sections[0].tasks.map((t) => t.id)).toEqual(["t2"]);
  });

  it("move tarefa dentro da mesma seção (reordena)", () => {
    store.getState().moveTask({ pid: "p1", sid: "s1", tid: "t1" }, { pid: "p1", sid: "s1" }, 1);
    expect(store.getState().projetos[0].sections[0].tasks.map((t) => t.id)).toEqual(["t2", "t1"]);
  });

  it("reset limpa tudo", () => {
    store.getState().reset();
    expect(store.getState().projetos).toEqual([]);
  });

  it("importState substitui estado", () => {
    const novo: Project[] = [{ id: "x", title: "Importado", blocked: false, archived: false, prio: 3, due: "", collapsed: false, sections: [] }];
    store.getState().importState(novo);
    expect(store.getState().projetos).toEqual(novo);
  });

  it("toggleProjectArchive arquiva e desarquiva", () => {
    store.getState().addProject("A");
    const pid = store.getState().projetos[0].id;
    store.getState().toggleProjectArchive(pid);
    expect(store.getState().projetos[0].archived).toBe(true);
    store.getState().toggleProjectArchive(pid);
    expect(store.getState().projetos[0].archived).toBe(false);
  });

  it("canUndo começa false", () => {
    expect(store.getState().canUndo).toBe(false);
  });

  it("deleteTask é desfeita restaurando a tarefa", () => {
    store.getState().deleteTask("p1", "s1", "t1");
    expect(store.getState().projetos[0].sections[0].tasks[0].deletedAt).toBeTruthy();
    expect(store.getState().canUndo).toBe(true);

    store.getState().undo();
    const t = store.getState().projetos[0].sections[0].tasks[0];
    expect(t.id).toBe("t1");
    expect(t.text).toBe("tarefa 1");
    expect(t.deletedAt).toBeFalsy();
    expect(store.getState().canUndo).toBe(false);
  });

  it("addProject é desfeito removendo o projeto", () => {
    store.getState().addProject("Novo");
    expect(store.getState().projetos).toHaveLength(2);
    store.getState().undo();
    expect(store.getState().projetos).toHaveLength(1);
    expect(store.getState().projetos[0].id).toBe("p1");
  });

  it("addSection e addTask são desfeitas", () => {
    store.getState().addSection("p1", "dev");
    store.getState().addTask("p1", "s1", "nova");
    store.getState().undo();
    expect(store.getState().projetos[0].sections[0].tasks.map((t) => t.text)).toEqual(["tarefa 1", "tarefa 2"]);
    store.getState().undo();
    expect(store.getState().projetos[0].sections.map((s) => s.title)).toEqual(["geral"]);
  });

  it("renameProject é desfeita restaurando título e bloqueio", () => {
    store.getState().renameProject("p1", "Renomeado", true);
    store.getState().undo();
    const p = store.getState().projetos[0];
    expect(p.title).toBe("Projeto A");
    expect(p.blocked).toBe(false);
  });

  it("editTask é desfeita restaurando campos", () => {
    store.getState().editTask("p1", "s1", "t1", { note: "nota", prio: 1, due: "2026-02-01", blocked: true });
    store.getState().undo();
    const t = store.getState().projetos[0].sections[0].tasks[0];
    expect(t.note).toBe("");
    expect(t.prio).toBe(3);
    expect(t.due).toBe("");
    expect(t.blocked).toBe(false);
  });

  it("toggleTask é desfeita", () => {
    store.getState().toggleTask("p1", "s1", "t1");
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("done");
    store.getState().undo();
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("todo");
  });

  it("moveTask é desfeita restaurando a ordem", () => {
    store.setState({
      projetos: [
        {
          ...seedProjeto(),
          sections: [
            seedProjeto().sections[0],
            { id: "s2", title: "outra", notes: "", collapsed: false, tasks: [] },
          ],
        },
      ],
    });
    store.getState().moveTask({ pid: "p1", sid: "s1", tid: "t1" }, { pid: "p1", sid: "s2" }, 0);
    expect(store.getState().projetos[0].sections[1].tasks.map((t) => t.id)).toEqual(["t1"]);
    store.getState().undo();
    expect(store.getState().projetos[0].sections[0].tasks.map((t) => t.id)).toEqual(["t1", "t2"]);
    expect(store.getState().projetos[0].sections[1].tasks).toEqual([]);
  });

  it("importState é desfeita restaurando os projetos anteriores", () => {
    const antes = store.getState().projetos;
    store.getState().importState([{ id: "x", title: "Importado", blocked: false, archived: false, prio: 3 as const, due: "", collapsed: false, sections: [] }]);
    store.getState().undo();
    expect(store.getState().projetos).toEqual(antes);
  });

  it("reset é desfeita restaurando tudo", () => {
    store.getState().reset();
    expect(store.getState().projetos).toEqual([]);
    store.getState().undo();
    expect(store.getState().projetos).toHaveLength(1);
    expect(store.getState().projetos[0].sections[0].tasks).toHaveLength(2);
  });

  it("toggleProjectArchive é desfeita", () => {
    store.getState().toggleProjectArchive("p1");
    expect(store.getState().projetos[0].archived).toBe(true);
    store.getState().undo();
    expect(store.getState().projetos[0].archived).toBe(false);
  });

  it("toggleSection não cria passo de undo (estado de visualização)", () => {
    store.getState().toggleSection("p1", "s1");
    expect(store.getState().canUndo).toBe(false);
  });

  it("undo linear desfaz cada passo mesmo voltando ao mesmo estado", () => {
    store.getState().toggleTask("p1", "s1", "t1");
    store.getState().toggleTask("p1", "s1", "t1");
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("todo");
    store.getState().undo();
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("done");
    expect(store.getState().canUndo).toBe(true);
    store.getState().undo();
    expect(store.getState().projetos[0].sections[0].tasks[0].status).toBe("todo");
    expect(store.getState().canUndo).toBe(false);
  });

  it("undo vazio não quebra nem altera estado", () => {
    store.getState().undo();
    store.getState().undo();
    expect(store.getState().projetos).toHaveLength(1);
    expect(store.getState().canUndo).toBe(false);
  });

  it("undo em sequência desfaz passo a passo", () => {
    store.getState().addProject("A");
    store.getState().addProject("B");
    expect(store.getState().projetos).toHaveLength(3);
    store.getState().undo();
    expect(store.getState().projetos).toHaveLength(2);
    expect(store.getState().canUndo).toBe(true);
    store.getState().undo();
    expect(store.getState().projetos).toHaveLength(1);
    expect(store.getState().canUndo).toBe(false);
  });

  it("stack limita a 50 passos (os mais recentes)", () => {
    for (let i = 0; i < 60; i++) store.getState().addProject(`p${i}`);
    expect(store.getState().projetos).toHaveLength(61);
    for (let i = 0; i < 55; i++) store.getState().undo();
    expect(store.getState().canUndo).toBe(false);
    expect(store.getState().projetos).toHaveLength(11);
  });

  it("canUndo não é persistido", () => {
    localStorage.clear();
    const s = createBoardStore();
    s.getState().addProject("X");
    s.getState().undo();
    const stored = JSON.parse(localStorage.getItem("opsboard.v1")!);
    expect(stored.state).not.toHaveProperty("canUndo");
  });
});

describe("persistência", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("rehidrata estado salvo pelo próprio app", () => {
    localStorage.setItem(
      "opsboard.v1",
      JSON.stringify({
        state: { projetos: [{ id: "p1", title: "P", blocked: false, sections: [{ id: "s1", title: "geral", notes: "", collapsed: false, tasks: [{ id: "t1", text: "x", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null, subs: [] }] }] }] },
        version: 2,
      }),
    );
    const s = createBoardStore();
    expect(s.getState().projetos).toHaveLength(1);
    expect(s.getState().projetos[0].sections[0].tasks[0].text).toBe("x");
  });

  it("migra esquema v1 sem perder dados (defaults aplicados)", () => {
    localStorage.setItem(
      "opsboard.v1",
      JSON.stringify({
        state: {
          projetos: [
            {
              id: "p1",
              title: "P",
              blocked: false,
              sections: [
                {
                  id: "s1",
                  title: "geral",
                  tasks: [{ id: "t1", text: "x", status: "urgente", prio: 9, blocked: "sim", due: 5, note: 42, doneAt: "2026-01-01T00:00:00.000Z" }],
                },
              ],
            },
          ],
        },
        version: 1,
      }),
    );
    const s = createBoardStore();
    expect(s.getState().projetos).toHaveLength(1);
    const t = s.getState().projetos[0].sections[0].tasks[0];
    expect(t.text).toBe("x");
    expect(t.status).toBe("todo");
    expect(t.prio).toBe(3);
    expect(t.blocked).toBe(true);
    expect(t.due).toBe("5");
    expect(t.note).toBe("42");
    expect(t.doneAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("migra esquema v2 sem archived (default false aplicado)", () => {
    localStorage.setItem(
      "opsboard.v1",
      JSON.stringify({
        state: { projetos: [{ id: "p1", title: "P", blocked: false, sections: [] }] },
        version: 2,
      }),
    );
    const s = createBoardStore();
    expect(s.getState().projetos[0].archived).toBe(false);
  });

  it("estado vazio volta com projetos vazios", () => {
    const s = createBoardStore();
    expect(s.getState().projetos).toEqual([]);
  });

  it("v1 com lista vazia normaliza sem quebrar", () => {
    localStorage.setItem("opsboard.v1", JSON.stringify({ state: { projetos: [] }, version: 1 }));
    const s = createBoardStore();
    expect(s.getState().projetos).toEqual([]);
  });

  it("v1 sem campo projetos retorna lista vazia", () => {
    localStorage.setItem("opsboard.v1", JSON.stringify({ state: { foo: 1 }, version: 1 }));
    const s = createBoardStore();
    expect(s.getState().projetos).toEqual([]);
  });
});
describe("locale", () => {
  it("default pt", () => {
    const store = createBoardStore();
    expect(store.getState().locale).toBe("pt");
  });

  it("setLocale alterna", () => {
    const store = createBoardStore();
    store.getState().setLocale("en");
    expect(store.getState().locale).toBe("en");
  });
});

describe("storage error handler (quota)", () => {
  it("notifica quando setItem falha (quota excedida)", () => {
    const store = createBoardStore();
    const handler = vi.fn();
    setStorageErrorHandler(handler);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    try {
      store.setState({ projetos: [seedProjeto()] });
    } finally {
      spy.mockRestore();
      setStorageErrorHandler(null);
    }
    expect(handler).toHaveBeenCalled();
  });
});
