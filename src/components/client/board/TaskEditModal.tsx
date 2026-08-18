import { useEffect, useRef, useState } from "react";
import { Modal, type ModalField } from "@/components/client/Modal";
import { Label } from "@/components/ui/label";
import { useT } from "@/hooks/useT";
import { makeSub } from "@/lib/subtasks";
import type { Project, Repeat, Status, SubTask, Task, TaskPatch } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TaskEditModalProps {
  task?: Task | SubTask;
  isSub?: boolean;
  status?: Status;
  projetos?: Project[];
  focusSubs?: boolean;
  onSubmit: (patch: TaskPatch, pid?: string) => void;
  onCancel: () => void;
}

export function TaskEditModal({ task, isSub, status, projetos, focusSubs, onSubmit, onCancel }: TaskEditModalProps) {
  const { t, status: statusLabel } = useT();
  const isCreate = status !== undefined;
  const taskFields = (task as Task | undefined);
  const [subs, setSubs] = useState<SubTask[]>(task?.subs ?? []);
  const [newSub, setNewSub] = useState("");
  const [pid, setPid] = useState<string | null>(projetos?.[0]?.id ?? null);
  const subsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!focusSubs) return;
    const el = subsRef.current;
    const scrollId = window.setTimeout(() => {
      subsRef.current?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    }, 50);
    const clearId = window.setTimeout(() => el?.removeAttribute("data-focus"), 1600);
    return () => {
      window.clearTimeout(scrollId);
      window.clearTimeout(clearId);
    };
  }, [focusSubs]);

  const addSub = () => {
    const text = newSub.trim();
    if (!text) return;
    setSubs((prev) => [...prev, makeSub(text)]);
    setNewSub("");
  };

  const toggleSub = (id: string) =>
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, status: s.status === "done" ? "todo" : "done" } : s)));

  const removeSub = (id: string) => setSubs((prev) => prev.filter((s) => s.id !== id));
  const submit = (v: Record<string, string | boolean>) => {
    onSubmit(
      {
        text: String(v.text).trim(),
        note: String(v.note).trim(),
        blocked: Boolean(v.blocked),
        prio: (Number(v.prio) || 3) as Task["prio"],
        due: String(v.due ?? ""),
        subs,
        ...(isSub
          ? {}
          : {
              repeat: v.repeat ? (v.repeat as Repeat) : null,
            }),
      },
      pid ?? undefined,
    );
  };

  return (
    <Modal
      title={t(isCreate ? "nova tarefa" : isSub ? "editar sub-tarefa" : "editar tarefa")}
      submitLabel={t("salvar")}
      fields={[
        { key: "text", label: t("tarefa"), value: task?.text ?? "" },
        {
          key: "prio",
          label: t("prioridade"),
          type: "select",
          value: task?.prio ?? 3,
          options: [
            { value: 1, label: t("P1 — urgente") },
            { value: 2, label: t("P2 — em breve") },
            { value: 3, label: t("P3 — normal") },
          ],
        },
        { key: "due", label: t("vencimento"), type: "date", value: task?.due ?? "" },
        ...(!isSub
          ? ([
              {
                key: "repeat",
                label: t("recorrência"),
                type: "select",
                value: taskFields?.repeat ?? "",
                options: [
                  { value: "", label: t("não repete") },
                  { value: "daily", label: t("diária") },
                  { value: "weekly", label: t("semanal") },
                  { value: "monthly", label: t("mensal") },
                ],
              },
            ] satisfies ModalField[])
          : []),
        { key: "note", label: t("nota"), type: "textarea", value: task?.note ?? "", placeholder: t("detalhe opcional…") },
        { key: "blocked", label: t("marcar como bloqueada / stuck"), type: "checkbox", value: task?.blocked ?? false },
      ]}
      topChildren={
        isCreate ? (
          <>
            <div>
              <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-text)]">
                {t("status")}
              </Label>
              <div className="text-xs text-[var(--text)]">{statusLabel(status)}</div>
            </div>
            <div>
              <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-text)]">
                {t("projeto")}
              </Label>
              <Select value={pid} onValueChange={setPid} disabled={!projetos?.length}>
                <SelectTrigger
                  aria-label={t("projeto")}
                  className="w-full border-[var(--line)] bg-[var(--field)] px-2 text-xs text-[var(--text)] hover:border-[var(--muted-text)]"
                >
                  <SelectValue>{projetos?.find((p) => p.id === pid)?.title ?? t("projeto")}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(projetos ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id} className="py-1 text-xs">
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        ) : undefined
      }
      onSubmit={submit}
      onCancel={onCancel}
    >
      <div
        ref={subsRef}
        data-testid="subs-section"
        data-focus={focusSubs ? "" : undefined}
        className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-2.5"
      >
        <Label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-text)]">
          sub-tarefas
        </Label>
        {subs.length > 0 && (
          <ul className="mb-2 flex flex-col gap-1">
            {subs.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={s.status === "done"}
                  aria-label={`sub-tarefa ${s.text}`}
                  onClick={() => toggleSub(s.id)}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] ${
                    s.status === "done" ? "border-[var(--fired)] bg-[var(--fired)] text-primary-foreground" : "border-[var(--line-soft)]"
                  }`}
                >
                  {s.status === "done" ? "✓" : ""}
                </button>
                <span className={`min-w-0 flex-1 text-xs ${s.status === "done" ? "line-through text-[var(--dim)]" : "text-[var(--text)]"}`}>
                  {s.text}
                </span>
                <button
                  type="button"
                  onClick={() => removeSub(s.id)}
                  className="text-[10px] text-[var(--dimmer)] hover:text-[var(--fired)]"
                  aria-label={`remover sub-tarefa ${s.text}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-1.5">
          <input
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSub();
              }
            }}
            placeholder="+ sub-tarefa"
            aria-label="nova sub-tarefa"
            className="input-line w-full"
          />
          <button
            type="button"
            onClick={addSub}
            className="shrink-0 rounded border border-[var(--line)] px-2 text-xs text-[var(--text)] hover:bg-[var(--panel-3)]"
          >
            +
          </button>
        </div>
      </div>
    </Modal>
  );
}