import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskRow, type TaskRowProps } from "./TaskRow";

const base = (over: Partial<TaskRowProps["task"]> = {}): TaskRowProps => ({
  task: {
    id: "t1",
    text: "Enviar relatório https://exemplo.com",
    status: "todo",
    note: "detalhe",
    blocked: false,
    prio: 1,
    due: "",
    doneAt: null, subs: [],
    ...over,
  },
  onToggle: vi.fn(),
  onPrioCycle: vi.fn(),
  onStatusChange: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
});

describe("TaskRow", () => {
  it("renderiza linha com data-testid estável", () => {
    render(<TaskRow {...base()} />);
    expect(screen.getByTestId("task-row")).toBeInTheDocument();
  });

  it("mostra sub-tarefas inline, concluídas riscadas", () => {
    render(<TaskRow {...base({ subs: [
      { id: "a", text: "fazer x", done: true },
      { id: "b", text: "fazer y", done: false },
    ] })} />);
    expect(screen.getByText(/▪ fazer x/)).toBeTruthy();
    expect(screen.getByText(/▪ fazer y/)).toBeTruthy();
  });

  it("renderiza texto com link e nota", () => {
    render(<TaskRow {...base()} />);
    const link = screen.getByRole("link", { name: "https://exemplo.com" });
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByText(/detalhe/)).toBeTruthy();
  });

  it("não injeta HTML bruto", () => {
    render(<TaskRow {...base({ text: "<img src=x onerror=alert(1)>" })} />);
    expect(document.querySelector("img")).toBeNull();
  });

  it("toggle dispara onToggle", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByTitle("alternar concluída"));
    expect(p.onToggle).toHaveBeenCalledTimes(1);
  });

  it("clique na prioridade cicla (P1 → P2)", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByText("P1"));
    expect(p.onPrioCycle).toHaveBeenCalledTimes(1);
  });

  it("exibe tag bloqueada e tag vencida", () => {
    render(<TaskRow {...base({ blocked: true, due: "2000-01-01" })} />);
    expect(screen.getByText(/bloqueada/)).toBeTruthy();
    expect(screen.getByText(/vencida/)).toBeTruthy();
  });

  it("troca status via select", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByLabelText("mudar status"));
    await userEvent.click(await screen.findByRole("option", { name: "em andamento" }));
    expect(p.onStatusChange).toHaveBeenCalledWith("doing");
  });

  it("editar e excluir chamam callbacks", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByTitle("editar"));
    expect(p.onEdit).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByTitle("excluir"));
    expect(p.onDelete).toHaveBeenCalledTimes(1);
  });

  it("concluída mostra texto riscado", () => {
    render(<TaskRow {...base({ status: "done" })} />);
    expect(screen.getByText(/Enviar relatório/).className).toContain("line-through");
  });
});