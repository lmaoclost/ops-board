"use client";

import { Button } from "@/components/ui/button";
import { useBoard } from "@/lib/store";

export function LocaleToggle() {
  const locale = useBoard((s) => s.locale);
  const setLocale = useBoard((s) => s.setLocale);
  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
      className="shrink-0 text-[var(--muted-text)] hover:text-[var(--text)]"
      title={locale === "pt" ? "English" : "Português"}
    >
      {locale === "pt" ? "EN" : "PT"}
    </Button>
  );
}