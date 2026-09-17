"use client";

import { useDroppable, useDndContext } from "@dnd-kit/core";

export function DropZone({ droppableId }: { droppableId: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const { active } = useDndContext();
  if (!active) return null;
  return (
    <div
      ref={setNodeRef}
      data-testid={`drop-sibling-indicator`}
      className={`h-2 -my-1 relative z-10 ${isOver ? "before:absolute before:inset-x-0 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:bg-[var(--fired)] before:rounded" : ""}`}
    />
  );
}

export function NestZone({
  droppableId,
  children,
}: {
  droppableId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });
  const { active } = useDndContext();
  if (!active) return <div className="min-w-0 flex-1">{children}</div>;
  return (
    <span
      ref={setNodeRef}
      data-testid={`drop-nest-indicator`}
      className={`min-w-0 flex-1 rounded ${isOver ? "outline outline-2 outline-dashed outline-[var(--flow)]/70 bg-[var(--flow)]/5" : ""}`}
    >
      {children}
    </span>
  );
}