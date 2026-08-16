import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Stats } from "../../components/client/Stats";
import { defaultFilters, type Filters } from "../../lib/filter";
import { todayISO } from "../../lib/date";
import { deriveStats, type BoardStats } from "../../lib/selectors";
import type { Project } from "../../lib/types";

const projeto = (tasks: Project["sections"][number]["tasks"]): Project => ({
  id: "p1",
  title: "A",
  blocked: false, archived: false, prio: 3, due: "", collapsed: false,
  sections: [{ id: "s1", title: "geral", tasks, notes: "", collapsed: false }],
});

const task = (over: Partial<Project["sections"][number]["tasks"][number]> = {}): Project["sections"][number]["tasks"][number] => ({
  id: "t1",
  text: "x",
  status: "todo" as const,
  note: "",
  blocked: false,
  prio: 3,
  due: "",
  doneAt: null, subs: [],
  ...over,
});

const statsOf = (projetos: Project[]): BoardStats => deriveStats(projetos);

describe("Stats", () => {
  it("mostra total, pendentes, concluídas com % e feitas hoje", () => {
    render(
      <Stats
        stats={statsOf([
          projeto([
            task(),
            task({ id: "t2", status: "doing" }),
            task({ id: "t3", status: "done", doneAt: todayISO() + "T09:00:00.000Z" }),
          ]),
        ])}
        filters={defaultFilters}
        onTogglePrioSort={() => {}}
      />,
    );
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("(33%)")).toBeTruthy();
    expect(screen.getByText("+1")).toBeTruthy();
  });

  it("casa 0% sem tarefas concluídas", () => {
    render(
      <Stats
        stats={statsOf([projeto([task()])])}
        filters={defaultFilters}
        onTogglePrioSort={() => {}}
      />,
    );
    expect(screen.getByText("(0%)")).toBeTruthy();
  });

  it("toggle de prioridade invoca callback", async () => {
    const onTogglePrioSort = vi.fn();
    render(
      <Stats stats={statsOf([projeto([])])} filters={defaultFilters} onTogglePrioSort={onTogglePrioSort} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "↕ prio" }));
    expect(onTogglePrioSort).toHaveBeenCalledTimes(1);
  });

  it("destaca dica de kanban quando em kanban", () => {
    const f: Filters = { ...defaultFilters, view: "kanban" };
    render(<Stats stats={statsOf([])} filters={f} onTogglePrioSort={() => {}} />);
    expect(screen.getByText(/kanban: arraste/i)).toBeTruthy();
  });

  it("expõe contadores por data-testid estável", () => {
    render(
      <Stats
        stats={statsOf([
          projeto([
            task(),
            task({ id: "t2", status: "doing" }),
            task({ id: "t3", status: "done", doneAt: todayISO() + "T09:00:00.000Z" }),
          ]),
        ])}
        filters={defaultFilters}
        onTogglePrioSort={() => {}}
      />,
    );
    expect(screen.getByTestId("stat-total")).toHaveTextContent("3");
    expect(screen.getByTestId("stat-pending")).toHaveTextContent("2");
    expect(screen.getByTestId("stat-done")).toHaveTextContent("1");
    expect(screen.getByTestId("stat-today")).toHaveTextContent("+1");
  });
});