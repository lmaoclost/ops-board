import { useState, type ReactNode } from "react";
import { useT } from "@/hooks/useT";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface ModalFieldOption {
  value: string | number;
  label: string;
}

export interface ModalField {
  key: string;
  label: string;
  value?: string | number | boolean;
  type?: "text" | "textarea" | "checkbox" | "select" | "date";
  options?: ModalFieldOption[];
  placeholder?: string;
  required?: boolean;
}

interface ModalProps {
  title: string;
  fields: ModalField[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string | boolean>) => void;
  onCancel: () => void;
  onFieldChange?: (key: string, value: string | boolean) => void;
  children?: ReactNode;
  topChildren?: ReactNode;
}

export function Modal({ title, fields, submitLabel = "salvar", onSubmit, onCancel, onFieldChange, children, topChildren }: ModalProps) {
  const { t } = useT();
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(fields.filter((f) => f.type === "checkbox").map((f) => [f.key, Boolean(f.value)])),
  );
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const clearError = (key: string) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: false } : prev));

  const collect = () => {
    const values: Record<string, string | boolean> = {};
    for (const f of fields) {
      if (f.type === "checkbox") values[f.key] = checks[f.key] ?? false;
      else {
        const input = document.getElementById(`field-${f.key}`) as HTMLInputElement | null;
        values[f.key] = input?.value ?? "";
      }
    }
    return values;
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent
        showCloseButton={false}
        initialFocus={() => document.querySelector<HTMLElement>("[data-modal-first]")}
        className="gap-0 rounded-lg border border-[var(--line-soft)] bg-[var(--panel-2)] p-0 text-[var(--text)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <DialogTitle className="text-[13px] font-bold text-[var(--text)]">{title}</DialogTitle>
          <DialogClose
            render={
              <Button type="button" variant="ghost" size="icon-xs" title={t("fechar")} aria-label={t("fechar")}>
                ×
              </Button>
            }
          />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const values = collect();
            const invalid = fields.some(
              (f) =>
                f.required &&
                f.type !== "checkbox" &&
                String(values[f.key] ?? "").trim() === "",
            );
            if (invalid) {
              setErrors(
                Object.fromEntries(
                  fields.map((f) => [
                    f.key,
                    !!f.required && f.type !== "checkbox" && String(values[f.key] ?? "").trim() === "",
                  ]),
                ),
              );
              return;
            }
            onSubmit(values);
          }}
        >
          <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto px-4 py-4">
            {topChildren}
            {fields.map((f, i) => (
              <div key={f.key}>
                <Label
                  htmlFor={`field-${f.key}`}
                  data-required={f.required ? "" : undefined}
                  className="modal-label mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-text)]"
                >
                  {f.label}
                </Label>
                {f.type === "textarea" ? (
                  <textarea
                    id={`field-${f.key}`}
                    data-modal-first={i === 0 ? "" : undefined}
                    defaultValue={String(f.value ?? "")}
                    placeholder={f.placeholder}
                    onChange={() => clearError(f.key)}
                    className={`min-h-[72px] w-full resize-y rounded-lg border bg-[var(--field)] px-2.5 py-1 text-sm text-[var(--text)] outline-none placeholder:text-[var(--dimmer)] focus-visible:border-[var(--fired)] dark:bg-[var(--field)] ${errors[f.key] ? "border-[var(--gave)]" : "border-[var(--line)]"}`}
                  />
                ) : f.type === "checkbox" ? (
                  <Switch
                    id={`field-${f.key}`}
                    data-modal-first={i === 0 ? "" : undefined}
                    checked={checks[f.key] ?? false}
                    onCheckedChange={(c) => {
                      setChecks((prev) => ({ ...prev, [f.key]: c }));
                      onFieldChange?.(f.key, c);
                    }}
                  />
                ) : f.type === "select" ? (
                  <select
                    id={`field-${f.key}`}
                    data-modal-first={i === 0 ? "" : undefined}
                    defaultValue={String(f.value ?? "")}
                    onChange={() => clearError(f.key)}
                    className={`h-8 w-full rounded-lg border bg-[var(--field)] px-2 text-sm text-[var(--text)] outline-none dark:bg-[var(--field)] ${errors[f.key] ? "border-[var(--gave)]" : "border-[var(--line)]"}`}
                  >
                    {(f.options ?? []).map((o) => (
                      <option key={String(o.value)} value={String(o.value)}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "date" ? (
                  <input
                    id={`field-${f.key}`}
                    data-modal-first={i === 0 ? "" : undefined}
                    type="date"
                    defaultValue={String(f.value ?? "")}
                    onChange={() => clearError(f.key)}
                    className={`h-8 w-full rounded-lg border bg-[var(--field)] px-2 text-sm text-[var(--text)] outline-none dark:bg-[var(--field)] ${errors[f.key] ? "border-[var(--gave)]" : "border-[var(--line)]"}`}
                  />
                ) : (
                  <Input
                    id={`field-${f.key}`}
                    data-modal-first={i === 0 ? "" : undefined}
                    type="text"
                    defaultValue={String(f.value ?? "")}
                    placeholder={f.placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={() => clearError(f.key)}
                    className={`bg-[var(--field)] dark:bg-[var(--field)] ${errors[f.key] ? "border-[var(--gave)]" : ""}`}
                  />
                )}
                {errors[f.key] && (
                  <p className="mt-1 text-[11px] font-semibold text-[var(--gave)]">{t("campo obrigatório")}</p>
                )}
              </div>
            ))}
            {children}
          </div>
          <div className="flex justify-end gap-2 px-4 pb-3.5">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              {t("cancelar")}
            </Button>
            <Button type="submit" variant="default" size="sm">
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}