import { useCallback, useState } from "react";
import { defaultFilters, type Filters, type StatusFilter, type View } from "../lib/filter";

export function useFilters(initial: Filters = defaultFilters) {
  const [filters, setFilters] = useState<Filters>(initial);

  const setQuery = useCallback((query: string) => {
    setFilters((f) => ({ ...f, query }));
  }, []);

  const toggleStatus = useCallback((status: StatusFilter) => {
    setFilters((f) => ({ ...f, status: f.status === status ? null : status }));
  }, []);

  const togglePrioSort = useCallback(() => {
    setFilters((f) => ({ ...f, prioSort: !f.prioSort }));
  }, []);

  const toggleView = useCallback(() => {
    setFilters((f) => ({ ...f, view: (f.view === "list" ? "kanban" : "list") as View }));
  }, []);

  const toggleArchived = useCallback(() => {
    setFilters((f) => ({ ...f, archived: !f.archived }));
  }, []);

  const clear = useCallback(() => {
    setFilters((f) => ({ ...f, query: "", status: null, archived: false }));
  }, []);

  return { filters, setQuery, toggleStatus, togglePrioSort, toggleView, toggleArchived, clear };
}