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
      { id: "t1", text: "feita", status: "done", note: "", blocked: false, blockedReason: "", prio: 3, due: "", doneAt: "2026-01-01T00:00:00.000Z", subs: [] },
      { id: "t2", text: "pendente", status: "todo", note: "", blocked: false, blockedReason: "", prio: 3, due: "", doneAt: null, subs: [] },
    ],
  },
  onToggleSection: vi.fn(),
  onAddTask: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  taskActions: {
    onToggle: vi.fn(),
    onPrioCycle: vi.fn(),
    onStatusChange: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onUpdate: vi.fn(),
  },
  ...over,
});

const openMenu = async (label: string) => {
  await userEvent.click(screen.getByLabelText(label));
};

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

  it("edita seção via modal único com título e nota", async () => {
    const p = base();
    render(<Section {...p} />);
    await openMenu("ações da seção");
    await userEvent.click(await screen.findByRole("menuitem", { name: "editar seção" }));
    const title = await screen.findByLabelText("título");
    await userEvent.clear(title);
    await userEvent.type(title, "Sprint 12");
    const note = await screen.findByLabelText("nota", { exact: true });
    await userEvent.clear(note);
    await userEvent.type(note, "foco novo");
    await userEvent.click(screen.getByRole("button", { name: "salvar" }));
    expect(p.onEdit).toHaveBeenCalledWith({ title: "Sprint 12", notes: "foco novo" });
  });

  it("editar abre modal e excluir pede confirmação", async () => {
    const p = base();
    render(<Section {...p} />);
    await openMenu("ações da seção");
    await userEvent.click(await screen.findByRole("menuitem", { name: "editar seção" }));
    expect(await screen.findByLabelText("título")).toBeTruthy();
    expect(p.onEdit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTitle("fechar"));
    await openMenu("ações da seção");
    await userEvent.click(await screen.findByRole("menuitem", { name: "excluir seção" }));
    expect(p.onDelete).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole("button", { name: "excluir" }));
    expect(p.onDelete).toHaveBeenCalledTimes(1);
  });

  it("menu ⋯ não tem mais itens separados de editar/nota", async () => {
    render(<Section {...base()} />);
    await openMenu("ações da seção");
    expect(screen.queryByRole("menuitem", { name: "renomear seção" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "editar nota" })).toBeNull();
    expect(screen.queryByRole("menuitem", { name: "adicionar nota" })).toBeNull();
  });

  it("grip de arrastar seção tem label acessível", () => {
    render(<Section {...base()} />);
    expect(screen.getByLabelText("arrastar seção p/ reordenar")).toBeTruthy();
  });
});