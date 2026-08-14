import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProjectCard, type ProjectCardProps } from "./ProjectCard";

const base = (over: Partial<ProjectCardProps> = {}): ProjectCardProps => ({
  project: {
    id: "p1",
    title: "Projeto Alfa",
    blocked: false,
    sections: [
      { id: "s1", title: "geral", notes: "", collapsed: false, tasks: [
        { id: "t1", text: "fazer", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null },
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
    },
  }),
  onAddSection: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
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
    expect(p.onRename).toHaveBeenCalledWith("p1", "Renomeado", false);
  });

  it("exclui após confirmação", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const p = base();
    render(<ProjectCard {...p} />);
    await openMenu();
    await userEvent.click(await screen.findByRole("menuitem", { name: "excluir projeto" }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(p.onDelete).toHaveBeenCalledWith("p1");
    confirmSpy.mockRestore();
  });

  it("não exclui sem confirmação", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const p = base();
    render(<ProjectCard {...p} />);
    await openMenu();
    await userEvent.click(await screen.findByRole("menuitem", { name: "excluir projeto" }));
    expect(p.onDelete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});