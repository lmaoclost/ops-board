"use client";

import type { ReactNode } from "react";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/useT";

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  children,
  confirmVariant = "destructive",
}: {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
  confirmVariant?: "destructive" | "default";
}) {
  const { t } = useT();
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 rounded-lg border border-[var(--line-soft)] bg-[var(--panel-2)] p-0 text-[var(--text)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <DialogTitle className="text-[13px] font-bold text-[var(--text)]">{title}</DialogTitle>
          <DialogClose
            render={
              <Button type="button" variant="ghost" size="icon-xs" title={t("fechar")} aria-label={t("fechar")}>
                ×
              </Button>
            }
          />
        </div>
        <div className="px-4 py-4 text-xs leading-relaxed text-[var(--muted-text)]">{body}</div>
        {children && <div className="px-4 pb-2">{children}</div>}
        <div className="flex justify-end gap-2 px-4 pb-4">
          <Button type="button" variant="ghost" size="xs" onClick={onCancel}>
            {t("cancelar")}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="sm"
            onClick={() => {
              onCancel();
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}