import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("criação de projeto (integração página)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("não cria projeto quando o título é vazio", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "+ criar primeiro projeto" }));
    await user.click(screen.getByRole("button", { name: "criar" }));
    expect(screen.getByRole("button", { name: "+ criar primeiro projeto" })).toBeInTheDocument();
  });

  it("cria projeto preenchido no modal", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "+ criar primeiro projeto" }));
    await user.type(screen.getByLabelText("título"), "projeto-ci");
    await user.click(screen.getByRole("button", { name: "criar" }));
    expect(screen.getByText("projeto-ci")).toBeInTheDocument();
  });
});