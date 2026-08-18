import { useT } from "@/hooks/useT";
import { flatTasks } from "@/lib/flat";
import type { Project } from "@/lib/types";

interface TrashProps {
  projetos: Project[];
  onRestore: (pid: string, sid: string, tid: string) => void;
  onPurge: (pid: string, sid: string, tid: string) => void;
}

export function Trash({ projetos, onRestore, onPurge }: TrashProps) {
  const { t } = useT();
  const items = flatTasks(projetos, true).toSorted((a, b) =>
    (b.task.deletedAt ?? "").localeCompare(a.task.deletedAt ?? ""),
  );

  if (!items.length) {
    return (
      <div className="fade-in rounded-lg border border-dashed border-[var(--line-soft)] p-10 text-center text-[var(--dim)]">
        <span className="block text-2xl">🗑</span>
        <p>{t("lixeira vazia")}.</p>
      </div>
    );
  }

  return (
    <div className="fade-in rounded-lg border border-[var(--line-soft)] bg-[var(--panel)] px-2 py-2">
      <header className="mb-1 flex items-center gap-2 px-1">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted-text)]">{t("lixeira")}</h2>
        <span className="text-[10px] text-[var(--dimmer)]">{items.length}</span>
      </header>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.task.id} className="group flex items-center gap-2.5 rounded-md px-1.5 py-1.5 transition-colors hover:bg-[var(--hover)]">
            <button
              type="button"
              onClick={() => onRestore(item.pid, item.sid, item.task.id)}
              aria-label={`restaurar ${item.task.text}`}
              title={t("restaurar")}
              className="shrink-0 rounded border border-[var(--line-soft)] px-1.5 py-0.5 text-[10px] text-[var(--muted-text)] transition-colors hover:border-[var(--muted-text)] hover:text-[var(--text)]"
            >
              ↺ {t("restaurar")}
            </button>
            <button
              type="button"
              onClick={() => onPurge(item.pid, item.sid, item.task.id)}
              aria-label={`excluir definitivamente ${item.task.text}`}
              title={t("excluir definitivamente")}
              className="shrink-0 rounded border border-[var(--line-soft)] px-1.5 py-0.5 text-[10px] text-[var(--dimmer)] transition-colors hover:border-[var(--fired)] hover:text-[var(--fired)]"
            >
              ×
            </button>
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--dim)] line-through">{item.task.text}</span>
            <span className="shrink-0 text-[10px] text-[var(--dimmer)]">
              {item.ptitle} · {item.stitle}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}