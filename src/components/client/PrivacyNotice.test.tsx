import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { PrivacyNotice } from "./PrivacyNotice";
import { METRICS_KEY } from "./Metrics";

const NOTICE_KEY = "opsboard.notice-v1";

describe("PrivacyNotice consentimento de métricas", () => {
  beforeEach(() => localStorage.clear());

  it("aceitar métricas liga tracking e dispensa aviso", async () => {
    render(<PrivacyNotice />);
    await userEvent.click(await screen.findByRole("button", { name: "aceitar métricas" }));
    expect(localStorage.getItem(METRICS_KEY)).toBe("1");
    expect(localStorage.getItem(NOTICE_KEY)).toBe("1");
    expect(screen.queryByRole("dialog", { name: "aviso de privacidade" })).toBeNull();
  });

  it("recusar métricas desliga tracking e dispensa aviso", async () => {
    render(<PrivacyNotice />);
    await userEvent.click(await screen.findByRole("button", { name: "só dados locais" }));
    expect(localStorage.getItem(METRICS_KEY)).toBe("0");
    expect(localStorage.getItem(NOTICE_KEY)).toBe("1");
    expect(screen.queryByRole("dialog", { name: "aviso de privacidade" })).toBeNull();
  });

  it("entendi dispensa sem tocar no consentimento", async () => {
    render(<PrivacyNotice />);
    await userEvent.click(await screen.findByRole("button", { name: "entendi" }));
    expect(localStorage.getItem(METRICS_KEY)).toBeNull();
    expect(localStorage.getItem(NOTICE_KEY)).toBe("1");
  });
});
