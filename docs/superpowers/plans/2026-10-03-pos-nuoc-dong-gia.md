# POS Quán Nước Đồng Giá – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây web app (cài được ra màn hình chính) cho quán nước đồng giá: màn hình order cho nhân viên và trang quản lý cho chủ quán, đúng theo SRS v1.3.

**Architecture:** Mọi quy tắc về tiền, quyền và thời gian nằm trong **hàm Postgres** của Supabase (`SECURITY DEFINER`) và được kiểm thử bằng pgTAP. Next.js là lớp giao diện mỏng.
- Nhân viên đăng nhập vào **một tài khoản Supabase chung**, với mật khẩu là PIN quán.
- Chủ quán dùng tài khoản riêng.
- Quyền xác định qua bảng `app_roles`. Mỗi lần kiểm tra quyền, server xác nhận phiên đăng nhập vẫn còn tồn tại, nên đổi PIN quán có hiệu lực ngay.
- Không có chế độ offline, không có service worker.

**Tech Stack:**
- Next.js 15 (App Router, TypeScript), Tailwind CSS v4.
- Supabase (Postgres, pgcrypto, pgTAP, Realtime, Auth), Supabase CLI (chạy local, cần Docker).
- `@supabase/supabase-js`, `@supabase/ssr`.
- Vitest + Testing Library.

**Spec:** [`docs/SRS.md`](../../SRS.md). **Thuật ngữ:** [`GLOSSARY.md`](../../../GLOSSARY.md).

## Global Constraints

- **SRS là chuẩn.** Có mâu thuẫn giữa kế hoạch và SRS thì làm theo SRS, đồng thời báo lại cho người dùng.
- Đặt tên trong code và chữ trên giao diện theo đúng `GLOSSARY.md`. Ví dụ dùng "Thành tiền", không dùng "Tổng tiền".
- Tiền là **số nguyên VND** (`integer`). Hiển thị theo định dạng `25.000đ`.
- Múi giờ hiển thị là `Asia/Ho_Chi_Minh`. DB lưu `timestamptz`.
- Giao diện **chỉ dùng tiếng Việt**.
- Các giới hạn:
  - Số lượng: `1 ≤ quantity ≤ 500`.
  - Cửa sổ hủy: **5 phút**.
  - PIN quán: **đúng 6 chữ số**.
  - Giờ mở cửa mặc định: `20` (quán mở từ 20:00 đến 02:00).
- Nút thao tác chính trên `/order` cao **ít nhất 56px** (`min-h-14`).
- Mọi kiểm tra quyền chạy ở server. **Không bao giờ** đưa `SUPABASE_SERVICE_ROLE_KEY` lên Vercel hoặc vào code chạy trên trình duyệt.
- Không bao giờ xóa cứng `orders` hoặc `seats`.
- Dùng Next.js **15** (`create-next-app@15`).
- **Giao diện:**
  - Màn hình order **đã chốt hướng thiết kế**: `docs/design/order-brief.md` (Phơi sáng dài). Đọc brief này trước Task 8–10. Khi bắt đầu dựng, ghi phần "Direction contract" vào surface brief.
  - Trước Task 11, làm tương tự cho trang chủ quán.
  - Code mẫu UI trong kế hoạch chỉ quy định cấu trúc và hành vi. Màu, font và icon theo `.claude/rules/ui-craft.md` và hướng thiết kế đã chốt.
  - Sau khi dựng xong giao diện, impeccable ghi lại hệ thiết kế thật vào `DESIGN.md`.
- **Ngoài phạm vi, không được làm:** chế độ offline, service worker, IndexedDB, biểu đồ, E2E, quản lý từng thiết bị.
- Mọi commit kết thúc bằng dòng trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Docker Desktop phải đang chạy** trước mọi lệnh `npx supabase start | db reset | test db`.

## Review Focus

1. **Mạng rớt sau khi server đã ghi đơn, nhân viên bấm gửi lại**: không được tạo đơn thứ hai. Đã kiểm thử ở Task 4 (pgTAP, gọi `create_order` 2 lần cùng id) và Task 10 (bấm lại dùng cùng id).
2. **Đổi PIN quán khi điện thoại cũ vẫn còn token**: lần thao tác tiếp theo bị từ chối và điện thoại quay về `/login`. Đã kiểm thử ở Task 3 (phiên bị xóa thì `is_staff()` trả về false) và Task 10 (`FORBIDDEN` thì gọi `onUnauthorized`).
3. **Đơn giá chung đổi ngay trước khi nhân viên bấm Xác nhận**: server tính theo giá mới và màn hình báo cho nhân viên. Đã kiểm thử ở Task 4 và Task 10.
4. **Đơn quanh giờ chuyển ngày** (05:59 và 06:00 giờ VN): mỗi đơn được gán đúng `business_date`. Đã kiểm thử ở Task 2 và Task 4.
5. **Nhân viên hủy đơn đã quá 5 phút, hoặc gọi RPC chỉ dành cho chủ quán**: bị từ chối. Đã kiểm thử ở Task 5 và Task 6.

## Cấu trúc file

```text
GLOSSARY.md
docs/SRS.md, docs/deploy.md, docs/manual-test.md
supabase/
  config.toml                          # enable_signup = false
  migrations/
    20261003000100_schema.sql          # bảng, RLS cơ bản, business_date, realtime
    20261003000200_roles_pin.sql       # app_roles, is_owner, is_staff, set_shop_pin, policy cho chủ quán
    20261003000300_create_order.sql    # create_order, list_active_seats
    20261003000400_cancel_list.sql     # cancel_order, list_orders_by_ids
    20261003000500_owner_reports.sql   # update_price, update_business_day_start_hour, dashboard_summary, history_totals
  seed.sql                             # 12 ghế quầy, 3 bàn (chỉ dùng local)
  tests/*.test.sql                     # pgTAP
scripts/create-user.mjs                # tạo tài khoản owner hoặc staff
src/
  lib/money.ts, lib/time.ts, lib/csv.ts
  lib/supabase/{client,server}.ts
  lib/api.ts                           # RpcClient, StaffApi, NetworkError, RpcError
  lib/order/{quantity,myOrders}.ts
  lib/admin/{validate,range}.ts
  hooks/{useOnline,useCurrentPrice}.ts
  components/order/*.tsx
  components/admin/*.tsx
  app/{layout.tsx,page.tsx,manifest.ts}
  app/icons/[size]/route.tsx
  app/login/page.tsx
  app/order/page.tsx
  app/admin/login/page.tsx
  app/admin/(protected)/{layout.tsx,dashboard,history,settings}
  middleware.ts
tests/unit/**                          # vitest
```

## Giai đoạn và task

| Giai đoạn | File | Task |
|---|---|---|
| 1. Database | [phase-1-database.md](2026-10-03-pos-nuoc-dong-gia/phase-1-database.md) | 1. Khởi tạo · 2. Schema · 3. Vai trò & PIN quán · 4. `create_order` · 5. Hủy đơn & đơn của điện thoại · 6. RPC chủ quán & báo cáo |
| 2. Màn hình order | [phase-2-order.md](2026-10-03-pos-nuoc-dong-gia/phase-2-order.md) | 7. API client & đơn của điện thoại · 8. Bàn phím số lượng · 9. Đăng nhập PIN & giá realtime · 10. OrderScreen |
| 3. Chủ quán | [phase-3-admin.md](2026-10-03-pos-nuoc-dong-gia/phase-3-admin.md) | 11. Đăng nhập chủ quán, middleware, script · 12. Cài đặt · 13. Tổng quan, lịch sử & CSV |
| 4. Phát hành | [phase-4-pwa-release.md](2026-10-03-pos-nuoc-dong-gia/phase-4-pwa-release.md) | 14. Manifest, tài liệu và kiểm tra tay |

Thực hiện các task **theo đúng thứ tự**. Mỗi task kết thúc với test xanh và một commit.

## Hợp đồng dùng chung

**Mã lỗi RPC** (nằm trong `error.message`, SQLSTATE là `P0001`): `FORBIDDEN`, `INVALID_QUANTITY`, `INVALID_SEAT`, `SEAT_NOT_FOUND`, `ORDER_NOT_FOUND`, `CANCEL_WINDOW_EXPIRED`, `INVALID_PRICE`, `INVALID_HOUR`, `INVALID_PIN_FORMAT`, `STAFF_ACCOUNT_MISSING`.

**Hàm SQL:**

| Hàm | Ai gọi được | Trả về |
|---|---|---|
| `is_owner()`, `is_staff()` | Mọi người. `is_staff` đúng cho cả nhân viên và chủ quán. | `boolean` |
| `current_business_date()` | Đã đăng nhập | `date` |
| `create_order(p_id uuid, p_quantity int, p_seat_id uuid, p_is_takeaway bool, p_client_price int)` | `is_staff` | `jsonb` có dạng `CreatedOrder` |
| `list_active_seats()` | `is_staff` | `table (id uuid, name text, kind text)`, sắp theo `kind`, `sort_order`, `name` |
| `cancel_order(p_order_id uuid)` | `is_staff`. Nhân viên chỉ hủy được trong 5 phút. | `void` |
| `list_orders_by_ids(p_ids uuid[])` | `is_staff` | `table (id, quantity, unit_price, total_amount, seat_name, status, created_at)`, chỉ các đơn thuộc ngày kinh doanh hiện tại |
| `set_shop_pin(p_pin text)` | `is_owner` | `void` |
| `update_price(p_price int)`, `update_business_day_start_hour(p_hour int)` | `is_owner` | `void` |
| `dashboard_summary(p_today date default null)` | `is_owner` | `jsonb {business_date, today_revenue, today_cups, month_revenue}` |
| `history_totals(p_from date, p_to date)` | `is_owner` | `jsonb {revenue, cups, order_count}` |

**Kiểu TypeScript** (định nghĩa ở `src/lib/api.ts`, Task 7):

```ts
export type CreateOrderInput = { id: string; quantity: number; seatId: string | null; isTakeaway: boolean; clientPrice: number };
export type CreatedOrder = {
  id: string; unit_price: number; total_amount: number; price_changed: boolean;
  created_at: string; business_date: string; duplicate: boolean;
};
export type MyOrder = {
  id: string; quantity: number; unit_price: number; total_amount: number;
  seat_name: string | null; status: "paid" | "cancelled"; created_at: string;
};
export type ActiveSeat = { id: string; name: string; kind: "table" | "counter" };
export interface StaffApi {
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  cancelOrder(orderId: string): Promise<void>;
  listOrdersByIds(ids: string[]): Promise<MyOrder[]>;
  listActiveSeats(): Promise<ActiveSeat[]>;
}
```

**Biến môi trường:**

| Biến | Dùng ở đâu | Có lên Vercel không |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Trình duyệt và server | Có |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Trình duyệt và server | Có |
| `NEXT_PUBLIC_STAFF_EMAIL` | Màn hình nhập PIN (email của tài khoản nhân viên chung) | Có |
| `SUPABASE_SERVICE_ROLE_KEY` | **Chỉ** `scripts/create-user.mjs`, chạy trên máy dev | **Không bao giờ** |
