import { describe, expect, it } from "vitest";
import { nextDue } from "./repeat";

describe("nextDue", () => {
  it("daily avança 1 dia a partir de due futura", () => {
    expect(nextDue("daily", "2026-08-20", "2026-08-18")).toBe("2026-08-21");
  });

  it("weekly avança 7 dias", () => {
    expect(nextDue("weekly", "2026-08-20", "2026-08-18")).toBe("2026-08-27");
  });

  it("base = hoje quando due vencida ou ausente (nunca volta vencida)", () => {
    expect(nextDue("daily", "2026-08-10", "2026-08-18")).toBe("2026-08-19");
    expect(nextDue("weekly", "", "2026-08-18")).toBe("2026-08-25");
    expect(nextDue("daily", "", "2026-08-18")).toBe("2026-08-19");
  });

  it("monthly avança mês com clamp de fim de mês", () => {
    expect(nextDue("monthly", "2026-01-15", "2026-01-10")).toBe("2026-02-15");
    expect(nextDue("monthly", "2026-01-31", "2026-01-10")).toBe("2026-02-28");
    expect(nextDue("monthly", "2026-12-10", "2026-12-05")).toBe("2027-01-10");
  });
});