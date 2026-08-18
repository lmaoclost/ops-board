import type { Repeat } from "./types";

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

function addMonth(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return `${ny}-${String(nm).padStart(2, "0")}-${String(Math.min(d, daysInMonth(ny, nm))).padStart(2, "0")}`;
}

/** Próxima ocorrência: base = due se futura, senão hoje; nunca volta vencida. */
export function nextDue(repeat: Repeat, due: string, today: string): string {
  const base = due && due >= today ? due : today;
  if (repeat === "daily") return addDays(base, 1);
  if (repeat === "weekly") return addDays(base, 7);
  return addMonth(base);
}