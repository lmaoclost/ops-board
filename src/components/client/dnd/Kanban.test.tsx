import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Kanban } from "./Kanban";
import type { AddTaskInput, Project, TaskPatch } from "@/lib/types";

const projeto = (over: Partial<Project> = {}): Project => ({
  id: "p1",
  title: "P",
  blocked: false, archived: false, prio: 3, due: "", collapsed: false,
  sections: [
    {
      id: "s1",
      title: "geral",
      notes: "",
      collapsed: false,
      tasks: [
        { id: "t1", text: "correr pra base", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null, subs: [] },
        { id: "t2", text: "uprs", status: "doing", note: "", blocked: false, prio: 3, due: "", doneAt: null, subs: [] },
        { id: "t3", text: "ctz", status: "done", note: "novo", blocked: false, prio: 3, due: "", doneAt: "2026-01-01T10:00:00.000Z", subs: [] },
        { id: "t4", text: "oe", status: "waiting", note: "", blocked: false, prio: 3, due: "", doneAt: null, subs: [] },
      ],
    },
  ],
  ...over,
});

const renderKanban = (props: {
  projetos?: Project[];
  onEditTask?: (pid: string, sid: string, tid: string, patch: TaskPatch) => void;
  onDeleteTask?: (pid: string, sid: string, tid: string) => void;
  onAddTask?: (pid: string, sid: string, input: AddTaskInput) => void;
} = {}) =>
  render(
    <Kanban
      projetos={props.projetos ?? [projeto()]}
      onEditTask={props.onEditTask ?? (() => {})}
      onDeleteTask={props.onDeleteTask ?? (() => {})}
      onAddTask={props.onAddTask ?? (() => {})}
    />,
  );

describe("Kanban", () => {
  it("agrupa tarefas por status em colunas", () => {
    renderKanban();
    expect(screen.getByText("a fazer")).toBeTruthy();
    expect(screen.getByText("em andamento")).toBeTruthy();
    expect(screen.getByText("aguardando")).toBeTruthy();
    expect(screen.getByText("concluída")).toBeTruthy();
    expect(screen.getByText("correr pra base")).toBeTruthy();
    expect(screen.getByText("uprs")).toBeTruthy();
  });

  it("mostra contagem por coluna", () => {
    renderKanban();
    expect(screen.getAllByText("1", { selector: "span" })).toHaveLength(4);
  });

  it("mostra origem projeto · seção no card", () => {
    renderKanban();
    expect(screen.getAllByText("P · geral")).toHaveLength(4);
  });

  it("estado vazio sem projetos", () => {
    renderKanban({ projetos: [] });
    expect(screen.getByText(/nenhuma tarefa para o kanban/)).toBeTruthy();
  });

  it("mostra prio P1 com destaque no card", () => {
    renderKanban({
      projetos: [projeto({ sections: [{ ...projeto().sections[0], tasks: [
        { ...projeto().sections[0].tasks[0], prio: 1 },
      ] }] })],
    });
    expect(screen.getByText("P1")).toBeTruthy();
  });

  it("mostra due vencida destacada no card", () => {
    renderKanban({
      projetos: [projeto({ sections: [{ ...projeto().sections[0], tasks: [
        { ...projeto().sections[0].tasks[0], due: "2020-01-01" },
      ] }] })],
    });
    expect(screen.getByText(/vencida/)).toBeTruthy();
  });

  it("mostra glyph de bloqueada no card", () => {
    renderKanban({
      projetos: [projeto({ sections: [{ ...projeto().sections[0], tasks: [
        { ...projeto().sections[0].tasks[0], blocked: true },
      ] }] })],
    });
    expect(screen.getByText(/bloqueada/)).toBeTruthy();
  });

it("clique no card abre o modal de edição e submit chama onEditTask", () => {
    const onEditTask = vi.fn();
    renderKanban({ onEditTask });
    fireEvent.click(screen.getByRole("button", { name: /editar tarefa correr pra base/ }));
    expect(screen.getByText("editar tarefa")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("tarefa", { exact: true }), { target: { value: "correr pro topo" } });
    fireEvent.click(screen.getByText("salvar"));
    expect(onEditTask).toHaveBeenCalledWith("p1", "s1", "t1", expect.objectContaining({ text: "correr pro topo" }));
  });

  it("click após drag (>6px) não abre o modal", () => {
    const onEditTask = vi.fn();
    renderKanban({ onEditTask });
    const card = screen.getByRole("button", { name: /editar tarefa correr pra base/ });
    fireEvent.pointerDown(card, { clientX: 10, clientY: 10 });
    fireEvent.click(card, { clientX: 40, clientY: 10 });
    expect(screen.queryByText("editar tarefa")).toBeNull();
  });

  it("click sem movimento abre o modal", () => {
    renderKanban();
    const card = screen.getByRole("button", { name: /editar tarefa correr pra base/ });
    fireEvent.pointerDown(card, { clientX: 10, clientY: 10 });
    fireEvent.click(card, { clientX: 12, clientY: 11 });
    expect(screen.getByText("editar tarefa")).toBeTruthy();
  });

  it("mostra contador de sub-tarefas concluídas no card", () => {
    renderKanban({
      projetos: [projeto({ sections: [{ ...projeto().sections[0], tasks: [
        { ...projeto().sections[0].tasks[0], subs: [
          { id: "s1", text: "a", note: "", prio: 3, due: "", status: "done", blocked: false, subs: [] },
          { id: "s2", text: "b", note: "", prio: 3, due: "", status: "todo", blocked: false, subs: [] },
        ] },
      ] }] })],
    });
    expect(screen.getByLabelText("sub-tarefas 1/2")).toBeTruthy();
  });

  it("contador de subs abre o modal com foco na seção de sub-tarefas", () => {
    const onEditTask = vi.fn();
    renderKanban({
      onEditTask,
      projetos: [projeto({ sections: [{ ...projeto().sections[0], tasks: [
        { ...projeto().sections[0].tasks[0], subs: [
          { id: "s1", text: "a", note: "", prio: 3, due: "", status: "done", blocked: false, subs: [] },
        ] },
      ] }] })],
    });
    fireEvent.click(screen.getByRole("button", { name: "sub-tarefas 1/1" }));
    expect(screen.getByRole("dialog", { name: "editar tarefa" })).toBeTruthy();
    expect(screen.getByTestId("subs-section")).toHaveAttribute("data-focus", "");
    expect(onEditTask).not.toHaveBeenCalled();
  });

  it("adiciona e alterna sub-tarefa no modal e salva com subs", () => {
    const onEditTask = vi.fn();
    renderKanban({ onEditTask });
    fireEvent.click(screen.getByRole("button", { name: /editar tarefa correr pra base/ }));
    fireEvent.change(screen.getByLabelText("nova sub-tarefa"), { target: { value: "aquecer" } });
    fireEvent.keyDown(screen.getByLabelText("nova sub-tarefa"), { key: "Enter" });
    fireEvent.click(screen.getByLabelText("sub-tarefa aquecer"));
    fireEvent.click(screen.getByText("salvar"));
    expect(onEditTask).toHaveBeenCalledWith("p1", "s1", "t1", expect.objectContaining({
      subs: [expect.objectContaining({ text: "aquecer", status: "done" })],
    }));
  });

it("title do card é o texto da tarefa", () => {
    renderKanban();
    expect(screen.getByRole("button", { name: /editar tarefa correr pra base/ })).toHaveAttribute("title", "correr pra base");
  });

  it("botão + da coluna abre modal de criação com status fixo", () => {
    renderKanban();
    fireEvent.click(screen.getByRole("button", { name: "nova tarefa em a fazer" }));
    const dialog = screen.getByRole("dialog", { name: "nova tarefa" });
    expect(within(dialog).getByText("a fazer")).toBeTruthy();
  });

  it("salvar no modal de criação chama onAddTask com projeto, status e campos", () => {
    const onAddTask = vi.fn();
    renderKanban({ onAddTask });
    fireEvent.click(screen.getByRole("button", { name: "nova tarefa em a fazer" }));
    fireEvent.change(screen.getByLabelText("tarefa", { exact: true }), { target: { value: "nova card" } });
    fireEvent.change(screen.getByLabelText("nota"), { target: { value: "obs" } });
    fireEvent.click(screen.getByText("salvar"));
    expect(onAddTask).toHaveBeenCalledWith(
      "p1",
      "s1",
      expect.objectContaining({ text: "nova card", status: "todo", note: "obs", prio: 3 }),
    );
  });

  it("texto vazio no modal de criação não chama onAddTask", () => {
    const onAddTask = vi.fn();
    renderKanban({ onAddTask });
    fireEvent.click(screen.getByRole("button", { name: "nova tarefa em a fazer" }));
    fireEvent.click(screen.getByText("salvar"));
    expect(onAddTask).not.toHaveBeenCalled();
  });

  it("usa o projeto escolhido no select do modal de criação", async () => {
    const onAddTask = vi.fn();
    const p2 = projeto({ id: "p2", title: "Q", sections: [{ ...projeto().sections[0], id: "s2" }] });
    renderKanban({ projetos: [projeto(), p2], onAddTask });
    fireEvent.click(screen.getByRole("button", { name: "nova tarefa em a fazer" }));
    await userEvent.click(screen.getByLabelText("projeto"));
    await userEvent.click(await screen.findByRole("option", { name: "Q" }));
    fireEvent.change(screen.getByLabelText("tarefa", { exact: true }), { target: { value: "na fila" } });
    fireEvent.click(screen.getByText("salvar"));
    expect(onAddTask).toHaveBeenCalledWith(
      "p2",
      "s2",
      expect.objectContaining({ text: "na fila", status: "todo" }),
    );
  });

  it("× no card chama onDeleteTask sem abrir o modal", () => {
    const onDeleteTask = vi.fn();
    renderKanban({ onDeleteTask });
    const card = screen.getByRole("button", { name: /editar tarefa correr pra base/ });
    fireEvent.click(within(card).getByRole("button", { name: "excluir" }));
    expect(onDeleteTask).toHaveBeenCalledWith("p1", "s1", "t1");
    expect(screen.queryByText("editar tarefa")).toBeNull();
  });

  it("clique no badge de prioridade cicla prio via onEditTask sem abrir modal", () => {
    const onEditTask = vi.fn();
    renderKanban({
      onEditTask,
      projetos: [projeto({ sections: [{ ...projeto().sections[0], tasks: [
        { ...projeto().sections[0].tasks[0], prio: 1 },
      ] }] })],
    });
    const card = screen.getByRole("button", { name: /editar tarefa correr pra base/ });
    fireEvent.click(within(card).getByRole("button", { name: "prioridade: clique pra mudar" }));
    expect(onEditTask).toHaveBeenCalledWith("p1", "s1", "t1", { prio: 2 });
    expect(screen.queryByText("editar tarefa")).toBeNull();
  });

  it("teclado no botão excluir não abre o modal", () => {
    renderKanban({});
    const card = screen.getByRole("button", { name: /editar tarefa correr pra base/ });
    fireEvent.keyDown(within(card).getByRole("button", { name: "excluir" }), { key: "Enter" });
    expect(screen.queryByText("editar tarefa")).toBeNull();
  });
});
