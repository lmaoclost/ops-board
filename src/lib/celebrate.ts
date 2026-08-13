import confetti from "canvas-confetti";

export function chime(): void {
  const Ctx = (globalThis as { AudioContext?: unknown }).AudioContext ?? (typeof window !== "undefined" ? (window as { AudioContext?: unknown }).AudioContext : undefined);
  if (!Ctx) return;
  try {
    const ctx = new (Ctx as new () => {
      currentTime: number;
      destination: unknown;
      createOscillator(): {
        type: string;
        frequency: { value: number };
        connect(d: unknown): void;
        start(t?: number): void;
        stop(t?: number): void;
      };
      createGain(): { gain: { setValueAtTime(v: number, t: number): void }; connect(d: unknown): void };
    })();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    return;
  }
}

export function celebrate(): void {
  chime();
  try {
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, zIndex: 60 });
  } catch {
    return;
  }
}