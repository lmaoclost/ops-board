import { useId, useState, type ReactNode } from "react";
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
}

interface ModalProps {
  title: string;
  fields: ModalField[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string | boolean>) => void;
  onCancel: () => void;
  children?: ReactNode;
}

export function Modal({ title, fields, submitLabel = "salvar", onSubmit, onCancel, children }: ModalProps) {
  const titleId = useId();
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(fields.filter((f) => f.type === "checkbox").map((f) => [f.key, Boolean(f.value)])),
  );

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent
        showCloseButton={false}
        initialFocus={() => document.querySelector<HTMLElement>("[data-modal-first]")}
        className="!sm:max-w-[460px] gap-0 rounded-lg border border-[var(--line-soft)] bg-[var(--panel-2)] p-0 text-[var(--text)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <DialogTitle className="text-[13px] font-bold text-[var(--text)]">{title}</DialogTitle>
          <DialogClose
            render={
              <Button type="button" variant="ghost" size="icon-xs" title="fechar" aria-label="fechar">
                ×
              </Button>
            }
          />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const values: Record<string, string | boolean> = {};
            for (const f of fields) {
              if (f.type === "checkbox") values[f.key] = checks[f.key] ?? false;
              else {
                const input = document.getElementById(`field-${f.key}`) as HTMLInputElement | null;
                values[f.key] = input?.value ?? "";
              }
            }
            onSubmit(values);
          }}
        >
          <div className="flex flex-col gap-3 px-4 py-4">
            {fields.map((f, i) => (
              <div key={f.key}>
                <Label
                  htmlFor={`field-${f.key}`}
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-text)]"
                >
                  {f.label}
                </Label>
                {f.type === "textarea" ? (
                  <textarea
                    id={`field-${f.key}`}
                    data-modal-first={i === 0 ? "" : undefined}
                    defaultValue={String(f.value ?? "")}
                    placeholder={f.placeholder}
                    className="input-line min-h-[72px] w-full resize-y"
                  />
                ) : f.type === "checkbox" ? (
                  <Switch
                    id={`field-${f.key}`}
                    data-modal-first={i === 0 ? "" : undefined}
                    checked={checks[f.key] ?? false}
                    onCheckedChange={(c) => setChecks((prev) => ({ ...prev, [f.key]: c }))}
                  />
                ) : f.type === "select" ? (
                  <select
                    id={`field-${f.key}`}
                    data-modal-first={i === 0 ? "" : undefined}
                    defaultValue={String(f.value ?? "")}
                    className="input-line w-full"
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
                    className="input-line w-full"
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
                    className="bg-[var(--field)]"
                  />
                )}
              </div>
            ))}
            {children}
          </div>
          <div className="flex justify-end gap-2 px-4 pb-3.5">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              cancelar
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