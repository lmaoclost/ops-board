import { describe, expect, it, vi } from "vitest";
import { chime } from "./celebrate";

class FakeCtx {
  currentTime = 0;
  destination = {};
  createOscillator() {
    return { type: "", frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
  }
  createGain() {
    return { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() };
  }
}

describe("chime", () => {
  it("toca um chime quando AudioContext existe", () => {
    const ctx = new FakeCtx();
    const start = vi.spyOn(ctx, "createOscillator");
    const Ctor = vi.fn(function Ctor() { return ctx; });
    Object.defineProperty(window, "AudioContext", { value: Ctor, configurable: true });
    chime();
    expect(start).toHaveBeenCalled();
    delete (window as unknown as Record<string, unknown>).AudioContext;
  });

  it("não explode sem AudioContext", () => {
    expect(() => chime()).not.toThrow();
  });
});