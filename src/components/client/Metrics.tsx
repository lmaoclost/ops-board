"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const METRICS_KEY = "opsboard.metrics-v1";
export const METRICS_EVENT = "opsboard:metrics";

export function readMetricsConsent(): boolean {
  try {
    return localStorage.getItem(METRICS_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMetricsConsent(consented: boolean) {
  try {
    localStorage.setItem(METRICS_KEY, consented ? "1" : "0");
  } catch {
    // armazenamento indisponível: mantém desligado
  }
  window.dispatchEvent(new Event(METRICS_EVENT));
}

/** Gate duplo: render condicional + beforeSend (cobre remoção da chave em runtime). */
const gate = <T,>(event: T): T | null => (readMetricsConsent() ? event : null);

export function Metrics() {
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsented(readMetricsConsent());
    const onChange = () => setConsented(readMetricsConsent());
    window.addEventListener(METRICS_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(METRICS_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  if (!consented) return null;
  return (
    <>
      <Analytics beforeSend={gate} />
      <SpeedInsights beforeSend={gate} />
    </>
  );
}
