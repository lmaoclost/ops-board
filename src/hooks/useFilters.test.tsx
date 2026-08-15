import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFilters } from "./useFilters";

describe("useFilters", () => {
  it("mantém filtros default", () => {
    const { result } = renderHook(() => useFilters());
    expect(result.current.filters).toEqual({
      query: "",
      status: null,
      prioSort: false,
      view: "list",
      archived: false,
    });
  });

  it("setQuery atualiza e preserva o resto", () => {
    const { result } = renderHook(() => useFilters());
    act(() => result.current.setQuery("relatório"));
    expect(result.current.filters.query).toBe("relatório");
    expect(result.current.filters.status).toBeNull();
  });

  it("toggleStatus alterna e desliga ao repetir", () => {
    const { result } = renderHook(() => useFilters());
    act(() => result.current.toggleStatus("doing"));
    expect(result.current.filters.status).toBe("doing");
    act(() => result.current.toggleStatus("doing"));
    expect(result.current.filters.status).toBeNull();
  });

  it("troca entre status diferentes", () => {
    const { result } = renderHook(() => useFilters());
    act(() => result.current.toggleStatus("todo"));
    act(() => result.current.toggleStatus("done"));
    expect(result.current.filters.status).toBe("done");
  });

  it("toggleView alterna lista/kanban", () => {
    const { result } = renderHook(() => useFilters());
    act(() => result.current.toggleView());
    expect(result.current.filters.view).toBe("kanban");
    act(() => result.current.toggleView());
    expect(result.current.filters.view).toBe("list");
  });

  it("togglePrioSort alterna", () => {
    const { result } = renderHook(() => useFilters());
    act(() => result.current.togglePrioSort());
    expect(result.current.filters.prioSort).toBe(true);
  });

  it("clear limpa query e status, preserva view e prioSort", () => {
    const { result } = renderHook(() => useFilters());
    act(() => {
      result.current.setQuery("x");
      result.current.toggleStatus("todo");
      result.current.toggleView();
      result.current.togglePrioSort();
    });
    act(() => result.current.clear());
    expect(result.current.filters.query).toBe("");
    expect(result.current.filters.status).toBeNull();
    expect(result.current.filters.view).toBe("kanban");
    expect(result.current.filters.prioSort).toBe(true);
  });
});