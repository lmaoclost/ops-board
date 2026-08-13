import { useEffect, useId } from "react";

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
}

export function Modal({ title, fields, submitLabel = "salvar", onSubmit, onCancel }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    document.querySelector<HTMLElement>("[data-modal-first]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm px-4 pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[460px] rounded-lg border border-[var(--line-soft)] bg-[var(--panel-2)] shadow-xl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
          <h3 id={titleId} className="text-[13px] font-bold text-zinc-200">
            {title}
          </h3>
          <button type="button" onClick={onCancel} className="iconbtn" title="fechar" aria-label="fechar">
            ×
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const values: Record<string, string | boolean> = {};
            for (const f of fields) {
              const input = document.getElementById(`field-${f.key}`) as HTMLInputElement | null;
              if (f.type === "checkbox") values[f.key] = input?.checked ?? false;
              else values[f.key] = input?.value ?? "";
            }
            onSubmit(values);
          }}
        >
          <div className="flex flex-col gap-3 px-4 py-4">
            {fields.map((f, i) => (
              <div key={f.key}>
                <label
                  htmlFor={`field-${f.key}`}
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-text)]"
                >
                  {f.label}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    id={`field-${f.key}`}
                    data-modal-first={i === 0 ? "" : undefined}
                    defaultValue={String(f.value ?? "")}
                    placeholder={f.placeholder}
                    className="input-line min-h-[72px] w-full resize-y"
                  />
                ) : f.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer select-none">
                    <input
                      id={`field-${f.key}`}
                      data-modal-first={i === 0 ? "" : undefined}
                      type="checkbox"
                      defaultChecked={Boolean(f.value)}
                      className="accent-emerald-400"
                    />
                    {f.label}
                  </label>
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
                  <input
                    id={`field-${f.key}`}
                    data-modal-first={i === 0 ? "" : undefined}
                    type="text"
                    defaultValue={String(f.value ?? "")}
                    placeholder={f.placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    className="input-line w-full"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 px-4 pb-3.5">
            <button type="button" onClick={onCancel} className="btn">
              cancelar
            </button>
            <button type="submit" className="btn-primary">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}