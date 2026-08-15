import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBoardStore, setStorageErrorHandler } from "./store";
import type { Project } from "./types";

const seedProjeto = (): Project => ({
  id: "p1",
  title: "Projeto A",
  blocked: false,
  archived: false,
  sections: [
    { id: "s1", title: "geral", notes: "", collapsed: false, tasks: [
      { id: "t1", text: "tarefa 1", status: "todo" as const, note: "", blocked: false, prio: 3, due: "", doneAt: null },
      { id: "t2", text: "tarefa 2", status: "done" as const, note: "", blocked: false, prio: 3, due: "", doneAt: "2026-01-01T10:00:00.000Z" },
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

  it("exclui projeto", () => {
    store.getState().deleteProject("p1");
    expect(store.getState().projetos).toHaveLength(0);
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

  it("edita campos de tarefa via patch", () => {
    store.getState().editTask("p1", "s1", "t1", { note: "nota", prio: 1, due: "2026-02-01", blocked: true });
    const t = store.getState().projetos[0].sections[0].tasks[0];
    expect(t.note).toBe("nota");
    expect(t.prio).toBe(1);
    expect(t.due).toBe("2026-02-01");
    expect(t.blocked).toBe(true);
  });

  it("exclui tarefa", () => {
    store.getState().deleteTask("p1", "s1", "t1");
    expect(store.getState().projetos[0].sections[0].tasks.map((t) => t.id)).toEqual(["t2"]);
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
    const novo = [{ id: "x", title: "Importado", blocked: false, archived: false, sections: [] }];
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
    expect(store.getState().projetos[0].sections[0].tasks.map((t) => t.id)).toEqual(["t2"]);
    expect(store.getState().canUndo).toBe(true);

    store.getState().undo();
    const t = store.getState().projetos[0].sections[0].tasks[0];
    expect(t.id).toBe("t1");
    expect(t.text).toBe("tarefa 1");
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
    store.getState().importState([{ id: "x", title: "Importado", blocked: false, archived: false, sections: [] }]);
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
        state: { projetos: [{ id: "p1", title: "P", blocked: false, sections: [{ id: "s1", title: "geral", notes: "", collapsed: false, tasks: [{ id: "t1", text: "x", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null }] }] }] },
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
