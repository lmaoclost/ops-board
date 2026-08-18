import { describe, expect, it } from "vitest";
import { blockedBy } from "./deps";
import type { Task } from "./types";

const task = (id: string, status: Task["status"] = "todo", dependsOn?: string[]): Task => ({
  id,
  text: id,
  status,
  note: "",
  blocked: false,
  prio: 3,
  due: "",
  doneAt: null,
  subs: [],
  dependsOn,
});

describe("blockedBy", () => {
  it("retorna dependência pendente", () => {
    const a = task("a");
    const b = task("b", "todo", ["a"]);
    expect(blockedBy(b, [a, b])?.id).toBe("a");
  });

  it("undefined sem dependências ou com todas done", () => {
    expect(blockedBy(task("x"), [task("a")])).toBeUndefined();
    const a = task("a", "done");
    const b = task("b", "todo", ["a"]);
    expect(blockedBy(b, [a, b])).toBeUndefined();
  });

  it("ignora dependência inexistente", () => {
    const b = task("b", "todo", ["zz"]);
    expect(blockedBy(b, [b])).toBeUndefined();
  });
});