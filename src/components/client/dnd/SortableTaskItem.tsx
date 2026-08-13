import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";
import { TaskRow } from "@/components/client/board/TaskRow";

interface SortableTaskItemProps {
  task: Task;
  onToggle: () => void;
  onPrioCycle: () => void;
  onStatusChange: (status: Task["status"]) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableTaskItem({ task, onToggle, onPrioCycle, onStatusChange, onEdit, onDelete }: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task:${task.id}`,
    disabled: false,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-40" : ""}
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
      />
    </div>
  );
}