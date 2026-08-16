import { Modal } from "@/components/client/Modal";
import { useT } from "@/hooks/useT";
import type { Task, TaskPatch } from "@/lib/types";

export interface TaskEditModalProps {
  task: Task;
  onSubmit: (patch: TaskPatch) => void;
  onCancel: () => void;
}

export function TaskEditModal({ task, onSubmit, onCancel }: TaskEditModalProps) {
  const { t } = useT();
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
      title={t("editar tarefa")}
      submitLabel={t("salvar")}
      fields={[
        { key: "text", label: t("tarefa"), value: task.text },
        {
          key: "prio",
          label: t("prioridade"),
          type: "select",
          value: task.prio,
          options: [
            { value: 1, label: t("P1 — urgente") },
            { value: 2, label: t("P2 — em breve") },
            { value: 3, label: t("P3 — normal") },
          ],
        },
        { key: "due", label: t("vencimento"), type: "date", value: task.due },
        { key: "note", label: t("nota"), type: "textarea", value: task.note, placeholder: t("detalhe opcional…") },
        { key: "blocked", label: t("marcar como bloqueada / stuck"), type: "checkbox", value: task.blocked },
      ]}
      onSubmit={submit}
      onCancel={onCancel}
    />
  );
}
