"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/hooks/useT";
import { isDueSoon, isOverdue } from "@/lib/date";
import { linkify } from "@/lib/escape";
import { addSub, makeSub, mapSubs, removeSub } from "@/lib/subtasks";
import { NEXT_PRIO } from "@/lib/tokens";
import type { SubTask, TaskPatch } from "@/lib/types";
import { StatusLed, DueBadge, PrioChip } from "./badges";

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
            {t("bloqueada")}
          </Badge>
        )}
        <PrioChip
          prio={sub.prio}
          onClick={() => onUpdate({ subs: mapSubs(subs, sub.id, (s) => ({ ...s, prio: NEXT_PRIO[s.prio] })) })}
          ariaLabel={t("prioridade: clique pra mudar")}
        />
        {sub.due && <DueBadge due={sub.due} overdue={overdue} dueSoon={dueSoon} size="xs" dim="text-[var(--dimmer)]" />}
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