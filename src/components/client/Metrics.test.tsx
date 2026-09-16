import { render, screen, act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Metrics, METRICS_KEY, METRICS_EVENT, readMetricsConsent } from "./Metrics";

vi.mock("@vercel/analytics/next", () => ({
  Analytics: ({ beforeSend }: { beforeSend?: (e: unknown) => unknown }) => (
    <div data-testid="analytics" data-gated={typeof beforeSend === "function" ? "" : undefined} />
  ),
}));

vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: ({ beforeSend }: { beforeSend?: (e: unknown) => unknown }) => (
    <div data-testid="speed-insights" data-gated={typeof beforeSend === "function" ? "" : undefined} />
  ),
}));

describe("readMetricsConsent", () => {
  beforeEach(() => localStorage.clear());

  it("default desligado sem chave", () => {
    expect(readMetricsConsent()).toBe(false);
  });

  it("ligado só com valor 1", () => {
    localStorage.setItem(METRICS_KEY, "1");
    expect(readMetricsConsent()).toBe(true);
    localStorage.setItem(METRICS_KEY, "0");
    expect(readMetricsConsent()).toBe(false);
  });
});

describe("Metrics", () => {
  beforeEach(() => localStorage.clear());

  it("não renderiza sem consentimento", async () => {
    render(<Metrics />);
    await waitFor(() => expect(screen.queryByTestId("analytics")).toBeNull());
    expect(screen.queryByTestId("speed-insights")).toBeNull();
  });

  it("renderiza com beforeSend quando há consentimento", async () => {
    localStorage.setItem(METRICS_KEY, "1");
    render(<Metrics />);
    await waitFor(() => expect(screen.getByTestId("analytics")).toHaveAttribute("data-gated"));
    expect(screen.getByTestId("speed-insights")).toHaveAttribute("data-gated");
  });

  it("reage a mudança de consentimento sem reload", async () => {
    render(<Metrics />);
    await waitFor(() => expect(screen.queryByTestId("analytics")).toBeNull());
    act(() => {
      localStorage.setItem(METRICS_KEY, "1");
      window.dispatchEvent(new Event(METRICS_EVENT));
    });
    await waitFor(() => expect(screen.getByTestId("analytics")).toBeTruthy());
    act(() => {
      localStorage.setItem(METRICS_KEY, "0");
      window.dispatchEvent(new Event(METRICS_EVENT));
    });
    await waitFor(() => expect(screen.queryByTestId("analytics")).toBeNull());
  });
});
