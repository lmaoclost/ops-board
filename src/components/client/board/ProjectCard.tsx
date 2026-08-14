import { useState } from "react";
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
import { esc } from "@/lib/escape";
import type { Project, Status, TaskPatch } from "@/lib/types";
import { Section, type SectionTaskActions as SectionLevelTaskActions } from "./Section";
import type { SectionLevelActions, TaskLevelActions } from "./Board";

export interface ProjectActions {
  onAddSection: (title: string) => void;
  onRename: (id: string, title: string, blocked: boolean) => void;
  onDelete: (id: string) => void;
}

export interface ProjectCardProps {
  project: Project;
  collectActions: (projectId: string) => {
    sectionActions: SectionLevelActions;
    taskActions: TaskLevelActions;
  };
  onAddSection: (title: string) => void;
  onRename: (id: string, title: string, blocked: boolean) => void;
  onDelete: (id: string) => void;
  prioSort?: boolean;
}

type ModalState =
  | { kind: "rename" }
  | { kind: "add-section" }
  | null;

export function ProjectCard({ project, collectActions, onAddSection, onRename, onDelete, prioSort }: ProjectCardProps) {
  const [modal, setModal] = useState<ModalState>(null);
  const actions = collectActions(project.id);

  const submitProject = (v: Record<string, string | boolean>) => {
    setModal(null);
    if (!String(v.title).trim()) return;
    onRename(project.id, String(v.title).trim(), Boolean(v.blocked));
  };

  const submitSection = (v: Record<string, string | boolean>) => {
    setModal(null);
    if (String(v.title).trim()) onAddSection(String(v.title).trim());
  };

  return (
    <section className="rounded-lg border border-[var(--line)] bg-[var(--panel)]">
      <div className="flex items-center gap-2 border-b border-[var(--line)] px-3.5 py-2.5">
        <span className="font-bold text-emerald-400">##</span>
        <h2 className="break-words text-[13px] font-bold tracking-wide text-[var(--text)]">{esc(project.title)}</h2>
        {project.blocked && (
          <Badge variant="destructive" className="rounded-[4px] px-1.5 text-[10px] font-bold uppercase tracking-[0.08em]">
            stuck
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
                  title="ações do projeto"
                  aria-label="ações do projeto"
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
                adicionar seção
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs"
                onClick={() => setModal({ kind: "rename" })}
              >
                renomear projeto
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--line)]" />
              <DropdownMenuItem
                variant="destructive"
                className="text-xs"
                onClick={() => {
                  if (window.confirm(`excluir projeto "${project.title}"?`)) onDelete(project.id);
                }}
              >
                excluir projeto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </div>

      {project.sections.map((s) => {
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
          />
        );
      })}

      {modal?.kind === "rename" && (
        <Modal
          title="editar projeto"
          submitLabel="salvar"
          fields={[
            { key: "title", label: "título", value: project.title },
            { key: "blocked", label: "marcar como stuck / bloqueado", type: "checkbox", value: project.blocked },
          ]}
          onSubmit={submitProject}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.kind === "add-section" && (
        <Modal
          title="nova seção"
          submitLabel="criar"
          fields={[{ key: "title", label: "título", value: "" }]}
          onSubmit={submitSection}
          onCancel={() => setModal(null)}
        />
      )}
    </section>
  );
}