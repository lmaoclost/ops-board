import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/hooks/useT";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isDueSoon, isOverdue } from "@/lib/date";
import { linkify } from "@/lib/escape";
import { fmtDate } from "@/lib/date";
import { uid } from "@/lib/uid";
import { PRIO_KEYS, STATUS_ORDER, type Prio, type Status, type Task, type TaskPatch } from "@/lib/types";

export interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onPrioCycle: () => void;
  onStatusChange: (status: Status) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (patch: TaskPatch) => void;
}

export const NEXT_PRIO: Record<Prio, Prio> = { 1: 2, 2: 3, 3: 1 };

const LED: Record<Status, string> = {
  todo: "bg-[var(--todo)]",
  doing: "bg-[var(--flow)]",
  waiting: "bg-[var(--warn)]",
  done: "bg-[var(--fired)]",
};

const PRIO_CLS: Record<Prio, string> = {
  1: "text-[var(--gave)] border-[var(--gave)]/40 bg-[var(--gave)]/10",
  2: "text-[var(--warn)] border-[var(--warn)]/40 bg-[var(--warn)]/10",
  3: "text-[var(--muted-text)] border-[var(--line)]",
};

export function TaskRow({ task, onToggle, onPrioCycle, onStatusChange, onEdit, onDelete, onUpdate }: TaskRowProps) {
  const { t, status } = useT();
  const [addingSub, setAddingSub] = useState(false);
  const [subDraft, setSubDraft] = useState("");
  const overdue = isOverdue(task.due, task.status);
  const dueSoon = isDueSoon(task.due, task.status);
  const done = task.status === "done";

  const submitSub = () => {
    const text = subDraft.trim();
    if (text) onUpdate({ subs: [...task.subs, { id: uid(), text, done: false }] });
    setSubDraft("");
    setAddingSub(false);
  };

  return (
    <div data-testid="task-row" className="group rounded-md">
      <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--hover)]">
        <button
          type="button"
          onClick={() => setAddingSub(true)}
          title={t("nova sub-tarefa")}
          aria-label={t("nova sub-tarefa")}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--dimmer)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
        >
          +
        </button>
        <button
          type="button"
          onClick={onToggle}
          title={t("alternar concluída")}
          aria-label={t("alternar concluída")}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--hover)]`}
        >
          <span
            className={`h-2 w-2 rounded-full ${task.blocked ? "bg-[var(--gave)]" : LED[task.status]} ${done ? "bg-[var(--fired)]" : ""} transition-transform group-hover:scale-110`}
          />
        </button>
        {addingSub ? (
          <input
            autoFocus
            value={subDraft}
            onChange={(e) => setSubDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitSub();
              } else if (e.key === "Escape") {
                setAddingSub(false);
                setSubDraft("");
              }
            }}
            placeholder={`${t("nova sub-tarefa")}…`}
            aria-label={t("nova sub-tarefa")}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded border border-[var(--line)] bg-[var(--field)] px-1.5 py-1 text-[13px] text-[var(--text)] outline-none focus:border-[var(--fired)]"
          />
        ) : (
          <span className="min-w-0 flex-1 text-[13px] leading-snug break-words text-[var(--text)]">
            <span
              className={done ? "text-[var(--dim)] line-through decoration-[var(--line)]" : ""}
              dangerouslySetInnerHTML={{ __html: linkify(task.text) }}
            />
            {task.note && (
              <span
                className="text-[var(--dim)]"
                dangerouslySetInnerHTML={{ __html: ` — ${linkify(task.note)}` }}
              />
            )}
          </span>
        )}
        {task.blocked && (
          <Badge variant="destructive" className="rounded-[4px] px-1.5 text-[11px] font-bold uppercase tracking-[0.08em]">
            bloqueada
          </Badge>
        )}
        <Tooltip>
          <TooltipTrigger render={
            <button
              type="button"
              onClick={onPrioCycle}
              aria-label={t("prioridade: clique pra mudar")}
              className={`shrink-0 rounded px-1.5 py-0.5 border text-[11px] font-bold ${PRIO_CLS[task.prio]}`}
            >
              {PRIO_KEYS[task.prio]}
            </button>
          } />
          <TooltipContent side="top">prioridade: clique pra mudar</TooltipContent>
        </Tooltip>
        {task.due &&
          (overdue ? (
            <Badge
              variant="destructive"
              className="rounded-[4px] px-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
              title={`vencimento ${task.due}`}
            >
              {fmtDate(task.due)} vencida
            </Badge>
          ) : (
            <span
              className={`shrink-0 text-[10.5px] font-semibold ${dueSoon ? "text-[var(--warn)]" : "text-[var(--muted-text)]"}`}
              title={`vencimento ${task.due}`}
            >
              {fmtDate(task.due)}
            </span>
          ))}
        <Select
          value={task.status}
          onValueChange={(v) => onStatusChange(v as Status)}
        >
          <SelectTrigger
            size="sm"
            aria-label={t("mudar status")}
            title={t("mudar status")}
            className="h-7 border-[var(--line)] bg-[var(--field)] px-2 text-[11px] text-[var(--muted-text)] hover:border-[var(--muted-text)] hover:text-[var(--text)]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_ORDER.map((k) => (
              <SelectItem key={k} value={k} className="py-1 text-xs">
                {status(k)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onEdit} title={t("editar")} aria-label={t("editar")}>
          ✎
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="icon-xs"
          onClick={onDelete}
          title="excluir"
          aria-label="excluir"
        >
          ×
        </Button>
      </div>
      {task.subs.length > 0 && (
        <div className="pb-1">
          {task.subs.map((s) => (
            <div key={s.id} className="flex items-center gap-2.5 pl-8 pr-2 py-1">
              <button
                type="button"
                role="checkbox"
                aria-checked={s.done}
                onClick={() => onUpdate({ subs: task.subs.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })}
                aria-label={`sub-tarefa ${s.text}`}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--hover)]"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${s.done ? "bg-[var(--fired)]" : "bg-[var(--dimmer)]"} transition-transform group-hover:scale-110`}
                />
              </button>
              <span className={`min-w-0 flex-1 break-words text-[12px] ${s.done ? "text-[var(--dim)] line-through" : "text-[var(--muted-text)]"}`}>
                {s.text}
              </span>
              <button
                type="button"
                onClick={() => onUpdate({ subs: task.subs.filter((x) => x.id !== s.id) })}
                title={`${t("remover sub-tarefa")} ${s.text}`}
                aria-label={`${t("remover sub-tarefa")} ${s.text}`}
                className="shrink-0 text-[var(--dimmer)] transition-colors hover:text-[var(--fired)]"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}