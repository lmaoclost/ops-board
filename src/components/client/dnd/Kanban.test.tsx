import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Kanban } from "./Kanban";
import type { Project } from "@/lib/types";

const projeto = (): Project => ({
  id: "p1",
  title: "P",
  blocked: false,
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
});

describe("Kanban", () => {
  it("agrupa tarefas por status em colunas", () => {
    render(<Kanban projetos={[projeto()]} />);
    expect(screen.getByText("a fazer")).toBeTruthy();
    expect(screen.getByText("em andamento")).toBeTruthy();
    expect(screen.getByText("aguardando")).toBeTruthy();
    expect(screen.getByText("concluída")).toBeTruthy();
    expect(screen.getByText("correr pra base")).toBeTruthy();
    expect(screen.getByText("uprs")).toBeTruthy();
  });

it("mostra contagem por coluna", () => {
    render(<Kanban projetos={[projeto()]} />);
    expect(screen.getAllByText("1", { selector: "span" })).toHaveLength(4);
  });

  it("mostra origem projeto · seção no card", () => {
    render(<Kanban projetos={[projeto()]} />);
    expect(screen.getAllByText("P · geral")).toHaveLength(4);
  });

  it("estado vazio sem projetos", () => {
    render(<Kanban projetos={[]} />);
    expect(screen.getByText(/nenhuma tarefa para o kanban/)).toBeTruthy();
  });
});