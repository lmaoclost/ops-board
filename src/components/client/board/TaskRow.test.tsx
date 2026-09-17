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
    blocked: false, blockedReason: "",
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
  prio: 5,
  due: "",
  status: "todo",
  blocked: false, blockedReason: "",
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
    render(<TaskRow {...base({ blocked: true, blockedReason: "", due: "2000-01-01" })} />);
    expect(screen.getByText(/bloqueada/)).toBeTruthy();
    expect(screen.getByText(/vencida/)).toBeTruthy();
  });

  it("trigger do status mostra o label traduzido", () => {
    render(<TaskRow {...base()} />);
    expect(screen.getByLabelText("mudar status")).toHaveTextContent("a fazer");
  });

  it("troca status via select", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByLabelText("mudar status"));
    await userEvent.click(await screen.findByRole("option", { name: "em andamento" }));
    expect(p.onStatusChange).toHaveBeenCalledWith("doing");
  });

  it("editar chama callback; excluir pede confirmação", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByTitle("editar"));
    expect(p.onEdit).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByTitle("excluir"));
    expect(p.onDelete).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole("button", { name: "excluir" }));
    expect(p.onDelete).toHaveBeenCalledTimes(1);
  });

  it("excluir cancela sem chamar callback", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByTitle("excluir"));
    await userEvent.click(await screen.findByRole("button", { name: "cancelar" }));
    expect(p.onDelete).not.toHaveBeenCalled();
  });

  it("botão bloqueia via prompt de motivo e desbloqueia direto", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByLabelText("bloquear tarefa"));
    const reason = await screen.findByLabelText("motivo do bloqueio");
    await userEvent.type(reason, "sem acesso");
    await userEvent.click(screen.getByRole("button", { name: "salvar" }));
    expect(p.onUpdate).toHaveBeenCalledWith({ blocked: true, blockedReason: "sem acesso" });

    const q = base({ blocked: true });
    render(<TaskRow {...q} />);
    await userEvent.click(screen.getByLabelText("desbloquear tarefa"));
    expect(q.onUpdate).toHaveBeenCalledWith({ blocked: false });
  });

  it("prompt de bloqueio vazio bloqueia sem motivo", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByLabelText("bloquear tarefa"));
    await screen.findByLabelText("motivo do bloqueio");
    await userEvent.click(screen.getByRole("button", { name: "salvar" }));
    expect(p.onUpdate).toHaveBeenCalledWith({ blocked: true, blockedReason: "" });
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
    await userEvent.click(screen.getAllByTitle("excluir")[1]);
    await userEvent.click(await screen.findByRole("button", { name: "excluir" }));
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
    await userEvent.click(screen.getAllByTitle("excluir")[2]);
    await userEvent.click(await screen.findByRole("button", { name: "excluir" }));
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
    render(<TaskRow {...base({ subs: [sub({ id: "a", note: "passo 1", blocked: true, blockedReason: "", due: "2000-01-01" })] })} />);
    expect(screen.getByText(/passo 1/)).toBeTruthy();
    expect(screen.getByText(/bloqueada/)).toBeTruthy();
    expect(screen.getByText(/vencida/)).toBeTruthy();
  });

  it("clique no texto da sub abre modal editar sub-tarefa e salvar aplica patch em profundidade", async () => {
    const p = base({ subs: [sub({ id: "fazer a" })] });
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getAllByTitle("editar")[1]);
    expect(await screen.findByText("editar sub-tarefa")).toBeTruthy();
    await userEvent.clear(await screen.findByLabelText("tarefa"));
    await userEvent.type(await screen.findByLabelText("tarefa"), "fazer a atualizado");
    await userEvent.click(screen.getByRole("button", { name: "salvar" }));
    expect(p.onUpdate).toHaveBeenLastCalledWith({
      subs: [sub({ id: "fazer a", text: "fazer a atualizado" })],
    });
  });
});

describe("TaskRow menu mobile (⋯)", () => {
  it("⋯ abre menu; editar chama callback", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "ações da tarefa" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "editar" }));
    expect(p.onEdit).toHaveBeenCalledTimes(1);
  });

  it("menu muda status via item", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "ações da tarefa" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "em andamento" }));
    expect(p.onStatusChange).toHaveBeenCalledWith("doing");
  });

  it("menu bloqueia com motivo e excluir confirma antes de deletar", async () => {
    const p = base();
    render(<TaskRow {...p} />);
    await userEvent.click(screen.getByRole("button", { name: "ações da tarefa" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "bloquear tarefa" }));
    await userEvent.type(await screen.findByLabelText("motivo do bloqueio"), "motivo x");
    await userEvent.click(screen.getByRole("button", { name: "salvar" }));
    expect(p.onUpdate).toHaveBeenCalledWith({ blocked: true, blockedReason: "motivo x" });

    await userEvent.click(screen.getByRole("button", { name: "ações da tarefa" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "excluir" }));
    await userEvent.click(await screen.findByRole("button", { name: "excluir" }));
    expect(p.onDelete).toHaveBeenCalledTimes(1);
  });
});
