import { useState } from "react";
import { GripVertical } from "lucide-react";
import { useT } from "@/hooks/useT";
import type { TKey } from "@/lib/i18n";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Modal } from "@/components/client/Modal";
import { ConfirmDelete } from "@/components/client/ConfirmDelete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isDueSoon, isOverdue, fmtDate } from "@/lib/date";
import { PRIO_CLS, PRIO_KEYS, type AddSectionInput, type Project, type ProjectPatch } from "@/lib/types";
import {
  Section,
  type SectionTaskActions as SectionLevelTaskActions,
} from "./Section";
import type { SectionLevelActions, TaskLevelActions } from "./Board";
import type { Filters } from "@/lib/filter";

export interface ProjectCardProps {
  project: Project;
  collectActions: (projectId: string) => {
    sectionActions: SectionLevelActions;
    taskActions: TaskLevelActions;
  };
  onAddSection: (input: AddSectionInput) => void;
  onEdit: (id: string, patch: ProjectPatch) => void;
  onDelete: (id: string) => void;
  onToggleArchive: () => void;
  onCyclePrio: () => void;
  onToggleCollapse: () => void;
  prioSort?: boolean;
  filters?: Filters;
}

type ModalState =
  { kind: "edit" } | { kind: "add-section" } | { kind: "block" } | { kind: "delete" } | null;

export function ProjectCard({
  project,
  collectActions,
  onAddSection,
  onEdit,
  onDelete,
  onToggleArchive,
  onCyclePrio,
  onToggleCollapse,
  prioSort,
  filters,
}: ProjectCardProps) {
  const { t } = useT();
  const [modal, setModal] = useState<ModalState>(null);
  const actions = collectActions(project.id);
  const overdue = isOverdue(project.due, "todo");
  const dueSoon = isDueSoon(project.due, "todo");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `project:${project.id}`,
  });

  const submitProject = (v: Record<string, string | boolean>) => {
    setModal(null);
    if (!String(v.title).trim()) return;
    onEdit(project.id, {
      title: String(v.title).trim(),
      blocked: project.blocked,
      due: String(v.due ?? ""),
      note: String(v.note ?? ""),
    });
  };

  const submitBlock = (v: Record<string, string | boolean>) => {
    setModal(null);
    onEdit(project.id, {
      title: project.title,
      blocked: true,
      blockedReason: String(v.blockedReason ?? "").trim(),
    });
  };

  const submitSection = (v: Record<string, string | boolean>) => {
    setModal(null);
    if (String(v.title).trim())
      onAddSection({ title: String(v.title).trim(), notes: String(v.notes ?? "") });
  };

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition: isDragging ? "none" : transition }}
      className={`rounded-lg border border-[var(--line)] bg-[var(--panel)] ${isDragging ? "opacity-90 shadow-lg ring-2 ring-[var(--fired)]/70 z-10" : ""}`}
    >
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-3.5 py-2.5">
        <button
          type="button"
          aria-label={t("arrastar projeto p/ reordenar")}
          title={t("arrastar projeto p/ reordenar")}
          className="flex shrink-0 cursor-grab touch-none items-center text-[var(--dimmer)] transition-colors hover:text-[var(--text)] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="shrink-0 rounded border border-[var(--line)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--dim)] hover:bg-[var(--panel-3)]"
          title={
            project.collapsed ? t("expandir projeto") : t("minimizar projeto")
          }
          aria-label={
            project.collapsed ? t("expandir projeto") : t("minimizar projeto")
          }
        >
          {project.collapsed ? "▶" : "▼"}
        </button>
        <span className="font-bold text-[var(--fired)]">##</span>
        <h2 className="break-words text-[13px] font-bold tracking-wide text-[var(--text)]">
          {project.title}
        </h2>
        <button
          type="button"
          onClick={onCyclePrio}
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${PRIO_CLS[project.prio]}`}
          title={t("prioridade do projeto (clique pra mudar)")}
          aria-label={t(
            `prioridade do projeto ${PRIO_KEYS[project.prio]}` as TKey,
          )}
        >
          {PRIO_KEYS[project.prio]}
        </button>
        {project.due && (
          <span
            className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${overdue ? "border-[var(--fired)] text-[var(--fired)]" : dueSoon ? "border-[var(--warn)] text-[var(--warn)]" : "border-[var(--line)] text-[var(--dim)]"}`}
            title={`${t("vencimento N").replace("N", fmtDate(project.due))}`}
          >
            {fmtDate(project.due)}
          </span>
        )}
        {project.blocked && (
          <Badge
            variant="destructive"
            className="rounded-[4px] px-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
            title={project.blockedReason || undefined}
          >
            {t("stuck")}
          </Badge>
        )}
        {project.archived && (
          <Badge
            variant="outline"
            className="rounded-[4px] px-1.5 text-[11px] font-bold uppercase tracking-[0.08em]"
          >
            {t("arquivado")}
          </Badge>
        )}
        <span className="ml-auto flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  title={t("ações do projeto")}
                  aria-label={t("ações do projeto")}
                >
                  ⋯
                </Button>
              }
            />
            <DropdownMenuContent
              align="end"
              className="bg-[var(--panel-2)] text-[var(--text)]"
            >
              <DropdownMenuItem
                className="text-xs"
                onClick={() => setModal({ kind: "add-section" })}
              >
                {t("adicionar seção")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs"
                onClick={() => setModal({ kind: "edit" })}
              >
                {t("editar projeto")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs"
                onClick={() =>
                  project.blocked
                    ? onEdit(project.id, { title: project.title, blocked: false })
                    : setModal({ kind: "block" })
                }
              >
                {project.blocked
                  ? t("desmarcar stuck / bloqueado")
                  : t("marcar como stuck / bloqueado")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs" onClick={onToggleArchive}>
                {project.archived
                  ? t("desarquivar projeto")
                  : t("arquivar projeto")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--line)]" />
              <DropdownMenuItem
                variant="destructive"
                className="text-xs"
                onClick={() => setModal({ kind: "delete" })}
              >
                {t("excluir projeto")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      {!project.collapsed && project.note && (
        <div className="whitespace-pre-wrap break-words border-b border-[var(--line)] px-3.5 py-1.5 text-[11.5px] leading-relaxed text-[var(--muted-text)]">
          {project.note}
        </div>
      )}

      {!project.collapsed && project.sections.length > 0 && (
        <SortableContext
          items={project.sections.map((s) => `section:${project.id}:${s.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {project.sections.map((s) => {
            const secTaskActions: SectionLevelTaskActions = {
              onToggle: (tid) => actions.taskActions.onToggle(s.id, tid),
              onPrioCycle: (tid) => actions.taskActions.onPrioCycle(s.id, tid),
              onStatusChange: (tid, status) =>
                actions.taskActions.onStatusChange(s.id, tid, status),
              onEdit: (tid, patch) =>
                actions.taskActions.onEdit(s.id, tid, patch),
              onDelete: (tid) => actions.taskActions.onDelete(s.id, tid),
              onUpdate: (tid, patch) =>
                actions.taskActions.onUpdate(s.id, tid, patch),
            };
            return (
              <Section
                key={s.id}
                projectId={project.id}
                section={s}
                onToggleSection={() => actions.sectionActions.onToggle(s.id)}
                onAddTask={(text) =>
                  actions.sectionActions.onAddTask(s.id, text)
                }
                onEdit={(patch) => actions.sectionActions.onEdit(s.id, patch)}
                onDelete={() => actions.sectionActions.onDelete(s.id)}
                taskActions={secTaskActions}
                prioSort={prioSort}
                filters={filters}
              />
            );
          })}
        </SortableContext>
      )}

      {modal?.kind === "edit" && (
        <Modal
          title={t("editar projeto")}
          submitLabel={t("salvar")}
          fields={[
            { key: "title", label: t("título"), value: project.title, required: true },
            {
              key: "due",
              label: t("vencimento"),
              type: "date",
              value: project.due,
            },
            {
              key: "note",
              label: t("nota do projeto"),
              type: "textarea",
              value: project.note,
            },
          ]}
          onSubmit={submitProject}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === "block" && (
        <Modal
          title={t("por que foi bloqueado?")}
          submitLabel={t("salvar")}
          fields={[
            {
              key: "blockedReason",
              label: t("motivo do bloqueio"),
              type: "textarea",
              value: project.blockedReason,
            },
          ]}
          onSubmit={submitBlock}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === "add-section" && (
        <Modal
          title={t("nova seção")}
          submitLabel={t("criar")}
          fields={[
            { key: "title", label: t("título"), value: "", required: true },
            { key: "notes", label: t("nota"), type: "textarea", value: "" },
          ]}
          onSubmit={submitSection}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === "delete" && (
        <ConfirmDelete
          title={t("excluir projeto?")}
          message={t("excluir_projeto_txt").replace(
            "{n}",
            String(project.sections.reduce((n, s) => n + s.tasks.length, 0)),
          )}
          onConfirm={() => {
            setModal(null);
            onDelete(project.id);
          }}
          onCancel={() => setModal(null)}
        />
      )}
    </section>
  );
}
