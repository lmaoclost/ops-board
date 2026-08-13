import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Section, type SectionProps } from "./Section";

const base = (over: Partial<SectionProps> = {}): SectionProps => ({
  projectId: "p1",
  section: {
    id: "s1",
    title: "geral",
    notes: "nota longa",
    collapsed: false,
    tasks: [
      { id: "t1", text: "feita", status: "done", note: "", blocked: false, prio: 3, due: "", doneAt: "2026-01-01T00:00:00.000Z" },
      { id: "t2", text: "pendente", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null },
    ],
  },
  onToggleSection: vi.fn(),
  onAddTask: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
  taskActions: {
    onToggle: vi.fn(),
    onPrioCycle: vi.fn(),
    onStatusChange: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  },
  ...over,
});

describe("Section", () => {
  it("mostra contador done/total", () => {
    render(<Section {...base()} />);
    expect(screen.getByText("1/2")).toBeTruthy();
  });

  it("alterna collapse no clique do header", async () => {
    const p = base();
    render(<Section {...p} />);
    await userEvent.click(screen.getByText("geral"));
    expect(p.onToggleSection).toHaveBeenCalledTimes(1);
  });

  it("quando collapsed não mostra tarefas, notas nem input", () => {
    render(<Section {...base({ section: { ...base().section, collapsed: true } })} />);
    expect(screen.queryByText("feita")).toBeNull();
    expect(screen.queryByText(/nota longa/)).toBeNull();
    expect(screen.queryByPlaceholderText("nova tarefa…")).toBeNull();
  });

  it("adiciona tarefa ao apertar Enter", async () => {
    const p = base();
    render(<Section {...p} />);
    const input = screen.getByPlaceholderText("nova tarefa…");
    await userEvent.type(input, "minha tarefa{Enter}");
    expect(p.onAddTask).toHaveBeenCalledWith("minha tarefa");
  });

  it("não adiciona tarefa vazia", async () => {
    const p = base();
    render(<Section {...p} />);
    await userEvent.type(screen.getByPlaceholderText("nova tarefa…"), "   {Enter}");
    expect(p.onAddTask).not.toHaveBeenCalled();
  });

  it("renomeia seção via modal", async () => {
    const p = base();
    render(<Section {...p} />);
    await userEvent.click(screen.getByTitle("renomear seção"));
    const input = await screen.findByLabelText("título");
    await userEvent.clear(input);
    await userEvent.type(input, "Sprint 12{Enter}");
    expect(p.onRename).toHaveBeenCalledWith("Sprint 12");
  });

  it("renomear abre modal e excluir chama callback", async () => {
    const p = base();
    render(<Section {...p} />);
    await userEvent.click(screen.getByTitle("renomear seção"));
    expect(await screen.findByLabelText("título")).toBeTruthy();
    expect(p.onRename).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTitle("fechar"));
    await userEvent.click(screen.getByTitle("excluir seção"));
    expect(p.onDelete).toHaveBeenCalledTimes(1);
  });
});