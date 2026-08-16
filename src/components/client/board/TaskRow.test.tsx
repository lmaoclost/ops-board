import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskRow, type TaskRowProps } from "./TaskRow";
import type { SubTask } from "@/lib/types";

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
  onUpdate: vi.fn(),
});

const sub = (over: Partial<SubTask> & { id: string }): SubTask => ({
  text: over.id,
  note: "",
  prio: 3,
  due: "",
  status: "todo",
  blocked: false,
  subs: [],
  ...over,
});

describe("TaskRow", () => {
  it("renderiza linha com data-testid estável", () => {
    render(<TaskRow {...base()} />);
    expect(screen.getByTestId("task-row")).toBeInTheDocument();
  });

  it("mostra sub-tarefas aninhadas, concluídas riscadas", () => {
    render(<TaskRow {...base({ subs: [
      sub({ id: "fazer x", status: "done" }),
      sub({ id: "fazer y" }),
    ] })} />);
    const doneSub = screen.getByText("fazer x");
    expect(doneSub.className).toContain("line-through");
    expect(screen.getByText("fazer y")).toBeTruthy();
  });

  it("mostra sub de sub em profundidade", () => {
    render(<TaskRow {...base({ subs: [sub({ id: "a", subs: [sub({ id: "neta", status: "done" })] })] })} />);
    const neta = screen.getByText("neta");
    expect(neta.className).toContain("line-through");
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

  it("botão alterna bloqueio via onUpdate", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByLabelText("bloquear tarefa"));
    expect(p.onUpdate).toHaveBeenCalledWith({ blocked: true });

    const q = base({ blocked: true });
    render(<TaskRow {...q} />);
    await userEvent.click(screen.getByLabelText("desbloquear tarefa"));
    expect(q.onUpdate).toHaveBeenCalledWith({ blocked: false });
  });

  it("concluída mostra texto riscado", () => {
    render(<TaskRow {...base({ status: "done" })} />);
    expect(screen.getByText(/Enviar relatório/).className).toContain("line-through");
  });

  it("adiciona sub-tarefa inline via + e Enter", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "nova sub-tarefa" }));
    await userEvent.type(screen.getByRole("textbox", { name: "nova sub-tarefa" }), "fazer z{Enter}");
    expect(p.onUpdate).toHaveBeenCalledTimes(1);
    expect(p.onUpdate).toHaveBeenCalledWith({
      subs: [sub({ id: expect.any(String), text: "fazer z" })],
    });
  });

  it("alterna done e remove sub-tarefa via onUpdate", async () => {
    const p = base({ subs: [sub({ id: "fazer x" })] });
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "sub-tarefa fazer x" }));
    expect(p.onUpdate).toHaveBeenLastCalledWith({ subs: [sub({ id: "fazer x", status: "done" })] });
    await userEvent.click(screen.getByLabelText("remover sub-tarefa fazer x"));
    expect(p.onUpdate).toHaveBeenLastCalledWith({ subs: [] });
  });

  it("adiciona sub de sub inline via + na sub e Enter", async () => {
    const p = base({ subs: [sub({ id: "fazer a" })] });
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "nova sub-tarefa fazer a" }));
    await userEvent.type(screen.getByRole("textbox", { name: "nova sub-tarefa fazer a" }), "fazer aa{Enter}");
    expect(p.onUpdate).toHaveBeenLastCalledWith({
      subs: [sub({ id: "fazer a", subs: [sub({ id: expect.any(String), text: "fazer aa" })] })],
    });
  });

  it("alterna done de sub em profundidade via onUpdate", async () => {
    const p = base({ subs: [sub({ id: "a", subs: [sub({ id: "neta" })] })] });
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "sub-tarefa neta" }));
    expect(p.onUpdate).toHaveBeenLastCalledWith({
      subs: [sub({ id: "a", subs: [sub({ id: "neta", status: "done" })] })],
    });
  });

  it("remove sub em profundidade", async () => {
    const p = base({ subs: [sub({ id: "a", subs: [sub({ id: "neta" })] })] });
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByLabelText("remover sub-tarefa neta"));
    expect(p.onUpdate).toHaveBeenLastCalledWith({
      subs: [sub({ id: "a", subs: [] })],
    });
  });

  it("cicla prioridade da sub (P2 → P3)", async () => {
    const p = base({ subs: [sub({ id: "a", prio: 2 })] });
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByText("P2"));
    expect(p.onUpdate).toHaveBeenLastCalledWith({ subs: [sub({ id: "a", prio: 3 })] });
  });

  it("mostra nota, bloqueada e vencida na sub", () => {
    render(<TaskRow {...base({ subs: [sub({ id: "a", note: "passo 1", blocked: true, due: "2000-01-01" })] })} />);
    expect(screen.getByText(/passo 1/)).toBeTruthy();
    expect(screen.getByText(/bloqueada/)).toBeTruthy();
    expect(screen.getByText(/vencida/)).toBeTruthy();
  });

  it("clique no texto da sub abre modal editar sub-tarefa e salvar aplica patch em profundidade", async () => {
    const p = base({ subs: [sub({ id: "fazer a" })] });
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "fazer a" }));
    expect(screen.getByText("editar sub-tarefa")).toBeTruthy();
    await userEvent.clear(screen.getByLabelText("tarefa"));
    await userEvent.type(screen.getByLabelText("tarefa"), "fazer a atualizado");
    await userEvent.click(screen.getByRole("button", { name: "salvar" }));
    expect(p.onUpdate).toHaveBeenLastCalledWith({
      subs: [sub({ id: "fazer a", text: "fazer a atualizado" })],
    });
  });
});
