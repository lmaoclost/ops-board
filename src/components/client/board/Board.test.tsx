import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Board, type BoardProps } from "./Board";
import { defaultFilters } from "@/lib/filter";
import type { Project } from "@/lib/types";

const projeto: Project = {
  id: "p1",
  title: "Alfa",
  blocked: false,
  sections: [
    { id: "s1", title: "geral", notes: "", collapsed: false, tasks: [
      { id: "t1", text: "tarefa alfa", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null },
    ] },
  ],
};

const base = (over: Partial<BoardProps> = {}): BoardProps => ({
  projetos: [projeto],
  filters: defaultFilters,
  onNewProject: vi.fn(),
  projectActions: {
    onAddSection: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
  },
  sectionActions: {
    onToggle: vi.fn(),
    onAddTask: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
  },
  taskActions: {
    onToggle: vi.fn(),
    onPrioCycle: vi.fn(),
    onStatusChange: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onMoveTask: vi.fn(),
  },
  ...over,
});

describe("Board (lista)", () => {
  it("mostra empty state sem projetos com botão de criar", async () => {
    const p = base({ projetos: [] });
    render(<Board {...p} />);
    expect(screen.getByText("nenhum projeto na fila.")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "+ criar primeiro projeto" }));
    expect(p.onNewProject).toHaveBeenCalledTimes(1);
  });

  it("mostra aviso quando nada casa com o filtro", () => {
    render(<Board {...base({ filters: { ...defaultFilters, query: "inexistente" } })} />);
    expect(screen.getByText(/nada casa com o filtro/)).toBeTruthy();
  });

  it("renderiza projetos correspondentes ao filtro", () => {
    render(<Board {...base({ filters: { ...defaultFilters, query: "alfa" } })} />);
    expect(screen.getByText("Alfa")).toBeTruthy();
    expect(screen.getByText("tarefa alfa")).toBeTruthy();
  });

  it("esconde projeto que não casa o filtro", () => {
    render(<Board {...base({ filters: { ...defaultFilters, status: "doing" } })} />);
    expect(screen.queryByText("Alfa")).toBeNull();
  });
});