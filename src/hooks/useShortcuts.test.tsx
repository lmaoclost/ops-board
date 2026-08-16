import { act, renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useShortcuts } from "./useShortcuts";

const handlers = () => ({
  onNewProject: vi.fn(),
  onToggleView: vi.fn(),
  onToggleTheme: vi.fn(),
  onHelp: vi.fn(),
  onClearFilters: vi.fn(),
  onFocusAdd: vi.fn(),
  onFocusSearch: vi.fn(),
  onFilterStatus: vi.fn(),
  onUndo: vi.fn(),
});

const press = (key: string) => {
  fireEvent.keyDown(window, { key });
};

describe("useShortcuts", () => {
  it("p abre novo projeto", () => {
    const h = handlers();
    renderHook(() => useShortcuts(h));
    act(() => press("p"));
    expect(h.onNewProject).toHaveBeenCalledTimes(1);
  });

  it("k alterna vista e t alterna tema", () => {
    const h = handlers();
    renderHook(() => useShortcuts(h));
    act(() => press("k"));
    expect(h.onToggleView).toHaveBeenCalledTimes(1);
    act(() => press("t"));
    expect(h.onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it("? dispara ajuda", () => {
    const h = handlers();
    renderHook(() => useShortcuts(h));
    act(() => press("?"));
    expect(h.onHelp).toHaveBeenCalledTimes(1);
  });

  it("esc limpa filtros", () => {
    const h = handlers();
    renderHook(() => useShortcuts(h));
    act(() => press("Escape"));
    expect(h.onClearFilters).toHaveBeenCalledTimes(1);
  });

  it("n foca adicionar tarefa", () => {
    const h = handlers();
    renderHook(() => useShortcuts(h));
    act(() => press("n"));
    expect(h.onFocusAdd).toHaveBeenCalledTimes(1);
  });

  it("/ foca busca", () => {
    const h = handlers();
    renderHook(() => useShortcuts(h));
    act(() => press("/"));
    expect(h.onFocusSearch).toHaveBeenCalledTimes(1);
  });

  it("ignora / quando digitando em input", () => {
    const h = handlers();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    renderHook(() => useShortcuts(h));
    act(() => press("/"));
    expect(h.onFocusSearch).not.toHaveBeenCalled();
    input.remove();
  });

  it("1-5 passam o status correspondente", () => {
    const h = handlers();
    renderHook(() => useShortcuts(h));
    act(() => press("1"));
    expect(h.onFilterStatus).toHaveBeenCalledWith("todo");
    act(() => press("2"));
    expect(h.onFilterStatus).toHaveBeenCalledWith("doing");
    act(() => press("3"));
    expect(h.onFilterStatus).toHaveBeenCalledWith("waiting");
    act(() => press("4"));
    expect(h.onFilterStatus).toHaveBeenCalledWith("done");
    act(() => press("5"));
    expect(h.onFilterStatus).toHaveBeenCalledWith("blocked");
  });

  it("ignora teclas quando digitando em input", () => {
    const h = handlers();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    renderHook(() => useShortcuts(h));
    act(() => press("p"));
    expect(h.onNewProject).not.toHaveBeenCalled();
    input.remove();
  });

  it("ignora quando modal está aberto (exceto esc que fecha)", () => {
    const h = handlers();
    renderHook(() => useShortcuts(h, { isModalOpen: () => true }));
    act(() => press("p"));
    act(() => press("1"));
    expect(h.onNewProject).not.toHaveBeenCalled();
    expect(h.onFilterStatus).not.toHaveBeenCalled();
  });

  it("ignora combinações com ctrl/meta/alt", () => {
    const h = handlers();
    renderHook(() => useShortcuts(h));
    fireEvent.keyDown(window, { key: "p", ctrlKey: true });
    fireEvent.keyDown(window, { key: "p", metaKey: true });
    fireEvent.keyDown(window, { key: "p", altKey: true });
    expect(h.onNewProject).not.toHaveBeenCalled();
  });

  it("ctrl+z dispara undo", () => {
    const h = handlers();
    renderHook(() => useShortcuts(h));
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    expect(h.onUndo).toHaveBeenCalledTimes(1);
  });

  it("meta+z (mac) dispara undo", () => {
    const h = handlers();
    renderHook(() => useShortcuts(h));
    fireEvent.keyDown(window, { key: "z", metaKey: true });
    expect(h.onUndo).toHaveBeenCalledTimes(1);
  });

  it("ctrl+z não dispara undo quando digitando em input", () => {
    const h = handlers();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    renderHook(() => useShortcuts(h));
    fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    expect(h.onUndo).not.toHaveBeenCalled();
    input.remove();
  });

  it("remove listener ao desmontar", () => {
    const h = handlers();
    const { unmount } = renderHook(() => useShortcuts(h));
    unmount();
    act(() => press("p"));
    expect(h.onNewProject).not.toHaveBeenCalled();
  });
});