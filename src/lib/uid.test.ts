import { describe, expect, it, vi } from "vitest";
import { uid } from "./uid";

describe("uid", () => {
  it("gera identificador não vazio", () => {
    expect(uid()).toBeTruthy();
  });

  it("usa crypto.randomUUID quando disponível", () => {
    const spy = vi.spyOn(crypto, "randomUUID");
    uid();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("usa fallback quando crypto não existe", () => {
    const original = globalThis.crypto;
    vi.stubGlobal("crypto", undefined);
    const out = uid();
    expect(out.startsWith("id-")).toBe(true);
    expect(out.length).toBeGreaterThan(3);
    vi.unstubAllGlobals();
    expect(globalThis.crypto === original || globalThis.crypto !== undefined).toBe(true);
  });
});