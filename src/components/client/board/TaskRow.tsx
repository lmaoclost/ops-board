import { useState } from "react";
import { CircleSlashIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/hooks/useT";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/client/Modal";
import { ConfirmDelete } from "@/components/client/ConfirmDelete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isDueSoon, isOverdue, fmtDate } from "@/lib/date";
import { linkify } from "@/lib/escape";
import { addSub, makeSub, mapSubs, removeSub } from "@/lib/subtasks";
import { PRIO_KEYS, STATUS_ORDER, type Prio, type Status, type SubTask, type Task, type TaskPatch } from "@/lib/types";
import { TaskEditModal } from "./TaskEditModal";

export interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onPrioCycle: () => void;
  onStatusChange: (status: Status) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (patch: TaskPatch) => void;
}

export const NEXT_PRIO: Record<Prio, Prio> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 1 };

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
  4: "text-[var(--muted-text)] border-[var(--line)]",
  5: "text-[var(--dimmer)] border-[var(--line-soft)]",
};

function SubRow({
  subs,
  sub,
  depth,
  onUpdate,
  onEdit,
}: {
  subs: SubTask[];
  sub: SubTask;
  depth: number;
  onUpdate: (patch: TaskPatch) => void;
  onEdit: (s: SubTask) => void;
}) {
  const { t } = useT();
  const [addingSub, setAddingSub] = useState(false);
  const [subDraft, setSubDraft] = useState("");
  const overdue = isOverdue(sub.due, sub.status);
  const dueSoon = isDueSoon(sub.due, sub.status);
  const done = sub.status === "done";

  const submitSub = () => {
    const text = subDraft.trim();
    if (text) onUpdate({ subs: addSub(subs, sub.id, makeSub(text)) });
    setSubDraft("");
    setAddingSub(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2.5 py-1 pr-2" style={{ paddingLeft: 48 + depth * 16 }}>
        <button
          type="button"
          onClick={() => setAddingSub(true)}
          title={`${t("nova sub-tarefa")} ${sub.text}`}
          aria-label={`${t("nova sub-tarefa")} ${sub.text}`}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[var(--dimmer)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
        >
          +
        </button>
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          onClick={() => onUpdate({ subs: mapSubs(subs, sub.id, (s) => ({ ...s, status: s.status === "done" ? "todo" : "done" })) })}
          aria-label={`sub-tarefa ${sub.text}`}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--hover)]"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${sub.blocked ? "bg-[var(--gave)]" : LED[sub.status]} transition-transform group-hover:scale-110`}
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
            aria-label={`${t("nova sub-tarefa")} ${sub.text}`}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded border border-[var(--line)] bg-[var(--field)] px-1.5 py-1 text-[12px] text-[var(--text)] outline-none focus:border-[var(--fired)]"
          />
        ) : (
          <span
            role="button"
            tabIndex={0}
            onClick={() => onEdit(sub)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onEdit(sub);
              }
            }}
            className="min-w-0 flex-1 cursor-pointer text-[12px] leading-snug break-words"
          >
            <span
              className={done ? "text-[var(--dim)] line-through decoration-[var(--line)]" : "text-[var(--muted-text)]"}
              dangerouslySetInnerHTML={{ __html: linkify(sub.text) }}
            />
            {sub.note && (
              <span
                className="text-[var(--dimmer)]"
                dangerouslySetInnerHTML={{ __html: ` — ${linkify(sub.note)}` }}
              />
            )}
          </span>
        )}
        {sub.blocked && (
          <Badge variant="destructive" className="rounded-[4px] px-1.5 text-[11px] font-bold uppercase tracking-[0.08em]">
            {t('bloqueada')}
          </Badge>
        )}
        <button
          type="button"
          onClick={() => onUpdate({ subs: mapSubs(subs, sub.id, (s) => ({ ...s, prio: NEXT_PRIO[s.prio] })) })}
          aria-label={t("prioridade: clique pra mudar")}
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10.5px] font-bold ${PRIO_CLS[sub.prio]}`}
        >
          {PRIO_KEYS[sub.prio]}
        </button>
        {sub.due &&
          (overdue ? (
            <Badge
              variant="destructive"
              className="rounded-[4px] px-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em]"
              title={t("vencimento N").replace("N", sub.due)}
            >
              {fmtDate(sub.due)} {t("vencida")}
            </Badge>
          ) : (
            <span
              className={`shrink-0 text-[10.5px] font-semibold ${dueSoon ? "text-[var(--warn)]" : "text-[var(--dimmer)]"}`}
              title={t("vencimento N").replace("N", sub.due)}
            >
              {fmtDate(sub.due)}
            </span>
          ))}
        <button
          type="button"
          onClick={() => onUpdate({ subs: removeSub(subs, sub.id) })}
          title={`${t("remover sub-tarefa")} ${sub.text}`}
          aria-label={`${t("remover sub-tarefa")} ${sub.text}`}
          className="shrink-0 text-[var(--dimmer)] transition-colors hover:text-[var(--fired)]"
        >
          ×
        </button>
      </div>
      {sub.subs.length > 0 && (
        <div className="pb-1">
          {sub.subs.map((c) => (
            <SubRow key={c.id} subs={subs} sub={c} depth={depth + 1} onUpdate={onUpdate} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskRow({ task, onToggle, onPrioCycle, onStatusChange, onEdit, onDelete, onUpdate }: TaskRowProps) {
  const { t, status } = useT();
  const [addingSub, setAddingSub] = useState(false);
  const [subDraft, setSubDraft] = useState("");
  const [editingSub, setEditingSub] = useState<SubTask | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const overdue = isOverdue(task.due, task.status);
  const dueSoon = isDueSoon(task.due, task.status);
  const done = task.status === "done";

  const submitSub = () => {
    const text = subDraft.trim();
    if (text) onUpdate({ subs: [...task.subs, makeSub(text)] });
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
            {task.repeat && (
              <span className="shrink-0 text-[10px] font-semibold text-[var(--dim)]" title={t("recorrência")}>
                ↻ {t(task.repeat)}
              </span>
            )}
          </span>
        )}
        {task.blocked && (
          <Badge variant="destructive" className="rounded-[4px] px-1.5 text-[11px] font-bold uppercase tracking-[0.08em]" title={task.blockedReason || undefined}>
            {t('bloqueada')}
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
          <TooltipContent side="top">{t("prioridade: clique pra mudar")}</TooltipContent>
        </Tooltip>
        {task.due &&
          (overdue ? (
            <Badge
              variant="destructive"
              className="rounded-[4px] px-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
              title={t("vencimento N").replace("N", task.due)}
            >
              {fmtDate(task.due)} {t("vencida")}
            </Badge>
          ) : (
            <span
              className={`shrink-0 text-[10.5px] font-semibold ${dueSoon ? "text-[var(--warn)]" : "text-[var(--muted-text)]"}`}
              title={t("vencimento N").replace("N", task.due)}
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
            className="hidden h-7 border-[var(--line)] bg-[var(--field)] px-2 text-[11px] text-[var(--muted-text)] hover:border-[var(--muted-text)] hover:text-[var(--text)] sm:flex"
          >
            <SelectValue>{status(task.status)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_ORDER.map((k) => (
              <SelectItem key={k} value={k} label={status(k)} className="py-1 text-xs">
                {status(k)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => (task.blocked ? onUpdate({ blocked: false }) : setBlocking(true))}
          title={t(task.blocked ? "desbloquear tarefa" : "bloquear tarefa")}
          aria-label={t(task.blocked ? "desbloquear tarefa" : "bloquear tarefa")}
          className={`hidden transition-opacity sm:inline-flex ${task.blocked ? "text-[var(--gave)] opacity-100 hover:text-[var(--gave)]" : "text-[var(--dimmer)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-[var(--gave)]"}`}
        >
          <CircleSlashIcon />
        </Button>
        <Button type="button" variant="ghost" size="icon-xs" onClick={onEdit} title={t("editar")} aria-label={t("editar")} className="hidden sm:inline-flex">
          ✎
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="icon-xs"
          onClick={() => setConfirmingDelete(true)}
          title="excluir"
          aria-label="excluir"
          className="hidden sm:inline-flex"
        >
          ×
        </Button>
        <span className="shrink-0 sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  title={t("ações da tarefa")}
                  aria-label={t("ações da tarefa")}
                >
                  ⋯
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="bg-[var(--panel-2)] text-[var(--text)]">
              {STATUS_ORDER.map((k) => (
                <DropdownMenuItem key={k} className="text-xs" onClick={() => onStatusChange(k)}>
                  {status(k)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-[var(--line)]" />
              <DropdownMenuItem
                className="text-xs"
                onClick={() => (task.blocked ? onUpdate({ blocked: false }) : setBlocking(true))}
              >
                {t(task.blocked ? "desbloquear tarefa" : "bloquear tarefa")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs" onClick={onEdit}>
                {t("editar")}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" className="text-xs" onClick={() => setConfirmingDelete(true)}>
                {t("excluir")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>
      {task.subs.length > 0 && (
        <div className="pb-1">
          {task.subs.map((s) => (
            <SubRow key={s.id} subs={task.subs} sub={s} depth={0} onUpdate={onUpdate} onEdit={setEditingSub} />
          ))}
        </div>
      )}
      {editingSub && (
        <TaskEditModal
          task={editingSub}
          isSub
          onSubmit={(patch) => {
            onUpdate({ subs: mapSubs(task.subs, editingSub.id, (x) => ({ ...x, ...patch })) });
            setEditingSub(null);
          }}
          onCancel={() => setEditingSub(null)}
        />
      )}
      {blocking && (
        <Modal
          title={t("por que foi bloqueado?")}
          submitLabel={t("salvar")}
          fields={[
            { key: "blockedReason", label: t("motivo do bloqueio"), type: "textarea", value: task.blockedReason ?? "" },
          ]}
          onSubmit={(v) => {
            onUpdate({ blocked: true, blockedReason: String(v.blockedReason ?? "").trim() });
            setBlocking(false);
          }}
          onCancel={() => setBlocking(false)}
        />
      )}
      {confirmingDelete && (
        <ConfirmDelete
          title={t("excluir tarefa?")}
          message={t("excluir_tarefa_txt")}
          onConfirm={() => {
            setConfirmingDelete(false);
            onDelete();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}