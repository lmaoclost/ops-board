import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Topbar } from "./Topbar";
import type { BoardStats } from "@/lib/selectors";

const stats: BoardStats = { byStatus: { todo: 0, doing: 0, waiting: 0, done: 0 }, total: 0, done: 0, pendentes: 0, doneToday: 0, blocked: 0 };

const props = (over: Partial<Parameters<typeof Topbar>[0]> = {}) => ({
  query: "",
  view: "list" as const,
  isDark: true,
  onQueryChange: vi.fn(),
  onClearQuery: vi.fn(),
  onViewChange: vi.fn(),
  onToggleTheme: vi.fn(),
  onNewProject: vi.fn(),
  onExport: vi.fn(),
  onImport: vi.fn(),
  locale: "pt" as const,
  onToggleLocale: vi.fn(),
  stats,
  ...over,
});

describe("Topbar menu mobile (☰)", () => {
  it("trigger ☰ abre menu com exportar/importar/privacidade; itens disparam callbacks", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<Topbar {...p} />);

    await user.click(screen.getByRole("button", { name: "menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "↓exportar" }));
    expect(p.onExport).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "↑importar" }));
    expect(p.onImport).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "privacidade" }));
    expect(screen.getByRole("link", { name: "privacidade" })).toBeInTheDocument();
  });

  it("tema e idioma continuam acessíveis fora do menu", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<Topbar {...p} />);

    await user.click(screen.getByRole("button", { name: "EN" }));
    expect(p.onToggleLocale).toHaveBeenCalledTimes(1);
    expect(p.onToggleTheme).not.toHaveBeenCalled();
  });
});