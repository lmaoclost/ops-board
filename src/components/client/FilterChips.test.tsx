import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterChips } from "./FilterChips";

const base = {
  counts: { todo: 2, doing: 1, waiting: 0, done: 3 },
  blockedCount: 1,
  archivedCount: 0,
  archivedActive: false,
  active: null as null,
  filtering: false,
  onToggleStatus: vi.fn(),
  onToggleArchived: vi.fn(),
  onClear: vi.fn(),
  prioSort: false,
  onTogglePrioSort: vi.fn(),
};

describe("FilterChips", () => {
  it("toggle de prioridade invoca callback", async () => {
    const onTogglePrioSort = vi.fn();
    render(<FilterChips {...base} onTogglePrioSort={onTogglePrioSort} />);
    await userEvent.click(screen.getByRole("button", { name: "↕ prio" }));
    expect(onTogglePrioSort).toHaveBeenCalledTimes(1);
  });

  it("mostra contagem de arquivados e alterna visibilidade", async () => {
    const onToggleArchived = vi.fn();
    render(<FilterChips {...base} archivedCount={4} archivedActive={false} onToggleArchived={onToggleArchived} />);
    const chip = screen.getByRole("button", { name: /arquivados/ });
    expect(chip).toHaveTextContent("4");
    expect(chip).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(chip);
    expect(onToggleArchived).toHaveBeenCalledTimes(1);
  });

  it("marca ativo quando mostrando arquivados", () => {
    render(<FilterChips {...base} archivedCount={1} archivedActive={true} onToggleArchived={() => {}} />);
    expect(screen.getByRole("button", { name: /arquivados/ })).toHaveAttribute("aria-pressed", "true");
  });
});