"use client";

import { useEffect, useState } from "react";
import { useT } from "@/hooks/useT";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { setMetricsConsent } from "./Metrics";

const NOTICE_KEY = "opsboard.notice-v1";

export function PrivacyNotice() {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!localStorage.getItem(NOTICE_KEY)) setOpen(true);
  }, []);

  const choose = (consented: boolean) => {
    setMetricsConsent(consented);
    localStorage.setItem(NOTICE_KEY, "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label={t("aviso de privacidade")}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--line)] bg-[var(--panel)] p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--muted-text)]">
          {t("priv_txt")}{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-[var(--text)]"
          >
            {t("priv_link")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => choose(false)}>
            {t("priv_decline")}
          </Button>
          <Button type="button" variant="default" size="sm" onClick={() => choose(true)}>
            {t("priv_accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
