import { describe, expect, it } from "vitest";
import { applyStatusDrop, insertIndex, resolveDrop } from "./dnd";
import type { Project } from "./types";

const projeto = (over: Partial<Project> = {}): Project => ({
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
        { id: "t1", text: "a", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null },
        { id: "t2", text: "b", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null },
        { id: "t3", text: "c", status: "doing", note: "", blocked: false, prio: 3, due: "", doneAt: null },
      ],
    },
    { id: "s2", title: "dev", notes: "", collapsed: false, tasks: [] },
  ],
  ...over,
});

describe("resolveDrop", () => {
  it("reordena dentro da mesma seção (posição pós-remoção)", () => {
    const r = resolveDrop({ projetos: [projeto()], active: "task:t1", over: "task:t2" });
    expect(r.kind).toBe("move");
    if (r.kind !== "move") return;
    expect(r.src).toEqual({ pid: "p1", sid: "s1", tid: "t1" });
    expect(r.dest).toEqual({ pid: "p1", sid: "s1" });
    expect(r.index).toBe(1);
  });

  it("mover para baixo ajusta índice pela remoção", () => {
    const r = resolveDrop({ projetos: [projeto()], active: "task:t2", over: "task:t1" });
    expect(r.kind).toBe("move");
    if (r.kind !== "move") return;
    expect(r.index).toBe(0);
  });

  it("move para seção vazia no índice 0", () => {
    const r = resolveDrop({ projetos: [projeto()], active: "task:t1", over: "sec:p1:s2" });
    expect(r.kind).toBe("move");
    if (r.kind !== "move") return;
    expect(r.dest).toEqual({ pid: "p1", sid: "s2" });
    expect(r.index).toBe(0);
  });

  it("drop em coluna kanban marca status", () => {
    const r = resolveDrop({ projetos: [projeto()], active: "task:t1", over: "k:done" });
    expect(r.kind).toBe("status");
    if (r.kind !== "status") return;
    expect(r.status).toBe("done");
  });

  it("drop kanban na mesma coluna mantém status atual", () => {
    const r = resolveDrop({ projetos: [projeto()], active: "task:t3", over: "k:doing" });
    expect(r.kind).toBe("status");
    if (r.kind !== "status") return;
    expect(r.status).toBe("doing");
  });

  it("ignora alvo desconhecido", () => {
    const r = resolveDrop({ projetos: [projeto()], active: "task:t1", over: "sec:pp:xx" });
    expect(r.kind).toBe("none");
  });

  it("retorna none para tarefa ativa inexistente", () => {
    const r = resolveDrop({ projetos: [projeto()], active: "task:fantasma", over: "task:t1" });
    expect(r.kind).toBe("none");
  });

it("retorna none quando o alvo task não existe", () => {
    const r = resolveDrop({ projetos: [projeto()], active: "task:t1", over: "task:fantasma" });
    expect(r.kind).toBe("none");
  });

  it("move para outra seção no índice do alvo", () => {
    const comTarefaNaSegunda = projeto({
      sections: [
        projeto().sections[0],
        { id: "s2", title: "dev", notes: "", collapsed: false, tasks: [
          { id: "t4", text: "d", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null },
        ] },
      ],
    });
    const r = resolveDrop({ projetos: [comTarefaNaSegunda], active: "task:t1", over: "task:t4" });
    expect(r.kind).toBe("move");
    if (r.kind !== "move") return;
    expect(r.dest).toEqual({ pid: "p1", sid: "s2" });
    expect(r.index).toBe(0);
  });
});

  it("retorna none quando a seção de origem sumiu", () => {
    const r = resolveDrop({ projetos: [projeto()], active: "task:t1", over: "boss:xyz" });
    expect(r.kind).toBe("none");
  });
});

describe("insertIndex", () => {
  it("retorna o índice do alvo (remoção já aplicada)", () => {
    expect(insertIndex({ overIdx: 3 })).toBe(3);
    expect(insertIndex({ overIdx: 0 })).toBe(0);
  });
});

describe("applyStatusDrop", () => {
  const src = { pid: "p1", sid: "s1", tid: "t1" };

  it("marca done e grava doneAt ao concluir", () => {
    const patch = applyStatusDrop("done");
    expect(patch.status).toBe("done");
    expect(patch.doneAt).not.toBeNull();
  });

  it("limpa doneAt ao sair de done", () => {
    const patch = applyStatusDrop("todo", true);
    expect(patch.status).toBe("todo");
    expect(patch.doneAt).toBeNull();
  });

  it("mantém doneAt quando status não muda", () => {
    const patch = applyStatusDrop("doing");
    expect(patch.doneAt).toBeUndefined();
  });

  it("tipo com src disponível para callers futuros", () => {
    expect(src.pid).toBe("p1");
  });
});