import { useBoard } from "@/lib/store";
import { statusLabel, t, type TKey } from "@/lib/i18n";
import type { Status } from "@/lib/types";

export function useT() {
  const locale = useBoard((s) => s.locale);
  return {
    t: (key: TKey) => t(locale, key),
    status: (status: Status) => statusLabel(locale, status),
  };
}