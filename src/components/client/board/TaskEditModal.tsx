import { Modal } from "@/components/client/Modal";
import type { Task, TaskPatch } from "@/lib/types";

export interface TaskEditModalProps {
  task: Task;
  onSubmit: (patch: TaskPatch) => void;
  onCancel: () => void;
}

export function TaskEditModal({ task, onSubmit, onCancel }: TaskEditModalProps) {
  const submit = (v: Record<string, string | boolean>) => {
    onSubmit({
      text: String(v.text).trim(),
      note: String(v.note).trim(),
      blocked: Boolean(v.blocked),
      prio: (Number(v.prio) || 3) as Task["prio"],
      due: String(v.due ?? ""),
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
    />
  );
}
