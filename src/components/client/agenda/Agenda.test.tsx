import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Agenda } from "./Agenda";
import type { Project, Task } from "@/lib/types";

const iso = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const makeTask = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  text: `tarefa ${id}`,
  status: "todo",
  note: "",
  blocked: false,
  prio: 3,
  due: "",
  doneAt: null,
  subs: [],
  ...over,
});

const projeto: Project = {
  id: "p1",
  title: "Alfa",
  blocked: false, archived: false, prio: 3, due: "", collapsed: false,
  sections: [{ id: "s1", title: "geral", notes: "", collapsed: false, tasks: [] }],
};

const base = (tasks: Task[]) => ({
  projetos: [{ ...projeto, sections: [{ ...projeto.sections[0], tasks }] }],
  onToggle: vi.fn(),
  onEditTask: vi.fn(),
  onDeleteTask: vi.fn(),
});

describe("Agenda", () => {
  it("agrupa vencidas, hoje e próximos 7 dias", () => {
    const p = base([makeTask("t1", { due: iso(-1) }), makeTask("t2", { due: iso(0) }), makeTask("t3", { due: iso(3) })]);
    render(<Agenda {...p} />);
    expect(screen.getByText("vencidas")).toBeTruthy();
    expect(screen.getByText("hoje")).toBeTruthy();
    expect(screen.getByText("próximos 7 dias")).toBeTruthy();
    expect(screen.getByText("tarefa t1")).toBeTruthy();
    expect(screen.getByText("tarefa t2")).toBeTruthy();
    expect(screen.getByText("tarefa t3")).toBeTruthy();
  });

  it("ignora concluídas, fora de 7 dias e sem due; sem itens mostra empty state", () => {
    const p = base([
      makeTask("done", { status: "done", due: iso(0) }),
      makeTask("longe", { due: iso(10) }),
      makeTask("sem", { due: "" }),
    ]);
    render(<Agenda {...p} />);
    expect(screen.getByText("nenhuma tarefa para a agenda.")).toBeTruthy();
  });

  it("LED alterna concluída com pid/sid/tid", () => {
    const p = base([makeTask("t1", { due: iso(0) })]);
    render(<Agenda {...p} />);
    fireEvent.click(screen.getByRole("button", { name: "alternar concluída" }));
    expect(p.onToggle).toHaveBeenCalledWith("p1", "s1", "t1");
  });

  it("clique no título abre modal de edição", () => {
    const p = base([makeTask("t1", { due: iso(0) })]);
    render(<Agenda {...p} />);
    fireEvent.click(screen.getByRole("button", { name: /tarefa t1/ }));
    expect(screen.getByText("editar tarefa")).toBeTruthy();
  });
});