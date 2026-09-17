"use client";

import { memo, useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useT } from "@/hooks/useT";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import dynamic from "next/dynamic";
import { isDueSoon, isOverdue } from "@/lib/date";
import { linkify } from "@/lib/escape";
import { makeSub, mapSubs } from "@/lib/subtasks";
import { StatusLed, DueBadge, PrioChip } from "./badges";
import { DropZone, NestZone } from "./DropZones";
import { SubRow } from "./SubRow";
import { TaskActions } from "./TaskActions";
import type { Status, SubTask, Task, TaskPatch } from "@/lib/types";

const TaskEditModal = dynamic(() =>
  import("./TaskEditModal").then((m) => m.TaskEditModal),
);

export interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onPrioCycle: () => void;
  onStatusChange: (status: Status) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (patch: TaskPatch) => void;
  dragHandle?: React.ReactNode;
}

// --- linha principal da tarefa ---

export const TaskRow = memo(function TaskRow({
  task,
  onToggle,
  onPrioCycle,
  onStatusChange,
  onEdit,
  onDelete,
  onUpdate,
  dragHandle,
}: TaskRowProps) {
  const { t } = useT();
  const [addingSub, setAddingSub] = useState(false);
  const [subDraft, setSubDraft] = useState("");
  const [editingSub, setEditingSub] = useState<SubTask | null>(null);
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
      <DropZone droppableId={`task:${task.id}:sib-ab`} />
      <div className="flex items-center gap-0.5">
        {dragHandle}
        <div className="min-w-0 flex-1">
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
              <StatusLed
                status={task.status}
                blocked={task.blocked}
                done={done}
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
              <NestZone droppableId={`task:${task.id}:nest`}>
                <span className="min-w-0 flex-1 text-[13px] leading-snug break-words text-[var(--text)]">
                  <span
                    className={
                      done
                        ? "text-[var(--dim)] line-through decoration-[var(--line)]"
                        : ""
                    }
                    dangerouslySetInnerHTML={{ __html: linkify(task.text) }}
                  />
                  {task.note && (
                    <span
                      className="text-[var(--dim)]"
                      dangerouslySetInnerHTML={{
                        __html: ` — ${linkify(task.note)}`,
                      }}
                    />
                  )}
                  {task.repeat && (
                    <span
                      className="shrink-0 text-[10px] font-semibold text-[var(--dim)]"
                      title={t("recorrência")}
                    >
                      ↻ {t(task.repeat)}
                    </span>
                  )}
                </span>
              </NestZone>
            )}
            {task.blocked && (
              <Badge
                variant="destructive"
                className="rounded-[4px] px-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
                title={task.blockedReason || undefined}
              >
                {t("bloqueada")}
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger
                render={
                  <PrioChip
                    prio={task.prio}
                    onClick={onPrioCycle}
                    ariaLabel={t("prioridade: clique pra mudar")}
                    className="px-1.5 py-0.5 text-[11px]"
                  />
                }
              />
              <TooltipContent side="top">
                {t("prioridade: clique pra mudar")}
              </TooltipContent>
            </Tooltip>
            {task.due && (
              <DueBadge due={task.due} overdue={overdue} dueSoon={dueSoon} />
            )}
            <TaskActions
              task={task}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          </div>
        </div>
      </div>
      <DropZone droppableId={`task:${task.id}:sib-ae`} />
      {/* --- subs e modais --- */}
      {task.subs.length > 0 && (
        <div className="pb-1">
          <SortableContext
            items={task.subs.map((s) => `task:${s.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {task.subs.map((s) => (
              <SubRow
                key={s.id}
                subs={task.subs}
                sub={s}
                depth={0}
                onUpdate={onUpdate}
                onEdit={setEditingSub}
              />
            ))}
          </SortableContext>
        </div>
      )}
      {editingSub && (
        <TaskEditModal
          task={editingSub}
          isSub
          onSubmit={(patch) => {
            onUpdate({
              subs: mapSubs(task.subs, editingSub.id, (x) => ({
                ...x,
                ...patch,
              })),
            });
            setEditingSub(null);
          }}
          onCancel={() => setEditingSub(null)}
        />
      )}
    </div>
  );
});
