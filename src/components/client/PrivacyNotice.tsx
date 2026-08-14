"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const NOTICE_KEY = "opsboard.notice-v1";

export function PrivacyNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!localStorage.getItem(NOTICE_KEY)) setOpen(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(NOTICE_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="aviso de privacidade"
      className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-xl"
    >
      <h2 className="text-sm font-bold tracking-wide text-[var(--text)]">Seus dados, só no seu navegador</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-text)]">
        O OpsBoard processa os seus dados localmente e os guarda apenas no armazenamento do seu navegador
        (localStorage). Nada é enviado a servidores. Você pode exportar um backup a qualquer momento e apagar
        tudo pelos controles do quadro. Veja a política completa na página de privacidade.
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="xs" render={<a href="/privacidade" />}>
          política completa
        </Button>
        <Button type="button" variant="default" size="sm" onClick={dismiss}>
          entendi
        </Button>
      </div>
    </div>
  );
}
