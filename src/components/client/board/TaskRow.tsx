import { Badge } from "@/components/ui/badge";
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
import { PRIO_KEYS, STATUS_LABEL, STATUS_ORDER, type Prio, type Status, type Task } from "@/lib/types";

export interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onPrioCycle: () => void;
  onStatusChange: (status: Status) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const NEXT_PRIO: Record<Prio, Prio> = { 1: 2, 2: 3, 3: 1 };

const LED: Record<Status, string> = {
  todo: "bg-slate-500",
  doing: "bg-cyan-400",
  waiting: "bg-amber-400",
  done: "bg-emerald-400",
};

const PRIO_CLS: Record<Prio, string> = {
  1: "text-red-400 border-red-500/40 bg-red-500/10",
  2: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  3: "text-[var(--muted-text)] border-zinc-600",
};

export function TaskRow({ task, onToggle, onPrioCycle, onStatusChange, onEdit, onDelete }: TaskRowProps) {
  const overdue = isOverdue(task.due, task.status);
  const dueSoon = isDueSoon(task.due, task.status);
  const done = task.status === "done";

  return (
    <div
      data-testid="task-row"
      className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--hover)] ${done ? "" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        title="alternar concluída"
        aria-label="alternar concluída"
        className={`h-2 w-2 shrink-0 rounded-full ${task.blocked ? "bg-red-400" : LED[task.status]} ${done ? "bg-emerald-400" : ""} transition-transform hover:scale-125`}
      />
      <span className="min-w-0 flex-1 text-[12.5px] leading-snug break-words text-[var(--text)]">
        <span
          className={done ? "text-[var(--dim)] line-through decoration-zinc-700" : ""}
          dangerouslySetInnerHTML={{ __html: linkify(task.text) }}
        />
        {task.note && <span className="text-[var(--dim)]"> — {linkify(task.note)}</span>}
      </span>
      {task.blocked && (
        <Badge variant="destructive" className="rounded-[4px] px-1.5 text-[10px] font-bold uppercase tracking-[0.08em]">
          bloqueada
        </Badge>
      )}
      <Tooltip>
        <TooltipTrigger render={
          <button
            type="button"
            onClick={onPrioCycle}
            aria-label="prioridade: clique pra mudar"
            className={`shrink-0 rounded px-1.5 py-0.5 border text-[10px] font-bold ${PRIO_CLS[task.prio]}`}
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
            className="rounded-[4px] px-1.5 text-[10px] font-bold uppercase tracking-[0.08em]"
            title={`vencimento ${task.due}`}
          >
            {fmtDate(task.due)} vencida
          </Badge>
        ) : (
          <span
            className={`shrink-0 text-[10.5px] font-semibold ${dueSoon ? "text-amber-400" : "text-[var(--muted-text)]"}`}
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
          aria-label="status"
          title="mudar status"
          className="h-7 border-[var(--line)] bg-[var(--field)] px-2 text-[11px] text-[var(--muted-text)] hover:border-zinc-600 hover:text-[var(--text)]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_ORDER.map((k) => (
            <SelectItem key={k} value={k} className="py-1 text-xs">
              {STATUS_LABEL[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="button" variant="ghost" size="icon-xs" onClick={onEdit} title="editar" aria-label="editar">
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
  );
}