"use client";
import { Download } from "lucide-react";
import { useState } from "react";
import { ownerErrorText } from "@/lib/admin/errors";
import { csvFileName, LINES_SELECT, ordersToCsv, type CsvOrder } from "@/lib/csv";
import { getBrowserSupabase } from "@/lib/supabase/client";

const BATCH = 1000;

// SRS FR-07a: xuất toàn bộ đơn trong khoảng đang lọc, không chỉ trang đang xem
export function ExportCsvButton({ from, to }: { from: string; to: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportCsv() {
    setBusy(true);
    setError(null);
    const supabase = getBrowserSupabase();
    const rows: CsvOrder[] = [];
    for (let start = 0; ; start += BATCH) {
      const { data, error } = await supabase
        .from("orders")
        .select(`created_at, paid_at, business_date, seat_name, discount_percent, discount_amount, status, payment_method, ${LINES_SELECT}`)
        .gte("business_date", from)
        .lte("business_date", to)
        .order("created_at")
        .order("id")
        .order("sort_order", { referencedTable: "order_lines" })
        .range(start, start + BATCH - 1);
      if (error) {
        setError(ownerErrorText(error));
        return setBusy(false);
      }
      rows.push(...(data as unknown as CsvOrder[]));
      if (data.length < BATCH) break;
    }
    const url = URL.createObjectURL(
      new Blob([ordersToCsv(rows)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = csvFileName(from, to);
    link.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void exportCsv()}
        className="flex h-12 items-center gap-2 rounded-[14px] bg-surface pr-4.5 pl-3.5 text-sm font-semibold disabled:opacity-50"
      >
        <Download aria-hidden="true" size={18} />
        {busy ? "Đang xuất…" : "Xuất CSV"}
      </button>
      {error && (
        <span role="alert" className="text-danger">
          {error}
        </span>
      )}
    </span>
  );
}
