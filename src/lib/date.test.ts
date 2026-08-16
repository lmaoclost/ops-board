import { describe, expect, it } from "vitest";
import { fmtDate, isDueSoon, isOverdue, todayISO } from "./date";

describe("todayISO", () => {
  it("retorna data de hoje no formato YYYY-MM-DD", () => {
    const m = todayISO().match(/^\d{4}-\d{2}-\d{2}$/);
    expect(m).not.toBeNull();
  });
});

describe("fmtDate", () => {
  it("converte ISO em DD/MM/YYYY", () => {
    expect(fmtDate("2026-08-13")).toBe("13/08/2026");
  });
  it("retorna vazio sem data", () => {
    expect(fmtDate("")).toBe("");
    expect(fmtDate(undefined as unknown as string)).toBe("");
  });
});

describe("isOverdue", () => {
  it("verdadeiro para vencida não concluída", () => {
    expect(isOverdue("2000-01-01", "todo")).toBe(true);
  });
  it("falso para concluída ou sem data", () => {
    expect(isOverdue("2000-01-01", "done")).toBe(false);
    expect(isOverdue("", "todo")).toBe(false);
  });
  it("falso para vencimento futuro", () => {
    expect(isOverdue("2999-01-01", "todo")).toBe(false);
  });
});

describe("isDueSoon", () => {
  it("verdadeiro para até 2 dias", () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect(isDueSoon(iso, "todo")).toBe(true);
  });
  it("falso para mais de 2 dias", () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    expect(isDueSoon(iso, "todo")).toBe(false);
  });
  it("falso para concluída", () => {
    expect(isDueSoon("2999-01-01", "done")).toBe(false);
  });
});