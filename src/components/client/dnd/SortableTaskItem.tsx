import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, TaskPatch } from "@/lib/types";
import { TaskRow } from "@/components/client/board/TaskRow";

interface SortableTaskItemProps {
  task: Task;
  onToggle: () => void;
  onPrioCycle: () => void;
  onStatusChange: (status: Task["status"]) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (patch: TaskPatch) => void;
  onSaveTemplate: () => void;
  blockedByText?: string;
}

export function SortableTaskItem({ task, onToggle, onPrioCycle, onStatusChange, onEdit, onDelete, onUpdate, onSaveTemplate, blockedByText }: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task:${task.id}`,
    disabled: false,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition: isDragging ? "none" : transition }}
      className={`rounded-md ${isDragging ? "opacity-90 shadow-lg ring-2 ring-[var(--fired)]/70 z-10" : ""}`}
      {...attributes}
      {...listeners}
    >
      <TaskRow
        task={task}
        onToggle={onToggle}
        onPrioCycle={onPrioCycle}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onUpdate={onUpdate}
        onSaveTemplate={onSaveTemplate}
        blockedByText={blockedByText}
      />
    </div>
  );
}