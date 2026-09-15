import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { PrivacyNotice } from "./PrivacyNotice";
import { METRICS_KEY } from "./Metrics";

const NOTICE_KEY = "opsboard.notice-v1";

describe("PrivacyNotice consentimento de métricas", () => {
  beforeEach(() => localStorage.clear());

  it("aceitar liga tracking e dispensa aviso", async () => {
    render(<PrivacyNotice />);
    await userEvent.click(await screen.findByRole("button", { name: "aceitar" }));
    expect(localStorage.getItem(METRICS_KEY)).toBe("1");
    expect(localStorage.getItem(NOTICE_KEY)).toBe("1");
    expect(screen.queryByRole("dialog", { name: "aviso de privacidade" })).toBeNull();
  });

  it("recusar desliga tracking e dispensa aviso", async () => {
    render(<PrivacyNotice />);
    await userEvent.click(await screen.findByRole("button", { name: "recusar" }));
    expect(localStorage.getItem(METRICS_KEY)).toBe("0");
    expect(localStorage.getItem(NOTICE_KEY)).toBe("1");
    expect(screen.queryByRole("dialog", { name: "aviso de privacidade" })).toBeNull();
  });

  it("texto traz link inline para a política", async () => {
    render(<PrivacyNotice />);
    const dialog = await screen.findByRole("dialog", { name: "aviso de privacidade" });
    const link = dialog.querySelector('a[href="/privacy"]');
    expect(link).not.toBeNull();
    expect(dialog.querySelectorAll("button").length).toBe(2);
  });
});
