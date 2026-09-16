import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LocaleToggle } from "./LocaleToggle";
import { useBoard } from "@/lib/store";

describe("LocaleToggle", () => {
  beforeEach(() => {
    localStorage.removeItem("opsboard.v1");
    useBoard.setState({ locale: "pt" });
  });

  it("locale pt: mostra EN, title English; clique troca pra en e vira PT", async () => {
    const user = userEvent.setup();
    render(<LocaleToggle />);
    const btn = screen.getByRole("button", { name: "EN" });
    expect(btn).toHaveAttribute("title", "English");
    await user.click(btn);
    expect(useBoard.getState().locale).toBe("en");
    expect(screen.getByRole("button", { name: "PT" })).toHaveAttribute("title", "Português");
  });

  it("locale en: mostra PT; clique volta pra pt", async () => {
    useBoard.setState({ locale: "en" });
    const user = userEvent.setup();
    render(<LocaleToggle />);
    await user.click(screen.getByRole("button", { name: "PT" }));
    expect(useBoard.getState().locale).toBe("pt");
  });

  it("mudança persiste locale no localStorage", async () => {
    const user = userEvent.setup();
    render(<LocaleToggle />);
    await user.click(screen.getByRole("button", { name: "EN" }));
    expect(localStorage.getItem("opsboard.v1")).toContain('"locale":"en"');
  });
});