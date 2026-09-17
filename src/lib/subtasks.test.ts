import { describe, expect, it } from "vitest";
import { addSub, findSubTree, insertSubAt, isDescendant, makeSub, mapSubs, MAX_SUB_DEPTH, removeSub, subLevel } from "./subtasks";
import type { SubTask } from "./types";

const sub = (id: string, subs: SubTask[] = []): SubTask => ({
  id,
  text: `t ${id}`,
  note: "",
  prio: 3,
  due: "",
  status: "todo",
  blocked: false, blockedReason: "",
  subs,
});

const tree = () => [sub("a", [sub("a1", [sub("a1x")]), sub("a2")]), sub("b")];

describe("makeSub", () => {
  it("cria sub com defaults (prio 5, todo, vazia)", () => {
    const s = makeSub("nova");
    expect(s).toEqual({
      id: expect.any(String),
      text: "nova",
      note: "",
      prio: 5,
      due: "",
      status: "todo",
      blocked: false,
      blockedReason: "",
      subs: [],
    });
  });
});

describe("mapSubs", () => {
  it("mapeia sub no topo", () => {
    expect(mapSubs(tree(), "b", (s) => ({ ...s, prio: 1 }))[1].prio).toBe(1);
  });

  it("mapeia sub em profundidade preservando irmãos", () => {
    const out = mapSubs(tree(), "a1x", (s) => ({ ...s, status: "done" }));
    expect(out[0].subs[0].subs[0].status).toBe("done");
    expect(out[0].subs[1].text).toBe("t a2");
    expect(out[1].text).toBe("t b");
  });

  it("retorna array novo sem mutar o original", () => {
    const original = tree();
    const out = mapSubs(original, "a", (s) => ({ ...s, status: "done" }));
    expect(out).not.toBe(original);
    expect(original[0].status).toBe("todo");
  });

  it("id inexistente não altera nada", () => {
    expect(mapSubs(tree(), "zzz", (s) => ({ ...s, status: "done" }))).toEqual(tree());
  });
});

describe("removeSub", () => {
  it("remove sub no topo", () => {
    expect(removeSub(tree(), "b").map((s) => s.id)).toEqual(["a"]);
  });

  it("remove sub em profundidade", () => {
    const out = removeSub(tree(), "a1x");
    expect(out[0].subs[0].subs).toEqual([]);
    expect(out[0].subs.map((s) => s.id)).toEqual(["a1", "a2"]);
  });

  it("id inexistente não altera nada", () => {
    expect(removeSub(tree(), "zzz")).toEqual(tree());
  });
});

describe("addSub", () => {
  it("adiciona filho à sub do topo", () => {
    const out = addSub(tree(), "b", sub("b1"));
    expect(out[1].subs.map((s) => s.id)).toEqual(["b1"]);
  });

  it("adiciona filho em profundidade", () => {
    const out = addSub(tree(), "a2", sub("a2x"));
    expect(out[0].subs[1].subs.map((s) => s.id)).toEqual(["a2x"]);
  });

  it("id inexistente não altera nada", () => {
    expect(addSub(tree(), "zzz", sub("x"))).toEqual(tree());
  });
});

describe("findSubTree", () => {
  it("encontra sub no topo", () => {
    expect(findSubTree(tree(), "b")?.id).toBe("b");
  });

  it("encontra sub em profundidade", () => {
    expect(findSubTree(tree(), "a1x")?.id).toBe("a1x");
  });

  it("retorna null para id inexistente", () => {
    expect(findSubTree(tree(), "zzz")).toBeNull();
  });
});

describe("isDescendant", () => {
  it("filho direto é descendente", () => {
    expect(isDescendant(tree(), "a", "a1")).toBe(true);
  });

  it("neto é descendente (recursivo)", () => {
    expect(isDescendant(tree(), "a", "a1x")).toBe(true);
  });

  it("irmão não é descendente", () => {
    expect(isDescendant(tree(), "a1", "a2")).toBe(false);
  });

  it("a própria sub não é descendente de si", () => {
    expect(isDescendant(tree(), "a", "a")).toBe(false);
  });

  it("pai não é descendente do filho", () => {
    expect(isDescendant(tree(), "a1x", "a")).toBe(false);
  });

  it("id inexistente não é descendente de nada", () => {
    expect(isDescendant(tree(), "a", "zzz")).toBe(false);
  });
});

describe("insertSubAt", () => {
  it("insere como filho no índice 0", () => {
    const out = insertSubAt(tree(), "a", sub("anew"), 0);
    expect(out[0].subs.map((s) => s.id)).toEqual(["anew", "a1", "a2"]);
  });

  it("insere como filho no meio", () => {
    const out = insertSubAt(tree(), "a", sub("anew"), 1);
    expect(out[0].subs.map((s) => s.id)).toEqual(["a1", "anew", "a2"]);
  });

  it("insere em profundidade", () => {
    const out = insertSubAt(tree(), "a1x", sub("deep"), 0);
    expect(out[0].subs[0].subs[0].subs.map((s) => s.id)).toEqual(["deep"]);
  });

  it("índice fora do range clampa pro fim", () => {
    const out = insertSubAt(tree(), "a", sub("anew"), 99);
    expect(out[0].subs.map((s) => s.id)).toEqual(["a1", "a2", "anew"]);
  });

  it("pai inexistente não altera nada", () => {
    expect(insertSubAt(tree(), "zzz", sub("x"), 0)).toEqual(tree());
  });
});
describe("subLevel / MAX_SUB_DEPTH", () => {
  it("subLevel retorna 1 pra sub de task, 2 pra subsub, null se não acha", () => {
    const tree = [sub("a", [sub("a1", [sub("a1x")]), sub("a2")]), sub("b")];
    expect(subLevel(tree, "a")).toBe(1);
    expect(subLevel(tree, "a1")).toBe(2);
    expect(subLevel(tree, "a1x")).toBe(3);
    expect(subLevel(tree, "zzz")).toBe(null);
  });

  it("MAX_SUB_DEPTH é 2", () => {
    expect(MAX_SUB_DEPTH).toBe(2);
  });
});
