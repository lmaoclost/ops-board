"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Task, TaskPatch } from "@/lib/types";
import { useT } from "@/hooks/useT";
import { TaskRow } from "@/components/client/board/TaskRow";

interface SortableTaskItemProps {
  task: Task;
  onToggle: () => void;
  onPrioCycle: () => void;
  onStatusChange: (status: Task["status"]) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (patch: TaskPatch) => void;
}

export const SortableTaskItem = memo(function SortableTaskItem({ task, onToggle, onPrioCycle, onStatusChange, onEdit, onDelete, onUpdate }: SortableTaskItemProps) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task:${task.id}`,
    disabled: false,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition: isDragging ? "none" : transition }}
      className={`rounded-md ${isDragging ? "opacity-90 shadow-lg ring-2 ring-[var(--fired)]/70 z-10" : ""}`}
    >
      <TaskRow
        task={task}
        onToggle={onToggle}
        onPrioCycle={onPrioCycle}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onUpdate={onUpdate}
        dragHandle={
          <button
            type="button"
            aria-label={t("arrastar tarefa p/ reordenar")}
            title={t("arrastar tarefa p/ reordenar")}
            className="flex h-6 shrink-0 cursor-grab touch-none items-center text-[var(--dimmer)] opacity-40 transition-colors hover:text-[var(--text)] active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={12} strokeWidth={2.5} />
          </button>
        }
      />
    </div>
  );
});