"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/hooks/useT";
import type { TKey } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import { METRICS_EVENT, readMetricsConsent, setMetricsConsent } from "@/components/client/Metrics";

function MetricsToggle() {
  const { t } = useT();
  const [on, setOn] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOn(readMetricsConsent());
    const sync = () => setOn(readMetricsConsent());
    window.addEventListener(METRICS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(METRICS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div className="mt-3 flex items-center gap-2.5">
      <Switch
        aria-label={t("metricas_uso")}
        checked={on}
        onCheckedChange={(c) => {
          setMetricsConsent(c);
          setOn(c);
        }}
      />
      <span className="text-sm text-[var(--muted-text)]">
        {on ? t("metricas_on") : t("metricas_off")}
      </span>
    </div>
  );
}

interface PrivacySection {
  tk: TKey;
  bk: TKey;
  toggle?: boolean;
}

const SECTIONS: PrivacySection[] = [
  { tk: "priv_s1t", bk: "priv_s1b" },
  { tk: "priv_s2t", bk: "priv_s2b" },
  { tk: "priv_s3t", bk: "priv_s3b" },
  { tk: "priv_s4t", bk: "priv_s4b" },
  { tk: "priv_s5t", bk: "priv_s5b" },
  { tk: "priv_s6t", bk: "priv_s6b" },
  { tk: "priv_s7t", bk: "priv_s7b", toggle: true },
];

export default function PrivacidadePage() {
  const { t } = useT();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-text)] hover:text-[var(--text)]"
        title={t("voltar para o quadro")}
      >
        {t("voltar")}
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)]">{t("política de privacidade")}</h1>
      <p className="mt-2 text-sm text-[var(--muted-text)]">
        {t("priv_sub")}
      </p>
      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.tk}>
            <h2 className="text-base font-semibold text-[var(--text)]">{t(s.tk)}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-text)]">{t(s.bk)}</p>
            {s.toggle && <MetricsToggle />}
          </section>
        ))}
      </div>
      <p className="mt-10 text-xs text-[var(--dimmer)]">
        {t("priv_upd")}
      </p>
    </main>
  );
}
