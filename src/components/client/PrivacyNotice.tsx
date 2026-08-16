"use client";

import { useEffect, useState } from "react";
import { useT } from "@/hooks/useT";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

const NOTICE_KEY = "opsboard.notice-v1";

export function PrivacyNotice() {
  const { t } = useT();
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
      aria-label={t("aviso de privacidade")}
      className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4 shadow-xl"
    >
      <h2 className="text-sm font-bold tracking-wide text-[var(--text)]">{t("priv_titulo")}</h2>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted-text)]">
        {t("priv_txt")}
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Link
          href="/privacidade"
          className={buttonVariants({ variant: "ghost", size: "xs" }) + " text-[var(--muted-text)]"}
        >
          {t("priv_link")}
        </Link>
        <Button type="button" variant="default" size="sm" onClick={dismiss}>
          {t("priv_ok")}
        </Button>
      </div>
    </div>
  );
}
