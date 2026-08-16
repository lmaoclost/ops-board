import { useState } from "react";
import { useT } from "@/hooks/useT";
import type { TKey } from "@/lib/i18n";
import { Modal } from "@/components/client/Modal";
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
import { PRIO_CLS, PRIO_KEYS, type Project, type Status, type TaskPatch } from "@/lib/types";
import { Section, type SectionTaskActions as SectionLevelTaskActions } from "./Section";
import type { SectionLevelActions, TaskLevelActions } from "./Board";
import type { Filters } from "@/lib/filter";

export interface ProjectActions {
  onAddSection: (title: string) => void;
  onRename: (id: string, title: string, blocked: boolean, due?: string) => void;
  onDelete: (id: string) => void;
}

export interface ProjectCardProps {
  project: Project;
  collectActions: (projectId: string) => {
    sectionActions: SectionLevelActions;
    taskActions: TaskLevelActions;
  };
  onAddSection: (title: string) => void;
  onRename: (id: string, title: string, blocked: boolean, due?: string) => void;
  onDelete: (id: string) => void;
  onToggleArchive: () => void;
  onCyclePrio: () => void;
  onToggleCollapse: () => void;
  prioSort?: boolean;
  filters?: Filters;
}

type ModalState =
  | { kind: "rename" }
  | { kind: "add-section" }
  | null;

export function ProjectCard({ project, collectActions, onAddSection, onRename, onDelete, onToggleArchive, onCyclePrio, onToggleCollapse, prioSort, filters }: ProjectCardProps) {
  const { t } = useT();
  const [modal, setModal] = useState<ModalState>(null);
  const actions = collectActions(project.id);
  const overdue = isOverdue(project.due, "todo");
  const dueSoon = isDueSoon(project.due, "todo");

  const submitProject = (v: Record<string, string | boolean>) => {
    setModal(null);
    if (!String(v.title).trim()) return;
onRename(project.id, String(v.title).trim(), project.blocked, String(v.due ?? ""));
  };

  const submitSection = (v: Record<string, string | boolean>) => {
    setModal(null);
    if (String(v.title).trim()) onAddSection(String(v.title).trim());
  };

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)]">
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-3.5 py-2.5">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="shrink-0 rounded border border-[var(--line)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--dim)] hover:bg-[var(--panel-3)]"
          title={project.collapsed ? t("expandir projeto") : t("minimizar projeto")}
          aria-label={project.collapsed ? t("expandir projeto") : t("minimizar projeto")}
        >
          {project.collapsed ? "▶" : "▼"}
        </button>
        <span className="font-bold text-[var(--fired)]">##</span>
        <h2 className="break-words text-[13px] font-bold tracking-wide text-[var(--text)]">{project.title}</h2>
        <button
          type="button"
          onClick={onCyclePrio}
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${PRIO_CLS[project.prio]}`}
          title={t("prioridade do projeto (clique pra mudar)")}
          aria-label={t(`prioridade do projeto ${PRIO_KEYS[project.prio]}` as TKey)}
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
          <Badge variant="destructive" className="rounded-[4px] px-1.5 text-[11px] font-bold uppercase tracking-[0.08em]">
            {t("stuck")}
          </Badge>
        )}
        {project.archived && (
          <Badge variant="outline" className="rounded-[4px] px-1.5 text-[11px] font-bold uppercase tracking-[0.08em]">
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
            <DropdownMenuContent align="end" className="bg-[var(--panel-2)] text-[var(--text)]">
              <DropdownMenuItem
                className="text-xs"
                onClick={() => setModal({ kind: "add-section" })}
              >
                {t("adicionar seção")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs"
                onClick={() => setModal({ kind: "rename" })}
              >
                {t("renomear projeto")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs"
                onClick={() => onRename(project.id, project.title, !project.blocked)}
              >
                {project.blocked ? t("desmarcar stuck / bloqueado") : t("marcar como stuck / bloqueado")}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs" onClick={onToggleArchive}>
                {project.archived ? t("desarquivar projeto") : t("arquivar projeto")}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--line)]" />
              <DropdownMenuItem
                variant="destructive"
                className="text-xs"
                onClick={() => onDelete(project.id)}
              >
                {t("excluir projeto")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      {!project.collapsed &&
        project.sections.map((s) => {
        const secTaskActions: SectionLevelTaskActions = {
          onToggle: (tid) => actions.taskActions.onToggle(s.id, tid),
          onPrioCycle: (tid) => actions.taskActions.onPrioCycle(s.id, tid),
          onStatusChange: (tid, status) => actions.taskActions.onStatusChange(s.id, tid, status),
          onEdit: (tid, patch) => actions.taskActions.onEdit(s.id, tid, patch),
          onDelete: (tid) => actions.taskActions.onDelete(s.id, tid),
        };
        return (
          <Section
            key={s.id}
            projectId={project.id}
            section={s}
            onToggleSection={() => actions.sectionActions.onToggle(s.id)}
            onAddTask={(text) => actions.sectionActions.onAddTask(s.id, text)}
            onRename={(title) => actions.sectionActions.onRename(s.id, title)}
            onDelete={() => actions.sectionActions.onDelete(s.id)}
            taskActions={secTaskActions}
            prioSort={prioSort}
            filters={filters}
          />
);
        })}

      {modal?.kind === "rename" && (
        <Modal
          title={t("editar projeto")}
          submitLabel={t("salvar")}
          fields={[
            { key: "title", label: t("título"), value: project.title },
            { key: "due", label: t("vencimento"), type: "date", value: project.due },
          ]}
          onSubmit={submitProject}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === "add-section" && (
        <Modal
          title={t("nova seção")}
          submitLabel={t("criar")}
          fields={[{ key: "title", label: t("título"), value: "" }]}
          onSubmit={submitSection}
          onCancel={() => setModal(null)}
        />
      )}
    </section>
  );
}