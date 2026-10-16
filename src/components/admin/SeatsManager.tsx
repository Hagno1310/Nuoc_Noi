"use client";
import { Armchair, ChevronLeft, ChevronRight, GripVertical, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EditDialog } from "@/components/admin/EditDialog";
import { InlineEdit } from "@/components/admin/InlineEdit";
import { SectionTitle } from "@/components/admin/SectionTitle";
import { useWide } from "@/hooks/useWide";
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
  "h-13 w-full rounded-[14px] bg-surface-2 px-3.5 text-base text-ink ring-accent placeholder:text-muted focus:ring-[1.5px] focus:outline-none";
const OUTLINE =
  "flex h-12 min-w-12 items-center justify-center gap-1.5 rounded-[14px] bg-surface-2 px-3.5 text-sm font-semibold disabled:opacity-40";
const SAVE = "h-13 rounded-[14px] bg-accent px-5.5 font-semibold text-accent-ink disabled:opacity-40";
const CANCEL = "ml-auto h-13 rounded-[14px] bg-surface-2 px-4.5 text-sm font-semibold";

// SRS FR-05c: thêm, đổi tên, sắp xếp trong từng loại, ẩn và hiện lại chỗ ngồi.
// Điện thoại: lưới nút như màn order, chạm để sửa (design.pen). Máy tính: danh sách có tay cầm kéo và ⋯.
export function SeatsManager({ seats }: { seats: OwnerSeat[] }) {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const wide = useWide("(min-width: 1024px)");
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

  async function add(raw: string, kind: SeatKind) {
    const name = raw.trim();
    if (!name) return "Nhập tên chỗ ngồi trước khi thêm.";
    // sort_order chỉ có nghĩa trong cùng loại
    const maxOrder = Math.max(0, ...seats.filter((s) => s.kind === kind).map((s) => s.sort_order));
    return run([() => supabase.from("seats").insert({ name, kind, sort_order: maxOrder + 1 })]);
  }

  async function rename(seat: OwnerSeat, raw: string) {
    const name = raw.trim();
    if (!name) return "Nhập tên chỗ ngồi.";
    if (name === seat.name) return null;
    return run([() => supabase.from("seats").update({ name }).eq("id", seat.id)]);
  }

  // Đánh số lại trong cùng loại, mỗi hàng đổi số là một lệnh riêng
  function move(list: OwnerSeat[], from: number, to: number) {
    if (to < 0 || to >= list.length) return;
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
    <div className="space-y-4">
      <SectionTitle
        icon={Armchair}
        action={
          <EditDialog
            label="Thêm chỗ ngồi"
            title="Thêm chỗ ngồi"
            triggerClassName={`${OUTLINE} h-10`}
            trigger={
              <>
                <Plus aria-hidden="true" size={16} />
                {wide ? "Thêm chỗ ngồi" : "Thêm"}
              </>
            }
          >
            {(close) => <AddSeat locked={locked} onAdd={add} close={close} />}
          </EditDialog>
        }
      >
        Chỗ ngồi
      </SectionTitle>
      {KINDS.map((kind) => {
        const list = active.filter((s) => s.kind === kind);
        const props = { kind, list, locked, armedId: hide.armed, onRename: rename, onMove: move, onHide: archive };
        return wide ? <SeatList key={kind} {...props} /> : <SeatChips key={kind} {...props} />;
      })}
      {!wide && <p className="text-xs text-muted">Chạm một chỗ ngồi để đổi tên, đổi thứ tự hoặc ẩn.</p>}
      {archived.length > 0 && (
        <details>
          <summary className="flex min-h-12 cursor-pointer items-center text-sm text-muted hover:text-ink">
            Chỗ ngồi đã ẩn ({archived.length})
          </summary>
          <ul className="fade-in">
            {archived.map((s) => (
              <li key={s.id} className="flex items-center gap-2 py-1">
                <span className="flex flex-1 items-center gap-2 text-muted">
                  {s.name}
                  <span className="text-sm">{KIND_LABEL[s.kind]}</span>
                  <span className="rounded-md bg-surface-2 px-1.5 text-[11px] font-semibold">ẨN</span>
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

type ListProps = {
  kind: SeatKind;
  list: OwnerSeat[];
  locked: boolean;
  armedId: string | null;
  onRename: (seat: OwnerSeat, raw: string) => Promise<string | null>;
  onMove: (list: OwnerSeat[], from: number, to: number) => void;
  onHide: (seat: OwnerSeat) => boolean;
};

// Điện thoại: lưới nút như màn order (Ghế quầy 6 cột chỉ hiện số, Bàn 3 cột)
function SeatChips({ kind, list, locked, armedId, onRename, onMove, onHide }: ListProps) {
  const short = (s: OwnerSeat) => (kind === "counter" ? s.name.replace(/^Quầy\s+/, "") : s.name);
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-muted">
        {KIND_LABEL[kind]} · {list.length}
      </h3>
      {list.length === 0 && <p className="text-sm text-muted">Chưa có {KIND_LABEL[kind].toLowerCase()} nào.</p>}
      <div className={`grid gap-1.5 ${kind === "counter" ? "grid-cols-6" : "grid-cols-3"}`}>
        {list.map((s, i) => (
          <EditDialog
            key={s.id}
            label={`Sửa ${s.name}`}
            title={s.name}
            trigger={short(s)}
            triggerClassName="h-11 truncate rounded-xl bg-surface-2 px-1 text-sm font-semibold"
          >
            {(close) => (
              <EditSeat
                seat={s}
                locked={locked}
                hideArmed={armedId === s.id}
                onSave={(v) => onRename(s, v)}
                onHide={() => onHide(s) && close()}
                onMove={(d) => onMove(list, i, i + d)}
                canMove={[i > 0, i < list.length - 1]}
                close={close}
              />
            )}
          </EditDialog>
        ))}
      </div>
    </div>
  );
}

// Máy tính: danh sách có tay cầm kéo (kéo bằng con trỏ hoặc phím mũi tên), chạm tên để sửa tại chỗ, ⋯ mở hộp thoại
function SeatList({ kind, list, locked, armedId, onRename, onMove, onHide }: ListProps) {
  const { handleProps, rowStyle, dropMark, drag } = useDragSort(list.length, (f, t) => onMove(list, f, t), locked);
  return (
    <div>
      <h3 className="pb-1 text-xs font-semibold text-muted">
        {KIND_LABEL[kind]} · {list.length}
      </h3>
      {list.length === 0 && <p className="py-2 text-sm text-muted">Chưa có {KIND_LABEL[kind].toLowerCase()} nào.</p>}
      <ul className="divide-y divide-line">
        {list.map((s, i) => (
          <li
            key={s.id}
            style={rowStyle(i)}
            className={`flex min-h-12 items-center gap-1 rounded-xl ${drag?.from === i ? "relative z-10 bg-surface-2" : ""} ${dropMark(i)}`}
          >
            <button
              type="button"
              aria-label={`Kéo để đổi thứ tự ${s.name}`}
              {...handleProps(i)}
              className="flex min-h-12 w-9 shrink-0 cursor-grab items-center justify-center text-muted hover:text-ink active:cursor-grabbing disabled:opacity-40"
            >
              <GripVertical aria-hidden="true" size={16} />
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

function AddSeat({
  locked,
  onAdd,
  close,
}: {
  locked: boolean;
  onAdd: (name: string, kind: SeatKind) => Promise<string | null>;
  close: () => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<SeatKind>("counter");
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const failure = await onAdd(name, kind);
        if (failure) setError(failure);
        else close();
      }}
    >
      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
        Tên chỗ ngồi
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Quầy 13" className={FIELD} />
      </label>
      <KindPicker value={kind} onChange={setKind} />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex items-center gap-2 pt-1">
        <button type="button" onClick={close} className={CANCEL}>
          Hủy
        </button>
        <button type="submit" disabled={locked} className={SAVE}>
          Thêm chỗ ngồi
        </button>
      </div>
    </form>
  );
}

function KindPicker({ value, onChange }: { value: SeatKind; onChange: (k: SeatKind) => void }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="pb-1.5 text-xs font-medium text-muted">Loại</legend>
      <div className="flex gap-1 rounded-[14px] bg-surface-2 p-1">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={value === k}
            onClick={() => onChange(k)}
            className={`h-11 flex-1 rounded-[11px] text-sm font-semibold ${value === k ? "bg-ink text-bg" : "text-muted"}`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// Nội dung hộp thoại sửa chỗ ngồi: Lưu là hành động chính; Ẩn (hai bước) đứng riêng bên trái, xa nút Lưu.
// Trên điện thoại có thêm hai nút đổi thứ tự, vì lưới nút không kéo thả được.
function EditSeat({
  seat,
  locked,
  hideArmed,
  onSave,
  onHide,
  onMove,
  canMove,
  close,
}: {
  seat: OwnerSeat;
  locked: boolean;
  hideArmed: boolean;
  onSave: (name: string) => Promise<string | null>;
  onHide: () => void;
  onMove?: (delta: number) => void;
  canMove?: [boolean, boolean];
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
      <label className="flex flex-col gap-1.5 text-xs font-medium text-muted">
        Tên chỗ ngồi
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
      </label>
      {onMove && canMove && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted">Thứ tự</p>
          <div className="flex gap-2">
            <button type="button" disabled={locked || !canMove[0]} onClick={() => onMove(-1)} className={`${OUTLINE} flex-1`}>
              <ChevronLeft aria-hidden="true" size={16} /> Lên trước
            </button>
            <button type="button" disabled={locked || !canMove[1]} onClick={() => onMove(1)} className={`${OUTLINE} flex-1`}>
              Ra sau <ChevronRight aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      )}
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
          className={`h-13 rounded-[14px] px-4 text-sm font-semibold disabled:opacity-40 ${hideArmed ? "bg-danger text-accent-ink" : "bg-danger-soft text-danger"}`}
        >
          {hideArmed ? "Chắc chắn ẩn?" : "Ẩn chỗ ngồi"}
        </button>
        <button type="button" onClick={close} className={CANCEL}>
          Hủy
        </button>
        <button type="submit" disabled={locked} className={SAVE}>
          Lưu
        </button>
      </div>
    </form>
  );
}
