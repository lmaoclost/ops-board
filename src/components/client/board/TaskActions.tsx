"use client";

import { useState } from "react";
import { CircleSlashIcon } from "lucide-react";
import { useT } from "@/hooks/useT";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDelete } from "@/components/client/ConfirmDelete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_ORDER, type Status, type TaskPatch } from "@/lib/types";

export interface ActionableTask {
  text: string;
  status: Status;
  blocked: boolean;
  blockedReason?: string;
}
import dynamic from "next/dynamic";

const Modal = dynamic(() => import("@/components/client/Modal").then((m) => m.Modal));

export function TaskActions({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  onUpdate,
}: {
  task: ActionableTask;
  onStatusChange: (status: Status) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: (patch: TaskPatch) => void;
}) {
  const { t, status } = useT();
  const [blocking, setBlocking] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <>
      <Select value={task.status} onValueChange={(v) => onStatusChange(v as Status)}>
        <SelectTrigger
          size="sm"
          aria-label={t("mudar status")}
          title={t("mudar status")}
          className="hidden h-7 border-[var(--line)] bg-[var(--field)] px-2 text-[11px] text-[var(--muted-text)] hover:border-[var(--muted-text)] hover:text-[var(--text)] sm:flex"
        >
          <SelectValue>{status(task.status)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {STATUS_ORDER.map((k) => (
            <SelectItem key={k} value={k} label={status(k)} className="py-1 text-xs">
              {status(k)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => (task.blocked ? onUpdate({ blocked: false }) : setBlocking(true))}
        title={t(task.blocked ? "desbloquear tarefa" : "bloquear tarefa")}
        aria-label={t(task.blocked ? "desbloquear tarefa" : "bloquear tarefa")}
        className={`hidden transition-opacity sm:inline-flex ${task.blocked ? "text-[var(--gave)] opacity-100 hover:text-[var(--gave)]" : "text-[var(--dimmer)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-[var(--gave)]"}`}
      >
        <CircleSlashIcon />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" onClick={onEdit} title={t("editar")} aria-label={t("editar")} className="hidden sm:inline-flex">
        ✎
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="icon-xs"
        onClick={() => setConfirmingDelete(true)}
        title="excluir"
        aria-label="excluir"
        className="hidden sm:inline-flex"
      >
        ×
      </Button>
      <span className="shrink-0 sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                title={t("ações da tarefa")}
                aria-label={t("ações da tarefa")}
              >
                ⋯
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="bg-[var(--panel-2)] text-[var(--text)]">
            {STATUS_ORDER.map((k) => (
              <DropdownMenuItem key={k} className="text-xs" onClick={() => onStatusChange(k)}>
                {status(k)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-[var(--line)]" />
            <DropdownMenuItem
              className="text-xs"
              onClick={() => (task.blocked ? onUpdate({ blocked: false }) : setBlocking(true))}
            >
              {t(task.blocked ? "desbloquear tarefa" : "bloquear tarefa")}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs" onClick={onEdit}>
              {t("editar")}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" className="text-xs" onClick={() => setConfirmingDelete(true)}>
              {t("excluir")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
      {blocking && (
        <Modal
          title={t("por que foi bloqueado?")}
          submitLabel={t("salvar")}
          fields={[
            { key: "blockedReason", label: t("motivo do bloqueio"), type: "textarea", value: task.blockedReason ?? "" },
          ]}
          onSubmit={(v) => {
            onUpdate({ blocked: true, blockedReason: String(v.blockedReason ?? "").trim() });
            setBlocking(false);
          }}
          onCancel={() => setBlocking(false)}
        />
      )}
      {confirmingDelete && (
        <ConfirmDelete
          title={t("excluir tarefa?")}
          message={t("excluir_tarefa_txt")}
          onConfirm={() => {
            setConfirmingDelete(false);
            onDelete();
          }}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}