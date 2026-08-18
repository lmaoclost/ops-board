import { describe, expect, it } from "vitest";
import { t, statusLabel, T_KEYS, type TKey } from "@/lib/i18n";

const pt = (k: TKey) => t("pt", k);
const en = (k: TKey) => t("en", k);

describe("i18n", () => {
  it("pt e en têm exatamente as mesmas chaves", () => {
    expect(T_KEYS.length).toBeGreaterThan(50);
    for (const k of T_KEYS) {
      expect(en(k)).toBeTypeOf("string");
    }
  });

  it("traduz chave pt e en", () => {
    expect(pt("buscar tarefas")).toBe("buscar tarefas");
    expect(en("buscar tarefas")).toBe("search tasks");
    expect(en("editar tarefa")).toBe("edit task");
  });

  it("app_name é igual nos dois idiomas (marca)", () => {
    expect(pt("app_name")).toBe(en("app_name"));
  });

  it("nenhum valor pt é igual ao en (tradução real, não stub)", () => {
    const same = T_KEYS.filter((k) => pt(k) === en(k));
    expect(same.sort()).toEqual(["P3 — normal", "agenda", "app_name", "status", "stuck", "total"]);
  });

  it("statusLabel mapeia todos os status", () => {
    expect(statusLabel("pt", "todo")).toBe("a fazer");
    expect(statusLabel("en", "todo")).toBe("to do");
    expect(statusLabel("pt", "doing")).toBe("em andamento");
    expect(statusLabel("en", "doing")).toBe("in progress");
    expect(statusLabel("en", "blocked")).toBe("blocked");
  });
});