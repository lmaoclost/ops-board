import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal, type ModalField } from "./Modal";

const fields: ModalField[] = [
  { key: "title", label: "título", value: "" },
  {
    key: "prio",
    label: "prioridade",
    type: "select",
    value: 3,
    options: [
      { value: 1, label: "P1" },
      { value: 2, label: "P2" },
      { value: 3, label: "P3" },
    ],
  },
  { key: "note", label: "nota", type: "textarea", value: "x" },
  { key: "blocked", label: "bloquear", type: "checkbox", value: true },
  { key: "due", label: "vencimento", type: "date", value: "2026-09-01" },
];

describe("Modal", () => {
  it("renderiza título, campos e valores", () => {
    render(<Modal title="editar tarefa" fields={fields} submitLabel="salvar" onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("editar tarefa")).toBeTruthy();
    expect(screen.getByLabelText("título")).toBeTruthy();
    expect(screen.getByLabelText("prioridade")).toHaveValue("3");
    expect(screen.getByLabelText("nota")).toHaveValue("x");
    expect(screen.getByRole("switch", { name: "bloquear" })).toBeChecked();
  });

  it("submete valores coletados e edita campos", async () => {
    const onSubmit = vi.fn();
    render(<Modal title="x" fields={[{ key: "title", label: "título", value: "abc" }]} submitLabel="salvar" onSubmit={onSubmit} onCancel={() => {}} />);
    const input = screen.getByLabelText("título");
    await userEvent.clear(input);
    await userEvent.type(input, "novo");
    await userEvent.click(screen.getByRole("button", { name: "salvar" }));
    expect(onSubmit).toHaveBeenCalledWith({ title: "novo" });
  });

  it("esc chama onCancel", async () => {
    const onCancel = vi.fn();
    render(<Modal title="x" fields={[]} submitLabel="ok" onSubmit={() => {}} onCancel={onCancel} />);
    await userEvent.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("clique no backdrop chama onCancel", async () => {
    const onCancel = vi.fn();
    const { container } = render(<Modal title="x" fields={[]} submitLabel="ok" onSubmit={() => {}} onCancel={onCancel} />);
    await userEvent.click(container.firstChild as HTMLElement);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("marca dialog como modal com aria", () => {
    render(<Modal title="x" fields={[]} submitLabel="ok" onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("dialog", { name: "x" })).toBeTruthy();
  });
});