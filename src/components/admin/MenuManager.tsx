"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ownerErrorText } from "@/lib/admin/errors";
import { menuNameError, nextSortOrder, normalizeMenuName } from "@/lib/admin/menu";
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
type Editing = { id: string; field: "name" | "price"; value: string } | null;

// SRS FR-05: thêm, đổi tên, đổi giá, sắp xếp, ẩn và hiện lại món. Trigger ở DB tự ghi lịch sử giá.
export function MenuManager({ items }: { items: OwnerMenuItem[] }) {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string | null>(null);
  // Lỗi khi đang sửa hiện ngay dưới ô sửa (DESIGN.md Inputs), không ở cuối trang
  const [editError, setEditError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Khóa nút tới khi dữ liệu mới về, để không tính thứ tự trên danh sách cũ
  const [refreshing, startTransition] = useTransition();
  const locked = busy || refreshing;
  const hide = useTwoStep<string>();
  const active = items.filter((i) => !i.is_archived);
  const archived = items.filter((i) => i.is_archived);

  async function run(ops: (() => Result)[], show: (text: string | null) => void = setError) {
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
    show(failure);
    startTransition(() => router.refresh());
    return failure === null;
  }

  function openEdit(next: NonNullable<Editing>) {
    setEditError(null);
    setEditing(next);
  }

  function closeEdit() {
    setEditError(null);
    setEditing(null);
  }

  async function add() {
    const nameError = menuNameError(newName, items);
    if (nameError) return setError(nameError);
    const price = parsePriceInput(newPrice);
    if (price === null) return setError(PRICE_RANGE_TEXT);
    const name = normalizeMenuName(newName);
    if (
      await run([
        () => supabase.from("menu_items").insert({ name, price, sort_order: nextSortOrder(items) }),
      ])
    ) {
      setNewName("");
      setNewPrice("");
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const item = items.find((i) => i.id === editing.id);
    if (!item) return closeEdit();
    if (editing.field === "name") {
      const name = normalizeMenuName(editing.value);
      if (name === item.name) return closeEdit();
      const nameError = menuNameError(name, items, item.id);
      if (nameError) return setEditError(nameError);
      if (await run([() => supabase.from("menu_items").update({ name }).eq("id", item.id)], setEditError))
        closeEdit();
      return;
    }
    const price = parsePriceInput(editing.value);
    if (price === null) return setEditError(PRICE_RANGE_TEXT);
    if (price === item.price) return closeEdit();
    if (await run([() => supabase.from("menu_items").update({ price }).eq("id", item.id)], setEditError))
      closeEdit();
  }

  // Mỗi lệnh update khóa đúng một dòng: không tạo vòng chờ với khóa FOR SHARE của create_order.
  // ponytail: các lệnh không nằm trong một transaction; lỗi giữa chừng có thể để hai món trùng thứ tự,
  // lần bấm sau sẽ đánh số lại toàn bộ
  function move(index: number, delta: -1 | 1) {
    const a = active[index];
    const b = active[index + delta];
    if (!a || !b) return;
    if (a.sort_order !== b.sort_order) {
      void run([
        () => supabase.from("menu_items").update({ sort_order: b.sort_order }).eq("id", a.id),
        () => supabase.from("menu_items").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
      return;
    }
    // Trùng thứ tự: đổi chỗ hai giá trị bằng nhau không làm gì, nên đánh số lại theo thứ tự đang hiện
    const order = [...active];
    order[index] = b;
    order[index + delta] = a;
    void run(
      [...order, ...archived].flatMap((item, i) =>
        item.sort_order === i + 1
          ? []
          : [() => supabase.from("menu_items").update({ sort_order: i + 1 }).eq("id", item.id)],
      ),
    );
  }

  function archive(item: OwnerMenuItem) {
    if (hide.armed !== item.id) return hide.arm(item.id);
    hide.reset();
    void run([() => supabase.from("menu_items").update({ is_archived: true }).eq("id", item.id)]);
  }

  function restore(item: OwnerMenuItem) {
    // Món đã ẩn không có nút Đổi tên, nên câu lỗi chỉ cách sửa làm được (ui-craft.md)
    if (menuNameError(item.name, items, item.id))
      return setError("Đã có món đang bán tên này. Đổi tên hoặc ẩn món đang bán đó rồi hiện lại.");
    void run([() => supabase.from("menu_items").update({ is_archived: false }).eq("id", item.id)]);
  }

  // Màu viền tách riêng: nút phá hủy phải có viền danger, không bị border-edge đè (Tailwind xếp tiện ích theo tên)
  const button =
    "flex min-h-12 min-w-12 items-center justify-center rounded-md border px-3 text-sm disabled:opacity-40";
  const small = `${button} border-edge`;
  const field = "min-h-12 rounded-lg border border-edge bg-transparent p-2";
  return (
    <div className="space-y-6">
      {active.length === 0 ? (
        <p className="text-sm text-ink-muted">Chưa có món nào đang bán. Thêm món ở ô bên dưới.</p>
      ) : (
        <ul className="divide-y divide-line">
          {active.map((item, i) => (
            <li key={item.id} className="space-y-2 py-3">
              {editing?.id === item.id ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveEdit();
                  }}
                >
                  <input
                    autoFocus
                    aria-label={
                      editing.field === "name" ? `Tên mới cho ${item.name}` : `Giá mới cho ${item.name}`
                    }
                    inputMode={editing.field === "price" ? "numeric" : undefined}
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                    onKeyDown={(e) => e.key === "Escape" && closeEdit()}
                    aria-invalid={editError !== null}
                    aria-describedby={editError ? `edit-error-${item.id}` : undefined}
                    className={`${field} min-w-40 flex-1 tabular-nums`}
                  />
                  <button type="submit" disabled={locked} className={small}>
                    Lưu
                  </button>
                  <button type="button" className={small} onClick={closeEdit}>
                    Bỏ qua
                  </button>
                  {editError && (
                    <p id={`edit-error-${item.id}`} role="alert" className="w-full text-sm text-danger">
                      {editError}
                    </p>
                  )}
                </form>
              ) : (
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 break-words font-display text-xl tracking-wide">
                    {item.name}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatVnd(item.price)}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={small}
                  aria-label={`Đưa ${item.name} lên`}
                  disabled={locked || i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ChevronUp aria-hidden="true" size={18} />
                </button>
                <button
                  type="button"
                  className={small}
                  aria-label={`Đưa ${item.name} xuống`}
                  disabled={locked || i === active.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ChevronDown aria-hidden="true" size={18} />
                </button>
                <button
                  type="button"
                  className={small}
                  aria-label={`Đổi tên ${item.name}`}
                  disabled={locked}
                  onClick={() => openEdit({ id: item.id, field: "name", value: item.name })}
                >
                  Đổi tên
                </button>
                <button
                  type="button"
                  className={small}
                  aria-label={`Đổi giá ${item.name}`}
                  disabled={locked}
                  onClick={() => openEdit({ id: item.id, field: "price", value: String(item.price) })}
                >
                  Đổi giá
                </button>
                <button
                  type="button"
                  className={`${button} ml-auto ${hide.armed === item.id ? "border-danger bg-danger text-ember-ink" : "border-danger/70 text-danger"}`}
                  aria-label={hide.armed === item.id ? `Chắc chắn ẩn ${item.name}?` : `Ẩn ${item.name}`}
                  disabled={locked}
                  onClick={() => archive(item)}
                >
                  {hide.armed === item.id ? "Chắc chắn ẩn?" : "Ẩn"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="VD: Highball"
          aria-label="Tên món mới"
          className={`${field} min-w-40 flex-1`}
        />
        <input
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          placeholder="VD: 120.000"
          inputMode="numeric"
          aria-label="Giá món mới"
          className={`${field} w-36 tabular-nums`}
        />
        <button
          type="submit"
          disabled={locked}
          className="min-h-12 rounded-lg bg-ember px-5 font-bold text-ember-ink disabled:opacity-50"
        >
          Thêm món
        </button>
      </form>

      {archived.length > 0 && (
        <details>
          <summary className="flex min-h-12 cursor-pointer items-center text-sm text-ink-muted">
            Món đã ẩn ({archived.length})
          </summary>
          <ul>
            {archived.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-1">
                <span className="flex-1 text-ink-muted">{item.name}</span>
                <span className="text-sm tabular-nums text-ink-muted">{formatVnd(item.price)}</span>
                <button
                  type="button"
                  className={small}
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
