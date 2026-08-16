import { useState } from "react";
import { Modal } from "@/components/client/Modal";
import { Label } from "@/components/ui/label";
import { uid } from "@/lib/uid";
import type { SubTask, Task, TaskPatch } from "@/lib/types";

export interface TaskEditModalProps {
  task: Task;
  onSubmit: (patch: TaskPatch) => void;
  onCancel: () => void;
}

export function TaskEditModal({ task, onSubmit, onCancel }: TaskEditModalProps) {
  const [subs, setSubs] = useState<SubTask[]>(task.subs);
  const [newSub, setNewSub] = useState("");

  const addSub = () => {
    const text = newSub.trim();
    if (!text) return;
    setSubs((prev) => [...prev, { id: uid(), text, done: false }]);
    setNewSub("");
  };

  const toggleSub = (id: string) =>
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));

  const removeSub = (id: string) => setSubs((prev) => prev.filter((s) => s.id !== id));

  const submit = (v: Record<string, string | boolean>) => {
    onSubmit({
      text: String(v.text).trim(),
      note: String(v.note).trim(),
      blocked: Boolean(v.blocked),
      prio: (Number(v.prio) || 3) as Task["prio"],
      due: String(v.due ?? ""),
      subs,
    });
  };

  return (
    <Modal
      title="editar tarefa"
      submitLabel="salvar"
      fields={[
        { key: "text", label: "tarefa", value: task.text },
        {
          key: "prio",
          label: "prioridade",
          type: "select",
          value: task.prio,
          options: [
            { value: 1, label: "P1 — urgente" },
            { value: 2, label: "P2 — em breve" },
            { value: 3, label: "P3 — normal" },
          ],
        },
        { key: "due", label: "vencimento", type: "date", value: task.due },
        { key: "note", label: "nota", type: "textarea", value: task.note, placeholder: "detalhe opcional…" },
        { key: "blocked", label: "marcar como bloqueada / stuck", type: "checkbox", value: task.blocked },
      ]}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] p-2.5">
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
                  aria-checked={s.done}
                  aria-label={`sub-tarefa ${s.text}`}
                  onClick={() => toggleSub(s.id)}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[9px] ${
                    s.done ? "border-[var(--fired)] bg-[var(--fired)] text-primary-foreground" : "border-[var(--line-soft)]"
                  }`}
                >
                  {s.done ? "✓" : ""}
                </button>
                <span className={`min-w-0 flex-1 text-xs ${s.done ? "line-through text-[var(--dim)]" : "text-[var(--text)]"}`}>
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