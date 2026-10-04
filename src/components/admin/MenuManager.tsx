"use client";
import { GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { InlineEdit } from "@/components/admin/InlineEdit";
import { EditDialog } from "@/components/admin/EditDialog";
import { SectionTitle } from "@/components/admin/SectionTitle";
import { ownerErrorText } from "@/lib/admin/errors";
import { menuNameError, nextSortOrder, normalizeMenuName } from "@/lib/admin/menu";
import { moveItem, renumber } from "@/lib/admin/reorder";
import { useDragSort } from "@/lib/admin/useDragSort";
import { useTwoStep } from "@/lib/admin/useTwoStep";
import { parsePriceInput, PRICE_RANGE_TEXT } from "@/lib/admin/validate";
import { formatVnd } from "@/lib/money";
import { getBrowserSupabase } from "@/lib/supabase/client";

export type OwnerMenuItem = {
  id: string;
  name: string;
  price: number;
  sort_order: number;
  is_archived: boolean;
};

type Result = PromiseLike<{ error: { message: string; code?: string } | null }>;

// SRS FR-05: thêm, đổi tên, đổi giá, sắp xếp, ẩn và hiện lại món. Trigger ở DB tự ghi lịch sử giá.
// Thao tác theo thói quen web/app: chạm tên hoặc giá để sửa tại chỗ, kéo tay cầm ⋮⋮ để đổi thứ tự, menu ⋯ để ẩn.
export function MenuManager({ items }: { items: OwnerMenuItem[] }) {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Khóa thao tác tới khi dữ liệu mới về, để không tính thứ tự trên danh sách cũ
  const [refreshing, startTransition] = useTransition();
  const locked = busy || refreshing;
  const hide = useTwoStep<string>();
  const active = items.filter((i) => !i.is_archived);
  const archived = items.filter((i) => i.is_archived);

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
    const nameError = menuNameError(newName, items);
    if (nameError) return setError(nameError);
    const price = parsePriceInput(newPrice);
    if (price === null) return setError(PRICE_RANGE_TEXT);
    const failure = await run([
      () =>
        supabase
          .from("menu_items")
          .insert({ name: normalizeMenuName(newName), price, sort_order: nextSortOrder(items) }),
    ]);
    setError(failure);
    if (!failure) {
      setNewName("");
      setNewPrice("");
    }
  }

  async function rename(item: OwnerMenuItem, raw: string) {
    const name = normalizeMenuName(raw);
    if (name === item.name) return null;
    const nameError = menuNameError(name, items, item.id);
    if (nameError) return nameError;
    return run([() => supabase.from("menu_items").update({ name }).eq("id", item.id)]);
  }

  // Hộp thoại ⋯: lưu tên và giá cùng lúc, chỉ gửi phần đã đổi
  async function saveBoth(item: OwnerMenuItem, rawName: string, rawPrice: string) {
    const name = normalizeMenuName(rawName);
    const nameError = name === item.name ? null : menuNameError(name, items, item.id);
    if (nameError) return nameError;
    const price = parsePriceInput(rawPrice);
    if (price === null) return PRICE_RANGE_TEXT;
    const ops: (() => Result)[] = [];
    if (name !== item.name) ops.push(() => supabase.from("menu_items").update({ name }).eq("id", item.id));
    if (price !== item.price) ops.push(() => supabase.from("menu_items").update({ price }).eq("id", item.id));
    return ops.length ? run(ops) : null;
  }

  async function reprice(item: OwnerMenuItem, raw: string) {
    const price = parsePriceInput(raw);
    if (price === null) return PRICE_RANGE_TEXT;
    if (price === item.price) return null;
    return run([() => supabase.from("menu_items").update({ price }).eq("id", item.id)]);
  }

  // Đánh số lại theo thứ tự mới (kể cả món đã ẩn, xếp sau), mỗi hàng đổi số là một lệnh riêng
  function move(from: number, to: number) {
    const updates = renumber([...moveItem(active, from, to), ...archived]);
    void run(
      updates.map((u) => () => supabase.from("menu_items").update({ sort_order: u.sort_order }).eq("id", u.id)),
    ).then(setError);
  }
  const { handleProps, rowStyle, dropMark, drag } = useDragSort(active.length, move, locked);

  // Trả về true khi đã ẩn (bấm lần hai), để hộp thoại đóng lại
  function archive(item: OwnerMenuItem) {
    if (hide.armed !== item.id) {
      hide.arm(item.id);
      return false;
    }
    hide.reset();
    void run([() => supabase.from("menu_items").update({ is_archived: true }).eq("id", item.id)]).then(setError);
    return true;
  }

  function restore(item: OwnerMenuItem) {
    // Món đã ẩn không sửa tên được, nên câu lỗi chỉ cách sửa làm được (ui-craft.md)
    if (menuNameError(item.name, items, item.id))
      return setError("Đã có món đang bán tên này. Đổi tên hoặc ẩn món đang bán đó rồi hiện lại.");
    void run([() => supabase.from("menu_items").update({ is_archived: false }).eq("id", item.id)]).then(setError);
  }

  const outline =
    "flex min-h-12 min-w-12 items-center justify-center rounded-md border border-edge px-3 text-sm transition-[background-color,border-color,transform] duration-150 hover:border-ink active:scale-[0.98] disabled:opacity-40";
  const field =
    "min-h-12 rounded-lg border border-edge bg-transparent p-2 text-base text-ink transition-colors duration-150 placeholder:text-ink-muted focus:border-ember";
  return (
    <div className="space-y-6">
      <SectionTitle>Món đang bán</SectionTitle>
      {active.length === 0 ? (
        <p className="text-sm text-ink-muted">Chưa có món nào đang bán. Thêm món ở ô bên dưới.</p>
      ) : (
        <ul className="-mt-4 divide-y divide-line border-b border-line">
          {active.map((item, i) => (
            <li
              key={item.id}
              style={rowStyle(i)}
              className={`flex items-center gap-1 transition-colors duration-150 ${drag?.from === i ? "relative z-10 bg-raised" : ""} ${dropMark(i)}`}
            >
              <button
                type="button"
                aria-label={`Kéo để đổi thứ tự ${item.name}`}
                {...handleProps(i)}
                className="flex min-h-12 w-8 shrink-0 cursor-grab items-center justify-center text-ink-muted transition-colors duration-150 hover:text-ink active:cursor-grabbing disabled:opacity-40"
              >
                <GripVertical aria-hidden="true" size={18} />
              </button>
              <InlineEdit
                value={item.name}
                buttonLabel={`Sửa tên ${item.name}`}
                inputLabel={`Tên mới cho ${item.name}`}
                onSave={(v) => rename(item, v)}
                className="min-w-0 flex-1 break-words font-display text-xl"
              >
                {item.name}
              </InlineEdit>
              <InlineEdit
                value={item.price.toLocaleString("vi-VN")}
                buttonLabel={`Sửa giá ${item.name}`}
                inputLabel={`Giá mới cho ${item.name}`}
                onSave={(v) => reprice(item, v)}
                numeric
                className="w-32 shrink-0 text-right font-semibold"
              >
                {formatVnd(item.price)}
              </InlineEdit>
              <EditDialog label={`Sửa ${item.name}`} title={item.name}>
                {(close) => (
                  <EditMenuItem
                    item={item}
                    field={field}
                    locked={locked}
                    hideArmed={hide.armed === item.id}
                    onSave={(n, p) => saveBoth(item, n, p)}
                    onHide={() => archive(item) && close()}
                    close={close}
                  />
                )}
              </EditDialog>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm text-ink-muted">
          Tên món
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Highball" className={field} />
        </label>
        <label className="flex w-36 flex-col gap-1 text-sm text-ink-muted">
          Giá
          <input
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="120.000"
            inputMode="numeric"
            className={`${field} tabular-nums`}
          />
        </label>
        <button type="submit" disabled={locked} className={`${outline} px-5 font-semibold`}>
          Thêm món
        </button>
      </form>

      {archived.length > 0 && (
        <details>
          <summary className="flex min-h-12 cursor-pointer items-center text-sm text-ink-muted transition-colors duration-150 hover:text-ink">
            Món đã ẩn ({archived.length})
          </summary>
          <ul className="fade-in">
            {archived.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-1">
                <span className="flex flex-1 items-center gap-2 text-ink-muted">
                  {item.name}
                  <span className="rounded-sm border border-line px-1 text-xs font-semibold">ẨN</span>
                </span>
                <span className="text-sm tabular-nums text-ink-muted">{formatVnd(item.price)}</span>
                <button
                  type="button"
                  className={outline}
                  aria-label={`Hiện lại ${item.name}`}
                  disabled={locked}
                  onClick={() => restore(item)}
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

// Nội dung hộp thoại sửa món: hai ô có nhãn, Lưu là hành động chính; Ẩn món (hai bước) đứng riêng bên trái, xa nút Lưu
function EditMenuItem({
  item,
  field,
  locked,
  hideArmed,
  onSave,
  onHide,
  close,
}: {
  item: OwnerMenuItem;
  field: string;
  locked: boolean;
  hideArmed: boolean;
  onSave: (name: string, price: string) => Promise<string | null>;
  onHide: () => void;
  close: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(item.price.toLocaleString("vi-VN"));
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const failure = await onSave(name, price);
        if (failure) setError(failure);
        else close();
      }}
    >
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Tên món
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={field} />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-muted">
        Giá
        <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" className={`${field} tabular-nums`} />
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
          {hideArmed ? "Chắc chắn ẩn?" : "Ẩn món"}
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
