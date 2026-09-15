import { useT } from "@/hooks/useT";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDeleteProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDelete({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmDeleteProps) {
  const { t } = useT();
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent
        showCloseButton={false}
        className="!sm:max-w-[380px] gap-0 rounded-lg border border-[var(--line-soft)] bg-[var(--panel-2)] p-0 text-[var(--text)] shadow-xl"
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
        <div className="px-4 py-4 text-xs leading-relaxed text-[var(--muted-text)]">{message}</div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <Button type="button" variant="ghost" size="xs" onClick={onCancel}>
            {t("cancelar")}
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={onConfirm}>
            {confirmLabel ?? t("excluir")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
