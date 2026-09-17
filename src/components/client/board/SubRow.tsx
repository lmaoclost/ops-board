"use client";

import { useState } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/hooks/useT";
import { isDueSoon, isOverdue } from "@/lib/date";
import { linkify } from "@/lib/escape";
import { addSub, makeSub, mapSubs, removeSub } from "@/lib/subtasks";
import { NEXT_PRIO } from "@/lib/tokens";
import type { Status, SubTask, TaskPatch } from "@/lib/types";
import { StatusLed, DueBadge, PrioChip } from "./badges";
import { DropZone, NestZone } from "./DropZones";
import { TaskActions } from "./TaskActions";

export function SubRow({
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task:${sub.id}`,
  });
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
    <div
      ref={setNodeRef}
      data-testid={`sub-row:${sub.id}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? "none" : transition,
      }}
      className={isDragging ? "opacity-90" : undefined}
    >
      <DropZone droppableId={`task:${sub.id}:sib-ab`} />
      <div
        className="group flex items-center gap-2.5 py-1 pr-2"
        style={{ paddingLeft: 26 + depth * 30 }}
      >
        <button
          type="button"
          aria-label={t("arrastar tarefa p/ reordenar")}
          title={t("arrastar tarefa p/ reordenar")}
          className={`flex h-5 w-4 shrink-0 cursor-grab touch-none items-center justify-center text-[var(--dimmer)] opacity-40 transition-colors hover:text-[var(--text)] active:cursor-grabbing ${isDragging ? "opacity-100" : ""}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} strokeWidth={2.5} />
        </button>
        {depth === 0 && (
          <button
            type="button"
            onClick={() => setAddingSub(true)}
            title={`${t("nova sub-tarefa")} ${sub.text}`}
            aria-label={`${t("nova sub-tarefa")} ${sub.text}`}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[var(--dimmer)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            +
          </button>
        )}
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          onClick={() =>
            onUpdate({
              subs: mapSubs(subs, sub.id, (s) => ({
                ...s,
                status: s.status === "done" ? "todo" : "done",
              })),
            })
          }
          aria-label={`sub-tarefa ${sub.text}`}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[var(--hover)]"
        >
          <StatusLed status={sub.status} blocked={sub.blocked} size="xs" />
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
        ) : depth === 0 ? (
          <NestZone droppableId={`task:${sub.id}:nest`}>
            <SubText sub={sub} done={done} />
          </NestZone>
        ) : (
          <SubText sub={sub} done={done} />
        )}
        {sub.blocked && (
          <Badge
            variant="destructive"
            title={sub.blockedReason || undefined}
            className="rounded-[4px] px-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
          >
            {t("bloqueada")}
          </Badge>
        )}
        <PrioChip
          prio={sub.prio}
          onClick={() =>
            onUpdate({
              subs: mapSubs(subs, sub.id, (s) => ({
                ...s,
                prio: NEXT_PRIO[s.prio],
              })),
            })
          }
          ariaLabel={t("prioridade: clique pra mudar")}
        />
        {sub.due && (
          <DueBadge
            due={sub.due}
            overdue={overdue}
            dueSoon={dueSoon}
            size="xs"
            dim="text-[var(--dimmer)]"
          />
        )}
        <TaskActions
          task={sub}
          onStatusChange={(s: Status) =>
            onUpdate({
              subs: mapSubs(subs, sub.id, (x) => ({ ...x, status: s })),
            })
          }
          onEdit={() => onEdit(sub)}
          onDelete={() => onUpdate({ subs: removeSub(subs, sub.id) })}
          onUpdate={(patch) =>
            onUpdate({
              subs: mapSubs(subs, sub.id, (x) => ({ ...x, ...patch })),
            })
          }
        />
      </div>
      <DropZone droppableId={`task:${sub.id}:sib-ae`} />
      {sub.subs.length > 0 && (
        <div className="pb-1">
          <SortableContext
            items={sub.subs.map((c) => `task:${c.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {sub.subs.map((c) => (
              <SubRow
                key={c.id}
                subs={subs}
                sub={c}
                depth={depth + 1}
                onUpdate={onUpdate}
                onEdit={onEdit}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

function SubText({ sub, done }: { sub: SubTask; done: boolean }) {
  return (
    <span className="min-w-0 flex-1 text-[12px] leading-snug break-words">
      <span
        className={
          done
            ? "text-[var(--dim)] line-through decoration-[var(--line)]"
            : "text-[var(--muted-text)]"
        }
        dangerouslySetInnerHTML={{ __html: linkify(sub.text) }}
      />
      {sub.note && (
        <span
          className="text-[var(--dimmer)]"
          dangerouslySetInnerHTML={{ __html: ` — ${linkify(sub.note)}` }}
        />
      )}
    </span>
  );
}
