import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskEditModal } from "./TaskEditModal";
import type { Task } from "@/lib/types";

const task = (over: Partial<Task> = {}): Task => ({
  id: "t1",
  text: "fazer x",
  status: "todo",
  note: "",
  blocked: false,
  blockedReason: "",
  prio: 5,
  due: "",
  doneAt: null,
  subs: [],
  ...over,
});

describe("TaskEditModal motivo do bloqueio", () => {
  it("oculta motivo quando tarefa não está bloqueada", () => {
    render(<TaskEditModal task={task()} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByLabelText("motivo do bloqueio")).toBeNull();
  });

  it("mostra motivo ao ligar o switch de bloqueada", async () => {
    render(<TaskEditModal task={task()} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(await screen.findByLabelText("motivo do bloqueio")).toBeTruthy();
  });

  it("mostra motivo preenchido quando tarefa já está bloqueada", () => {
    render(
      <TaskEditModal
        task={task({ blocked: true, blockedReason: "sem acesso" })}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("motivo do bloqueio")).toHaveValue("sem acesso");
  });

  it("salva motivo digitado após ligar o switch", async () => {
    const onSubmit = vi.fn();
    render(<TaskEditModal task={task()} onSubmit={onSubmit} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole("switch"));
    await userEvent.type(await screen.findByLabelText("motivo do bloqueio"), "aguardando");
    await userEvent.click(screen.getByRole("button", { name: "salvar" }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ blocked: true, blockedReason: "aguardando" }),
      undefined,
    );
  });
});
