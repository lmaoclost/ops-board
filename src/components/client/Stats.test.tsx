import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Stats } from "../../components/client/Stats";
import { defaultFilters, type Filters } from "../../lib/filter";
import { todayISO } from "../../lib/date";
import type { Project } from "../../lib/types";

const projeto = (tasks: Project["sections"][number]["tasks"]): Project => ({
  id: "p1",
  title: "A",
  blocked: false,
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
  doneAt: null,
  ...over,
});

describe("Stats", () => {
  it("mostra total, pendentes, concluídas com % e feitas hoje", () => {
    render(
      <Stats
        projetos={[
          projeto([
            task(),
            task({ id: "t2", status: "doing" }),
            task({ id: "t3", status: "done", doneAt: todayISO() + "T09:00:00.000Z" }),
          ]),
        ]}
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
        projetos={[projeto([task()])]}
        filters={defaultFilters}
        onTogglePrioSort={() => {}}
      />,
    );
    expect(screen.getByText("(0%)")).toBeTruthy();
  });

  it("toggle de prioridade invoca callback", async () => {
    const onTogglePrioSort = vi.fn();
    render(
      <Stats projetos={[projeto([])]} filters={defaultFilters} onTogglePrioSort={onTogglePrioSort} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "↕ prio" }));
    expect(onTogglePrioSort).toHaveBeenCalledTimes(1);
  });

  it("destaca dica de kanban quando em kanban", () => {
    const f: Filters = { ...defaultFilters, view: "kanban" };
    render(<Stats projetos={[]} filters={f} onTogglePrioSort={() => {}} />);
    expect(screen.getByText(/kanban: arraste/i)).toBeTruthy();
  });
});