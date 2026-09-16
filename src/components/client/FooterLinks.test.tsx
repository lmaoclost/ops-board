import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FooterLinks } from "./FooterLinks";

describe("FooterLinks", () => {
  it("link do LinkedIn com nome, target blank e noopener", () => {
    render(<FooterLinks />);
    const a = screen.getByText("Renan Oliveira");
    expect(a).toHaveAttribute("href", "https://www.linkedin.com/in/renansmoliveira");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a.getAttribute("rel")).toContain("noopener");
  });

  it("link do repositório ops-board", () => {
    render(<FooterLinks />);
    const a = screen.getByText("GitHub");
    expect(a).toHaveAttribute("href", "https://github.com/lmaoclost/ops-board");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a.getAttribute("rel")).toContain("noopener");
  });

  it("renderiza rótulo 'desenvolvido por' (pt-BR)", () => {
    render(<FooterLinks />);
    expect(screen.getByText(/desenvolvido por/)).toBeInTheDocument();
  });

  it("ícones decorativos não têm link nem texto acessível duplicado", () => {
    render(<FooterLinks />);
    expect(document.querySelectorAll("svg").length).toBeGreaterThanOrEqual(2);
    for (const svg of document.querySelectorAll("svg")) {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    }
  });
});