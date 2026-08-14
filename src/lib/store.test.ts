import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBoardStore, setStorageErrorHandler } from "./store";
import type { Project } from "./types";

const seedProjeto = (): Project => ({
  id: "p1",
  title: "Projeto A",
  blocked: false,
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
    const novo = [{ id: "x", title: "Importado", blocked: false, sections: [] }];
    store.getState().importState(novo);
    expect(store.getState().projetos).toEqual(novo);
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
