import { useState } from "react";
import { Modal } from "@/components/client/Modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
}

type ModalState =
  | { kind: "rename" }
  | { kind: "add-section" }
  | null;

export function ProjectCard({ project, collectActions, onAddSection, onRename, onDelete }: ProjectCardProps) {
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
        <h2 className="break-words text-[13px] font-bold tracking-wide text-zinc-200">{esc(project.title)}</h2>
        {project.blocked && (
          <Badge variant="destructive" className="rounded-[4px] px-1.5 text-[10px] font-bold uppercase tracking-[0.08em]">
            stuck
          </Badge>
        )}
        <span className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setModal({ kind: "add-section" })}
            title="adicionar seção"
            aria-label="adicionar seção"
          >
            +
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setModal({ kind: "rename" })}
            title="renomear projeto"
            aria-label="renomear projeto"
          >
            ✎
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            onClick={() => {
              if (window.confirm(`excluir projeto "${project.title}"?`)) onDelete(project.id);
            }}
            title="excluir projeto"
            aria-label="excluir projeto"
          >
            ×
          </Button>
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