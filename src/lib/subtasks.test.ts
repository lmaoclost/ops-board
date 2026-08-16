import { describe, expect, it } from "vitest";
import { addSub, makeSub, mapSubs, removeSub } from "./subtasks";
import type { SubTask } from "./types";

const sub = (id: string, subs: SubTask[] = []): SubTask => ({
  id,
  text: `t ${id}`,
  note: "",
  prio: 3,
  due: "",
  status: "todo",
  blocked: false,
  subs,
});

const tree = () => [sub("a", [sub("a1", [sub("a1x")]), sub("a2")]), sub("b")];

describe("makeSub", () => {
  it("cria sub com defaults (prio 3, todo, vazia)", () => {
    const s = makeSub("nova");
    expect(s).toEqual({
      id: expect.any(String),
      text: "nova",
      note: "",
      prio: 3,
      due: "",
      status: "todo",
      blocked: false,
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