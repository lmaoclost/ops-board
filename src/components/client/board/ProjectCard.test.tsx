import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProjectCard, type ProjectCardProps } from "./ProjectCard";

const base = (over: Partial<ProjectCardProps> = {}): ProjectCardProps => ({
  project: {
    id: "p1",
    title: "Projeto Alfa",
    blocked: false, archived: false, prio: 3, due: "", collapsed: false,
    sections: [
      { id: "s1", title: "geral", notes: "", collapsed: false, tasks: [
        { id: "t1", text: "fazer", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null, subs: [] },
      ] },
    ],
  },
  collectActions: () => ({
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
      onUpdate: vi.fn(),
      onSaveTemplate: vi.fn(),
    },
  }),
  templates: [],
  onInsertTemplate: vi.fn(),
  onDeleteTemplate: vi.fn(),
  onAddSection: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
  onToggleArchive: vi.fn(),
  onCyclePrio: vi.fn(),
  onToggleCollapse: vi.fn(),
  ...over,
});

describe("ProjectCard", () => {
  const openMenu = async () => {
    await userEvent.click(screen.getByLabelText("ações do projeto"));
  };

  it("mostra título e seções", () => {
    render(<ProjectCard {...base()} />);
    expect(screen.getByText("Projeto Alfa")).toBeTruthy();
    expect(screen.getByText("fazer")).toBeTruthy();
  });

  it("marca stuck quando bloqueado", () => {
    render(<ProjectCard {...base({ project: { ...base().project, blocked: true } })} />);
    expect(screen.getByText("stuck")).toBeTruthy();
  });

  it("alterna stuck/bloqueado pelo ⋯ sem passar pelo modal", async () => {
    const p = base();
    render(<ProjectCard {...p} />);
    await openMenu();
    await userEvent.click(await screen.findByRole("menuitem", { name: "marcar como stuck / bloqueado" }));
    expect(p.onRename).toHaveBeenCalledWith("p1", "Projeto Alfa", true);
    expect(screen.queryByLabelText("marcar como stuck / bloqueado")).toBeNull();
  });

  it("clique no badge de prioridade cicla (chama onCyclePrio)", async () => {
    const p = base();
    render(<ProjectCard {...p} />);
    await userEvent.click(screen.getByLabelText("prioridade do projeto P3"));
    expect(p.onCyclePrio).toHaveBeenCalledTimes(1);
  });

  it("minimizar esconde seções e expandir restaura", async () => {
    const p = base();
    render(<ProjectCard {...p} />);
    await userEvent.click(screen.getByLabelText("minimizar projeto"));
    expect(p.onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("projeto colapsado não renderiza seções", () => {
    render(<ProjectCard {...base({ project: { ...base().project, collapsed: true } })} />);
    expect(screen.queryByText("fazer")).toBeNull();
    expect(screen.getByLabelText("expandir projeto")).toBeTruthy();
  });

  it("mostra vencimento com ano e destaca vencido", () => {
    render(<ProjectCard {...base({ project: { ...base().project, due: "2000-01-01" } })} />);
    expect(screen.getByText("01/01/2000")).toBeTruthy();
  });

  it("adiciona seção via modal", async () => {
    const p = base();
    render(<ProjectCard {...p} />);
    await openMenu();
    await userEvent.click(await screen.findByRole("menuitem", { name: "adicionar seção" }));
    const input = await screen.findByLabelText("título");
    await userEvent.type(input, "dev{Enter}");
    expect(p.onAddSection).toHaveBeenCalledWith("dev");
  });

  it("renomeia via modal preenchido", async () => {
    const p = base();
    render(<ProjectCard {...p} />);
    await openMenu();
    await userEvent.click(await screen.findByRole("menuitem", { name: "renomear projeto" }));
    const input = await screen.findByLabelText("título");
    await userEvent.clear(input);
    await userEvent.type(input, "Renomeado{Enter}");
    expect(p.onRename).toHaveBeenCalledWith("p1", "Renomeado", false, "");
  });

  it("define vencimento do projeto pelo modal de editar", async () => {
    const p = base();
    render(<ProjectCard {...p} />);
    await openMenu();
    await userEvent.click(await screen.findByRole("menuitem", { name: "renomear projeto" }));
    const due = await screen.findByLabelText("vencimento");
    await userEvent.type(due, "2026-09-01");
    await userEvent.click(screen.getByRole("button", { name: "salvar" }));
    expect(p.onRename).toHaveBeenCalledWith("p1", "Projeto Alfa", false, "2026-09-01");
  });

  it("exclui diretamente sem confirm nativo (undo cobre)", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const p = base();
    render(<ProjectCard {...p} />);
    await openMenu();
    await userEvent.click(await screen.findByRole("menuitem", { name: "excluir projeto" }));
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(p.onDelete).toHaveBeenCalledWith("p1");
    confirmSpy.mockRestore();
  });

  it("arquiva via menu de ações", async () => {
    const p = base();
    render(<ProjectCard {...p} />);
    await openMenu();
    await userEvent.click(await screen.findByRole("menuitem", { name: "arquivar projeto" }));
    expect(p.onToggleArchive).toHaveBeenCalledTimes(1);
  });

  it("mostra selo arquivado e desarquiva via menu", async () => {
    const p = base({
      project: { ...base().project, archived: true },
    });
    render(<ProjectCard {...p} />);
    expect(screen.getByText("arquivado")).toBeTruthy();
    await openMenu();
    await userEvent.click(await screen.findByRole("menuitem", { name: "desarquivar projeto" }));
    expect(p.onToggleArchive).toHaveBeenCalledTimes(1);
  });
});