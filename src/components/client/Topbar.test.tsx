import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Topbar } from "./Topbar";
import { useBoard } from "@/lib/store";
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
  stats,
  ...over,
});

describe("Topbar menu mobile (☰)", () => {
  beforeEach(() => {
    localStorage.removeItem("opsboard.v1");
    useBoard.setState({ locale: "pt" });
  });
  it("trigger ☰ abre menu com agenda/lixeira/exportar/importar/privacidade; itens disparam callbacks", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<Topbar {...p} />);

    await user.click(screen.getByRole("button", { name: "menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "agenda" }));
    expect(p.onViewChange).toHaveBeenCalledWith("agenda");

    await user.click(screen.getByRole("button", { name: "menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "lixeira" }));
    expect(p.onViewChange).toHaveBeenCalledWith("lixeira");

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

  it("☰ não contém lista nem kanban (são o toggle na barra)", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<Topbar {...p} />);

    await user.click(screen.getByRole("button", { name: "menu" }));
    expect(await screen.findByRole("menuitem", { name: "agenda" })).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: "lista" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "kanban" })).toBeNull();
  });

  it("toggle mobile troca lista↔kanban (label oposto, callback correto)", async () => {
    const user = userEvent.setup();
    const p = props({ view: "list" });
    render(<Topbar {...p} />);

    await user.click(screen.getByTitle("alternar lista/kanban"));
    expect(p.onViewChange).toHaveBeenCalledWith("kanban");

    const q = props({ view: "kanban" });
    render(<Topbar {...q} />);
    expect(screen.getAllByTitle("alternar lista/kanban")[1].textContent).toBe("lista");
  });

  it("view fora de list/kanban: toggle mostra lista e leva pra list", async () => {
    const user = userEvent.setup();
    const p = props({ view: "agenda" });
    render(<Topbar {...p} />);

    await user.click(screen.getByTitle("alternar lista/kanban"));
    expect(p.onViewChange).toHaveBeenCalledWith("kanban");
  });

  it("tema e idioma continuam acessíveis fora do menu", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<Topbar {...p} />);

    await user.click(screen.getByRole("button", { name: "EN" }));
    expect(useBoard.getState().locale).toBe("en");
    expect(p.onToggleTheme).not.toHaveBeenCalled();
  });
});