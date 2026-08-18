import { useState } from "react";
import { useT } from "@/hooks/useT";
import { fmtDate, isOverdue, todayISO } from "@/lib/date";
import { flatTasks, groupAgenda, type FlatTask } from "@/lib/flat";
import { PRIO_CLS, PRIO_KEYS, type Project, type Status, type TaskPatch } from "@/lib/types";
import { TaskEditModal } from "@/components/client/board/TaskEditModal";

interface AgendaProps {
  projetos: Project[];
  onToggle: (pid: string, sid: string, tid: string) => void;
  onEditTask: (pid: string, sid: string, tid: string, patch: TaskPatch) => void;
}

const LED: Record<Status, string> = {
  todo: "bg-[var(--todo)]",
  doing: "bg-[var(--flow)]",
  waiting: "bg-[var(--warn)]",
  done: "bg-[var(--fired)]",
};

const GROUP_KEYS = ["vencidas", "hoje", "próximos 7 dias"] as const;

export function Agenda({ projetos, onToggle, onEditTask }: AgendaProps) {
  const { t } = useT();
  const [editing, setEditing] = useState<FlatTask | null>(null);

  const items = flatTasks(projetos);
  const { overdue, today: todayItems, upcoming } = groupAgenda(items, todayISO());
  const byGroup = { vencidas: overdue, hoje: todayItems, "próximos 7 dias": upcoming };

  if (!overdue.length && !todayItems.length && !upcoming.length) {
    return (
      <div className="fade-in rounded-lg border border-dashed border-[var(--line-soft)] p-10 text-center text-[var(--dim)]">
        <span className="block text-2xl">▤</span>
        <p>{t("nenhuma tarefa para a agenda")}.</p>
      </div>
    );
  }

  return (
    <>
      <div className="fade-in flex flex-col gap-4">
        {GROUP_KEYS.map((key) => {
          const group = byGroup[key];
          if (!group.length) return null;
          return (
            <section key={key} aria-label={t(key)} className="rounded-lg border border-[var(--line-soft)] bg-[var(--panel)] px-2 py-2">
              <header className="mb-1 flex items-center gap-2 px-1">
                <h2 className={`text-[11px] font-bold uppercase tracking-wider ${key === "vencidas" ? "text-[var(--gave)]" : "text-[var(--muted-text)]"}`}>
                  {t(key)}
                </h2>
                <span className="text-[10px] text-[var(--dimmer)]">{group.length}</span>
              </header>
              <ul className="flex flex-col">
                {group.map((item) => (
                  <li
                    key={item.task.id}
                    className="group flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-[var(--hover)]"
                  >
                    <button
                      type="button"
                      onClick={() => onToggle(item.pid, item.sid, item.task.id)}
                      title={t("alternar concluída")}
                      aria-label={t("alternar concluída")}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--hover)]"
                    >
                      <span className={`h-2 w-2 rounded-full ${LED[item.task.status]} transition-transform group-hover:scale-110`} />
                    </button>
                    <span
                      className={`shrink-0 rounded border px-1 py-0.5 text-[9px] font-bold ${PRIO_CLS[item.task.prio]}`}
                      title={t("prioridade")}
                    >
                      {PRIO_KEYS[item.task.prio]}
                    </span>
                    {item.task.blocked && (
                      <span className="shrink-0 text-[10px]" title={t("bloqueada")}>
                        ⛔
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-[13px] leading-snug text-[var(--text)]">{item.task.text}</span>
                      <span className="block truncate text-[10px] text-[var(--dim)]">
                        {item.ptitle} · {item.stitle}
                      </span>
                    </button>
                    <span
                      className={`shrink-0 text-[10px] font-semibold ${isOverdue(item.task.due, item.task.status) ? "text-[var(--gave)]" : "text-[var(--muted-text)]"}`}
                      title={`vencimento ${item.task.due}`}
                    >
                      {fmtDate(item.task.due)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {editing && (
        <TaskEditModal
          task={editing.task}
          onSubmit={(patch) => {
            onEditTask(editing.pid, editing.sid, editing.task.id, patch);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </>
  );
}