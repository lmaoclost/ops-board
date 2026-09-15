import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDelete } from "./ConfirmDelete";

describe("ConfirmDelete", () => {
  it("mostra título e mensagem", () => {
    render(<ConfirmDelete title="excluir tarefa?" message="vai para a lixeira" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "excluir tarefa?" })).toBeTruthy();
    expect(screen.getByText("vai para a lixeira")).toBeTruthy();
  });

  it("excluir confirma e cancelar aborta", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDelete title="x" message="y" onConfirm={onConfirm} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole("button", { name: "excluir" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
