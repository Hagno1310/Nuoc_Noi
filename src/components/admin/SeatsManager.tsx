"use client";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EditDialog } from "@/components/admin/EditDialog";
import { InlineEdit } from "@/components/admin/InlineEdit";
import { SectionTitle } from "@/components/admin/SectionTitle";
import { ownerErrorText } from "@/lib/admin/errors";
import { moveItem, renumber } from "@/lib/admin/reorder";
import { useDragSort } from "@/lib/admin/useDragSort";
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

type Result = PromiseLike<{ error: { message: string; code?: string } | null }>;

const FIELD =
  "min-h-12 rounded-lg border border-edge bg-transparent p-2 text-base text-ink transition-colors duration-150 placeholder:text-ink-muted focus:border-ember";
const OUTLINE =
  "flex min-h-12 min-w-12 items-center justify-center rounded-md border border-edge px-3 text-sm transition-[background-color,border-color,transform] duration-150 hover:border-ink active:scale-[0.98] disabled:opacity-40";

// SRS FR-05c: thêm, đổi tên, sắp xếp trong từng loại, ẩn và hiện lại chỗ ngồi.
// Thao tác như Thực đơn: chạm tên để sửa tại chỗ, kéo tay cầm ⋮⋮ để đổi thứ tự, nút ⋯ mở hộp thoại.
export function SeatsManager({ seats }: { seats: OwnerSeat[] }) {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<SeatKind>("counter");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const locked = busy || refreshing;
  const hide = useTwoStep<string>();
  const active = seats.filter((s) => !s.is_archived);
  const archived = seats.filter((s) => s.is_archived);

  // Trả về câu lỗi hoặc null; luôn tải lại dữ liệu sau khi ghi
  async function run(ops: (() => Result)[]): Promise<string | null> {
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
    startTransition(() => router.refresh());
    return failure;
  }

  async function add() {
    const name = newName.trim();
    if (!name) return setError("Nhập tên chỗ ngồi trước khi thêm.");
    // sort_order chỉ có nghĩa trong cùng loại
    const maxOrder = Math.max(0, ...seats.filter((s) => s.kind === newKind).map((s) => s.sort_order));
    const failure = await run([
      () => supabase.from("seats").insert({ name, kind: newKind, sort_order: maxOrder + 1 }),
    ]);
    setError(failure);
    if (!failure) setNewName("");
  }

  async function rename(seat: OwnerSeat, raw: string) {
    const name = raw.trim();
    if (!name) return "Nhập tên chỗ ngồi.";
    if (name === seat.name) return null;
    return run([() => supabase.from("seats").update({ name }).eq("id", seat.id)]);
  }

  // Đánh số lại trong cùng loại, mỗi hàng đổi số là một lệnh riêng
  function move(list: OwnerSeat[], from: number, to: number) {
    const updates = renumber(moveItem(list, from, to));
    void run(updates.map((u) => () => supabase.from("seats").update({ sort_order: u.sort_order }).eq("id", u.id))).then(
      setError,
    );
  }

  // Trả về true khi đã ẩn (bấm lần hai), để hộp thoại đóng lại
  function archive(seat: OwnerSeat) {
    if (hide.armed !== seat.id) {
      hide.arm(seat.id);
      return false;
    }
    hide.reset();
    void run([() => supabase.from("seats").update({ is_archived: true }).eq("id", seat.id)]).then(setError);
    return true;
  }

  function restore(seat: OwnerSeat) {
    void run([() => supabase.from("seats").update({ is_archived: false }).eq("id", seat.id)]).then(setError);
  }

  return (
    <div className="space-y-6">
      <SectionTitle>Chỗ ngồi</SectionTitle>
      {KINDS.map((kind) => (
        <SeatList
          key={kind}
          kind={kind}
          list={active.filter((s) => s.kind === kind)}
          locked={locked}
          armedId={hide.armed}
          onRename={rename}
          onMove={move}
          onHide={archive}
        />
      ))}
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-ink-muted">
          Loại
          <select value={newKind} onChange={(e) => setNewKind(e.target.value as SeatKind)} className={FIELD}>
            <option value="counter">Ghế quầy</option>
            <option value="table">Bàn</option>
          </select>
        </label>
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm text-ink-muted">
          Tên chỗ ngồi
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Quầy 13" className={FIELD} />
        </label>
        <button type="submit" disabled={locked} className={`${OUTLINE} px-5 font-semibold`}>
          Thêm chỗ ngồi
        </button>
      </form>
      {archived.length > 0 && (
        <details>
          <summary className="flex min-h-12 cursor-pointer items-center text-sm text-ink-muted transition-colors duration-150 hover:text-ink">
            Chỗ ngồi đã ẩn ({archived.length})
          </summary>
          <ul className="fade-in">
            {archived.map((s) => (
              <li key={s.id} className="flex items-center gap-2 py-1">
                <span className="flex flex-1 items-center gap-2 text-ink-muted">
                  {s.name}
                  <span className="text-sm">{KIND_LABEL[s.kind]}</span>
                  <span className="rounded-sm border border-line px-1 text-xs font-semibold">ẨN</span>
                </span>
                <button type="button" className={OUTLINE} disabled={locked} onClick={() => restore(s)}>
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

// Một loại chỗ ngồi: hook kéo thả cần một danh sách riêng, nên tách thành component
function SeatList({
  kind,
  list,
  locked,
  armedId,
  onRename,
  onMove,
  onHide,
}: {
  kind: SeatKind;
  list: OwnerSeat[];
  locked: boolean;
  armedId: string | null;
  onRename: (seat: OwnerSeat, raw: string) => Promise<string | null>;
  onMove: (list: OwnerSeat[], from: number, to: number) => void;
  onHide: (seat: OwnerSeat) => boolean;
}) {
  const { handleProps, rowStyle, dropMark, drag } = useDragSort(list.length, (f, t) => onMove(list, f, t), locked);
  return (
    <div>
      <h3 className="text-sm font-medium text-ink-muted">
        {KIND_LABEL[kind]} ({list.length})
      </h3>
      {list.length === 0 && (
        <p className="py-2 text-sm text-ink-muted">Chưa có {KIND_LABEL[kind].toLowerCase()} nào. Thêm ở ô bên dưới.</p>
      )}
      <ul className="divide-y divide-line">
        {list.map((s, i) => (
          <li
            key={s.id}
            style={rowStyle(i)}
            className={`flex items-center gap-1 transition-colors duration-150 ${drag?.from === i ? "relative z-10 bg-raised" : ""} ${dropMark(i)}`}
          >
            <button
              type="button"
              aria-label={`Kéo để đổi thứ tự ${s.name}`}
              {...handleProps(i)}
              className="flex min-h-12 w-8 shrink-0 cursor-grab items-center justify-center text-ink-muted transition-colors duration-150 hover:text-ink active:cursor-grabbing disabled:opacity-40"
            >
              <GripVertical aria-hidden="true" size={18} />
            </button>
            <InlineEdit
              value={s.name}
              buttonLabel={`Sửa tên ${s.name}`}
              inputLabel={`Tên mới cho ${s.name}`}
              onSave={(v) => onRename(s, v)}
              className="min-w-0 flex-1 font-medium"
            >
              {s.name}
            </InlineEdit>
            <EditDialog label={`Sửa ${s.name}`} title={s.name}>
              {(close) => (
                <EditSeat
                  seat={s}
                  locked={locked}
                  hideArmed={armedId === s.id}
                  onSave={(v) => onRename(s, v)}
                  onHide={() => onHide(s) && close()}
                  close={close}
                />
              )}
            </EditDialog>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Nội dung hộp thoại sửa chỗ ngồi: Lưu là hành động chính; Ẩn (hai bước) đứng riêng bên trái, xa nút Lưu
function EditSeat({
  seat,
  locked,
  hideArmed,
  onSave,
  onHide,
  close,
}: {
  seat: OwnerSeat;
  locked: boolean;
  hideArmed: boolean;
  onSave: (name: string) => Promise<string | null>;
  onHide: () => void;
  close: () => void;
}) {
  const [name, setName] = useState(seat.name);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const failure = await onSave(name);
        if (failure) setError(failure);
        else close();
      }}
    >
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Tên chỗ ngồi
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={locked}
          onClick={onHide}
          className={`min-h-12 rounded-lg border px-3 text-sm font-semibold transition-colors duration-150 disabled:opacity-40 ${hideArmed ? "border-danger bg-danger text-ember-ink" : "border-danger/70 text-danger"}`}
        >
          {hideArmed ? "Chắc chắn ẩn?" : "Ẩn chỗ ngồi"}
        </button>
        <button
          type="button"
          onClick={close}
          className="ml-auto min-h-12 rounded-lg border border-edge px-4 text-sm transition-colors duration-150 hover:border-ink"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={locked}
          className="min-h-12 rounded-lg bg-ember px-5 font-semibold text-ember-ink transition-[transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-40"
        >
          Lưu
        </button>
      </div>
    </form>
  );
}
