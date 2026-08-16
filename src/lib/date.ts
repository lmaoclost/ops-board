export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function fmtDate(iso: string): string {
  const [y, m, d] = (iso || "").split("-");
  return y ? `${d}/${m}/${y}` : "";
}

export function isOverdue(due: string, status: string): boolean {
  return status !== "done" && !!due && due < todayISO();
}

export function isDueSoon(due: string, status: string): boolean {
  if (status === "done" || !due) return false;
  const dueMs = new Date(due + "T00:00:00").getTime();
  const todayMs = new Date(todayISO() + "T00:00:00").getTime();
  return dueMs - todayMs <= 2 * 86400000;
}