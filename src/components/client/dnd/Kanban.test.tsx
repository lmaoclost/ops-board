import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Kanban } from "./Kanban";
import type { Project, TaskPatch } from "@/lib/types";

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
        { id: "t1", text: "correr pra base", status: "todo", note: "", blocked: false, prio: 3, due: "", doneAt: null },
        { id: "t2", text: "uprs", status: "doing", note: "", blocked: false, prio: 3, due: "", doneAt: null },
        { id: "t3", text: "ctz", status: "done", note: "novo", blocked: false, prio: 3, due: "", doneAt: "2026-01-01T10:00:00.000Z" },
        { id: "t4", text: "oe", status: "waiting", note: "", blocked: false, prio: 3, due: "", doneAt: null },
      ],
    },
  ],
  ...over,
});

const renderKanban = (props: { projetos?: Project[]; onEditTask?: (pid: string, sid: string, tid: string, patch: TaskPatch) => void } = {}) =>
  render(
    <Kanban
      projetos={props.projetos ?? [projeto()]}
      onEditTask={props.onEditTask ?? (() => {})}
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
    fireEvent.change(screen.getByLabelText("tarefa"), { target: { value: "correr pro topo" } });
    fireEvent.click(screen.getByText("salvar"));
    expect(onEditTask).toHaveBeenCalledWith("p1", "s1", "t1", expect.objectContaining({ text: "correr pro topo" }));
  });
});
