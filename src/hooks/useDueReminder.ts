"use client";

import { useEffect, useRef } from "react";
import { dueReminder } from "@/lib/notify";
import { todayISO } from "@/lib/date";
import { useBoard } from "@/lib/store";
import { useT } from "@/hooks/useT";

export function useDueReminder() {
  const projetos = useBoard((s) => s.projetos);
  const { t } = useT();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (notifiedRef.current || typeof Notification === "undefined") return;
    const reminder = dueReminder(projetos, todayISO());
    if (!reminder) return;
    notifiedRef.current = true;
    const fire = () =>
      new Notification(
        `${reminder.count} ${reminder.count === 1 ? t("tarefa pendente") : t("tarefas pendentes")}`,
        { body: reminder.texts.join(" · ") + (reminder.count > 3 ? "…" : "") },
      );
    if (Notification.permission === "granted") {
      fire();
    } else if (Notification.permission === "default") {
      void Notification.requestPermission().then((p) => {
        if (p === "granted") fire();
      });
    }
  }, [projetos, t]);
}