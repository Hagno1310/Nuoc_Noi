"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SectionTitle } from "@/components/admin/SectionTitle";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ownerErrorText } from "@/lib/admin/errors";
import { useTwoStep } from "@/lib/admin/useTwoStep";
import { getBrowserSupabase } from "@/lib/supabase/client";

export type SeatKind = "table" | "counter";
export type OwnerSeat = {
  id: string;
  name: string;
  kind: SeatKind;
  sort_order: number;
  is_archived: boolean;
};

// Ghế quầy trước, Bàn sau, giống màn hình order
const KINDS: SeatKind[] = ["counter", "table"];
const KIND_LABEL: Record<SeatKind, string> = {
  counter: "Ghế quầy",
  table: "Bàn",
};

type Result = PromiseLike<{ error: { message: string } | null }>;

export function SeatsManager({ seats }: { seats: OwnerSeat[] }) {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<SeatKind>("counter");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Mỗi chỗ ngồi là một dòng sổ: chạm vào hàng mới hiện nút của hàng đó; nút lên/xuống nằm sau "Sắp xếp"
  const [open, setOpen] = useState<string | null>(null);
  const [sorting, setSorting] = useState(false);
  const hide = useTwoStep<string>();
  const active = seats.filter((s) => !s.is_archived);
  const archived = seats.filter((s) => s.is_archived);

  async function run(...ops: (() => Result)[]) {
    setBusy(true);
    let failure: string | null = null;
    for (const op of ops) {
      const { error } = await op();
      if (error) {
        failure = ownerErrorText(error);
        break;
      }
    }
    setBusy(false);
    setError(failure);
    router.refresh();
    return failure === null;
  }

  async function add() {
    const name = newName.trim();
    if (!name) return setError("Nhập tên chỗ ngồi trước khi thêm.");
    // sort_order chỉ có nghĩa trong cùng loại
    const maxOrder = Math.max(
      0,
      ...seats.filter((s) => s.kind === newKind).map((s) => s.sort_order),
    );
    if (
      await run(() =>
        supabase
          .from("seats")
          .insert({ name, kind: newKind, sort_order: maxOrder + 1 }),
      )
    )
      setNewName("");
  }

  async function rename() {
    if (!editing) return;
    const name = editing.name.trim();
    const seat = seats.find((s) => s.id === editing.id);
    if (!name || name === seat?.name) return setEditing(null);
    if (
      await run(() =>
        supabase.from("seats").update({ name }).eq("id", editing.id),
      )
    )
      setEditing(null);
  }

  // `list` là các chỗ ngồi đang dùng của một loại, nên chỉ đổi chỗ trong cùng loại.
  // ponytail: hai lệnh update không nằm trong một transaction; lỗi giữa chừng chỉ làm lệch thứ tự, bấm lại là sửa được
  function move(list: OwnerSeat[], index: number, delta: -1 | 1) {
    const a = list[index];
    const b = list[index + delta];
    if (!a || !b) return;
    void run(
      () =>
        supabase
          .from("seats")
          .update({ sort_order: b.sort_order })
          .eq("id", a.id),
      () =>
        supabase
          .from("seats")
          .update({ sort_order: a.sort_order })
          .eq("id", b.id),
    );
  }

  function setArchived(s: OwnerSeat, value: boolean) {
    if (value && hide.armed !== s.id) return hide.arm(s.id);
    hide.reset();
    setOpen(null);
    void run(() =>
      supabase.from("seats").update({ is_archived: value }).eq("id", s.id),
    );
  }

  // Màu viền tách riêng để viền danger của nút Ẩn không bị border-edge đè
  const button =
    "flex min-h-12 min-w-12 items-center justify-center rounded-md border px-3 text-sm disabled:opacity-40";
  const small = `${button} border-edge`;
  const field =
    "min-h-12 rounded-lg border border-edge bg-transparent p-2 text-base text-ink placeholder:text-ink-muted";
  return (
    <div className="space-y-4">
      <SectionTitle
        action={
          active.length > 1 && (
            <button
              type="button"
              className={small}
              aria-pressed={sorting}
              onClick={() => {
                setEditing(null);
                setOpen(null);
                setSorting(!sorting);
              }}
            >
              {sorting ? "Xong" : "Sắp xếp"}
            </button>
          )
        }
      >
        Chỗ ngồi
      </SectionTitle>
      {KINDS.map((kind) => {
        const list = active.filter((s) => s.kind === kind);
        return (
          <div key={kind}>
            <h3 className="text-sm font-medium text-ink-muted">
              {KIND_LABEL[kind]} ({list.length})
            </h3>
            {list.length === 0 && (
              <p className="py-2 text-sm text-ink-muted">
                Chưa có {KIND_LABEL[kind].toLowerCase()} nào. Thêm ở ô bên dưới.
              </p>
            )}
            <ul className="divide-y divide-line">
              {list.map((s, i) => (
                <li key={s.id}>
                  {editing?.id === s.id ? (
                    <form
                      className="flex gap-2 py-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void rename();
                      }}
                    >
                      <input
                        autoFocus
                        aria-label={`Tên mới cho ${s.name}`}
                        value={editing.name}
                        onChange={(e) =>
                          setEditing({ id: s.id, name: e.target.value })
                        }
                        onKeyDown={(e) =>
                          e.key === "Escape" && setEditing(null)
                        }
                        className={`${field} flex-1`}
                      />
                      <button type="submit" disabled={busy} className={small}>
                        Lưu
                      </button>
                      <button
                        type="button"
                        className={small}
                        onClick={() => setEditing(null)}
                      >
                        Bỏ qua
                      </button>
                    </form>
                  ) : sorting ? (
                    <div className="flex min-h-12 items-center gap-2 py-1">
                      <span className="flex-1 font-medium">{s.name}</span>
                      <button
                        type="button"
                        className={small}
                        aria-label={`Đưa ${s.name} lên`}
                        disabled={busy || i === 0}
                        onClick={() => move(list, i, -1)}
                      >
                        <ChevronUp aria-hidden="true" size={18} />
                      </button>
                      <button
                        type="button"
                        className={small}
                        aria-label={`Đưa ${s.name} xuống`}
                        disabled={busy || i === list.length - 1}
                        onClick={() => move(list, i, 1)}
                      >
                        <ChevronDown aria-hidden="true" size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        aria-expanded={open === s.id}
                        onClick={() => setOpen(open === s.id ? null : s.id)}
                        className="flex min-h-12 w-full items-center justify-between py-1 text-left font-medium"
                      >
                        {s.name}
                        <ChevronDown
                          aria-hidden="true"
                          size={18}
                          className={`text-ink-muted transition-transform duration-150 ${open === s.id ? "rotate-180" : ""}`}
                        />
                      </button>
                      {open === s.id && (
                        <div className="flex gap-2 pb-3">
                          <button
                            type="button"
                            className={small}
                            onClick={() => setEditing({ id: s.id, name: s.name })}
                          >
                            Đổi tên
                          </button>
                          <button
                            type="button"
                            className={`${button} ml-auto ${hide.armed === s.id ? "border-danger bg-danger text-ember-ink" : "border-danger/70 text-danger"}`}
                            disabled={busy}
                            onClick={() => setArchived(s, true)}
                          >
                            {hide.armed === s.id ? "Chắc chắn ẩn?" : "Ẩn"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Loại
          <select
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as SeatKind)}
            className={field}
          >
            <option value="counter">Ghế quầy</option>
            <option value="table">Bàn</option>
          </select>
        </label>
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm text-ink-muted">
          Tên chỗ ngồi
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Quầy 13"
            className={field}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className={`${small} px-5 font-semibold`}
        >
          Thêm chỗ ngồi
        </button>
      </form>
      {archived.length > 0 && (
        <details>
          <summary className="flex min-h-12 cursor-pointer items-center text-sm text-ink-muted">
            Chỗ ngồi đã ẩn ({archived.length})
          </summary>
          <ul>
            {archived.map((s) => (
              <li key={s.id} className="flex items-center gap-2 py-1">
                <span className="flex flex-1 items-center gap-2 text-ink-muted">
                  {s.name}
                  <span className="text-sm">{KIND_LABEL[s.kind]}</span>
                  <span className="rounded-sm border border-line px-1 text-xs font-semibold">ẨN</span>
                </span>
                <button
                  type="button"
                  className={small}
                  disabled={busy}
                  onClick={() => setArchived(s, false)}
                >
                  Hiện lại
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
