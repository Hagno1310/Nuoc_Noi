"use client";
import { useRef, useState, type ReactNode } from "react";

// Sửa tại chỗ như web/app quen thuộc: chạm vào chữ để sửa, Enter hoặc chạm ra ngoài là lưu, Esc là hủy.
// onSave trả về câu lỗi (hiện ngay dưới ô) hoặc null khi đã lưu.
export function InlineEdit({
  value,
  buttonLabel,
  inputLabel,
  onSave,
  numeric,
  className = "",
  children,
}: {
  value: string;
  buttonLabel: string;
  inputLabel: string;
  onSave: (next: string) => Promise<string | null>;
  numeric?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  const errorId = useRef(`edit-${Math.random().toString(36).slice(2)}`).current;

  function close() {
    setDraft(null);
    setError(null);
  }

  async function commit() {
    if (draft === null || saving.current) return;
    if (draft.trim() === value) return close();
    saving.current = true;
    const failure = await onSave(draft);
    saving.current = false;
    if (failure) setError(failure);
    else close();
  }

  if (draft === null)
    return (
      <button
        type="button"
        aria-label={buttonLabel}
        onClick={() => setDraft(value)}
        className={`min-h-12 rounded-md text-left transition-colors duration-150 hover:text-ember focus-visible:text-ember ${className}`}
      >
        {children}
      </button>
    );
  return (
    <span className="fade-in flex min-w-0 flex-col gap-1">
      <input
        autoFocus
        aria-label={inputLabel}
        value={draft}
        inputMode={numeric ? "numeric" : undefined}
        onFocus={(e) => e.target.select()}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void commit();
          }
          if (e.key === "Escape") close();
        }}
        aria-invalid={error !== null}
        aria-describedby={error ? errorId : undefined}
        className={`min-h-12 w-full rounded-lg border border-edge bg-transparent px-2 text-ink tabular-nums transition-colors duration-150 focus:border-ember ${className}`}
      />
      {error && (
        <span id={errorId} role="alert" className="text-sm font-normal text-danger">
          {error}
        </span>
      )}
    </span>
  );
}
