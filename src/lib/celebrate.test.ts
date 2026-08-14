import { describe, expect, it, vi } from "vitest";
import { celebrate, chime } from "./celebrate";

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

  it("cala quando o usuário ainda não interagiu com a página", () => {
    const Ctor = vi.fn();
    Object.defineProperty(window, "AudioContext", { value: Ctor, configurable: true });
    Object.defineProperty(window.navigator, "userActivation", {
      value: { hasBeenActive: false },
      configurable: true,
    });
    chime();
    expect(Ctor).not.toHaveBeenCalled();
    delete (window as unknown as Record<string, unknown>).AudioContext;
    delete (window.navigator as unknown as Record<string, unknown>).userActivation;
  });

  it("engole falha ao tocar o oscilador", () => {
    const Ctor = vi.fn(() => ({
      currentTime: 0,
      destination: {},
      createGain: () => ({ gain: { setValueAtTime: vi.fn() }, connect: vi.fn() }),
      createOscillator: () => {
        throw new Error("boom");
      },
    }));
    Object.defineProperty(window, "AudioContext", { value: Ctor, configurable: true });
    expect(() => chime()).not.toThrow();
    delete (window as unknown as Record<string, unknown>).AudioContext;
  });
});

vi.mock("canvas-confetti", () => ({
  default: vi.fn(() => {
    throw new Error("boom");
  }),
}));

describe("celebrate", () => {
  it("não explode quando o confetti falha", () => {
    expect(() => celebrate()).not.toThrow();
  });
});