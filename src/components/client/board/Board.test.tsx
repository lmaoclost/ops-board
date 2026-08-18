import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Board, type BoardProps } from "./Board";
import { defaultFilters } from "@/lib/filter";
import type { Project } from "@/lib/types";

const projeto: Project = {
  id: "p1",
  title: "Alfa",
  blocked: false, archived: false, prio: 3, due: "", collapsed: false,
  sections: [
    { id: "s1", title: "geral", notes: "", collapsed: false, tasks: [
      { id: "t1", text: "tarefa alfa", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null, subs: [] },
    ] },
  ],
};

const base = (over: Partial<BoardProps> = {}): BoardProps => ({
  projetos: [projeto],
  templates: [],
  filters: defaultFilters,
  onNewProject: vi.fn(),
  onClearFilters: vi.fn(),
  projectActions: {
    onAddSection: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
    onToggleArchive: vi.fn(),
    onCyclePrio: vi.fn(),
    onToggleCollapse: vi.fn(),
  },
  sectionActions: {
    onToggle: vi.fn(),
    onAddTask: vi.fn(),
    onAddTaskFull: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn(),
  },
  taskActions: {
    onToggle: vi.fn(),
    onPrioCycle: vi.fn(),
    onStatusChange: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onPurge: vi.fn(),
    onMoveTask: vi.fn(),
    onUpdate: vi.fn(),
    onSaveTemplate: vi.fn(),
    onInsertTemplate: vi.fn(),
    onDeleteTemplate: vi.fn(),
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

  it("CTA limpar filtros no empty state chama onClearFilters", async () => {
    const p = base({ filters: { ...defaultFilters, query: "inexistente" } });
    render(<Board {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "✕ limpar filtros" }));
    expect(p.onClearFilters).toHaveBeenCalledTimes(1);
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

  it("prioSort ordena projetos P1 antes de P3", () => {
    const p3: Project = { ...projeto, id: "p3", title: "Baixo", prio: 3 };
    const p1: Project = { ...projeto, id: "p1", title: "Alto", prio: 1 };
    render(<Board {...base({ projetos: [p3, p1], filters: { ...defaultFilters, prioSort: true } })} />);
    const headings = screen.getAllByRole("heading").map((h) => h.textContent);
    expect(headings.indexOf("Alto")).toBeLessThan(headings.indexOf("Baixo"));
  });
});