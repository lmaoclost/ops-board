"use client";

import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useT } from "@/hooks/useT";
import type { TKey } from "@/lib/i18n";

const SHORTCUTS: [string, TKey][] = [
  ["p", "novo projeto"],
  ["n", "focar nova tarefa"],
  ["/", "buscar tarefas"],
  ["1–5", "filtrar por status"],
  ["k", "alternar lista/kanban (k)"],
  ["t", "alternar tema claro/escuro"],
  ["? ", "esta ajuda"],
  ["esc", "limpar filtros"],
  ["ctrl+z", "desfazer (Ctrl+Z)"],
];

export function HelpDialog({ onCancel }: { onCancel: () => void }) {
  const { t } = useT();
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 rounded-lg border border-[var(--line-soft)] bg-[var(--panel-2)] p-0 text-[var(--text)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <DialogTitle className="text-[13px] font-bold text-[var(--text)]">{t("atalhos e dicas")}</DialogTitle>
          <DialogClose
            render={
              <Button type="button" variant="ghost" size="icon-xs" title={t("fechar")} aria-label={t("fechar")}>
                ×
              </Button>
            }
          />
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 px-4 py-4 text-xs">
          {SHORTCUTS.map(([key, tk]) => (
            <div key={tk} className="contents">
              <span className="text-[var(--dimmer)]">{key}</span>
              <span>{t(tk)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--line)] px-4 py-3 text-xs leading-relaxed text-[var(--muted-text)]">
          {t("ajuda_txt")}
        </div>
      </DialogContent>
    </Dialog>
  );
}