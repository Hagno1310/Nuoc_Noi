# Đợt 4: Thanh toán (tiền mặt / chuyển khoản kèm ảnh), Lịch sử đơn hàng, CSV và chữ gốc 16px

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nhân viên chọn Tiền mặt hoặc Chuyển khoản trước khi đơn được ghi. Chuyển khoản thì hiện QR rồi bắt buộc chụp ảnh lên Cloudinary. Chủ quán và nhân viên xem lại được ảnh. Đợt này dựng lại Lịch sử đơn hàng và CSV theo v3.0 (phần đợt 4 còn nợ) kèm hình thức thanh toán, và đổi chữ gốc lên 16px.

**Architecture:**
- **Database:** một migration thêm `payment_method` và `transfer_photo_id` vào `orders`. `create_order` nhận thêm 6 tham số (thay bản 4 tham số); `list_orders_by_ids` trả thêm 2 cột; `history_totals` tách doanh thu theo hình thức thanh toán.
- **Server Next.js:** route `POST /api/transfer-photo/sign`. Route kiểm tra `is_staff()` rồi ký public_id do server sinh bằng `CLOUDINARY_API_SECRET`. Đây là chỗ duy nhất đọc secret.
- **Trình duyệt:**
  - `uploadTransferPhoto` xin chữ ký rồi upload thẳng lên Cloudinary. `shrinkImage` thu nhỏ ảnh bằng canvas.
  - `PaymentSheet` (`<dialog>` gốc) gồm 3 bước: chọn → QR → xem trước.
  - `OrderScreen` giữ public_id ảnh qua `MENU_CHANGED` và lỗi mạng.
- **Xem ảnh:** `src/components/TransferPhoto.tsx` dùng chung cho Đơn vừa tạo và Lịch sử đơn hàng.
- **Lịch sử đơn hàng:** server component đọc `orders` kèm `order_lines` qua RLS. Mỗi đơn là một `<details>`, hỗ trợ `?order=`.

**Tech Stack:** Supabase (Postgres, pgTAP), Next.js 15 route handler, React 19, Tailwind v4, Vitest + Testing Library, lucide-react, Cloudinary Upload API (gọi bằng `fetch`, không thêm thư viện), `node:crypto`.

**Spec:**
- `docs/superpowers/specs/2026-10-07-thanh-toan-design.md` (thanh toán, ảnh, chữ gốc 16px).
- `docs/SRS.md` v3.3 sau Task 1: FR-04, FR-04b, FR-04c, FR-06a, FR-07, FR-07a, §4, NFR-04, R39, R40.
- Phần đợt 4 còn nợ: `docs/superpowers/plans/2026-10-05-dot-1-database-thuc-don.md:819`.

## Global Constraints

- **Thanh toán xong mới tạo đơn.** Không có trạng thái chờ thanh toán. Đơn ghi ra là `paid` như hiện nay; doanh thu, cửa sổ hủy, Hoàn tác giữ nguyên.
- **`payment_method`** ∈ `cash` | `transfer`. **`transfer_photo_id`** khớp `^nuoc-noi/transfer/[0-9a-f-]{36}$`. Chuyển khoản phải có ảnh; tiền mặt không được có ảnh. Mã lỗi: `PAYMENT_REQUIRED`, `PHOTO_REQUIRED`, `INVALID_PAYMENT`.
- **Secret:**
  - `CLOUDINARY_API_KEY` và `CLOUDINARY_API_SECRET` chỉ được đọc trong `src/app/api/transfer-photo/sign/route.ts`.
  - Biến công khai mới: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
  - Không ghi giá trị thật vào repo.
- **Không thêm dependency.** Camera là `<input type="file" accept="image/*" capture="environment">`. Nén ảnh bằng `<canvas>`. Ký bằng `node:crypto`.
- **Câu chữ cố định:**
  - Tấm thanh toán: "Khách trả bằng?", "Tiền mặt", "Chuyển khoản", "Quét mã để chuyển khoản", "Chụp ảnh chuyển khoản", "Kiểm tra ảnh", "Chụp lại", "Xác nhận đã thanh toán", "Đang tải ảnh…", "Đang gửi…", "Quay lại", "Thử lại".
  - Lỗi upload: "Chưa tải được ảnh – kiểm tra mạng rồi thử lại."
  - Ảnh không tải được: "Không tải được ảnh."
  - Nhãn: "Tiền mặt" / "Chuyển khoản"; cột "Thanh toán".
- **Câu chữ SRS giữ nguyên:** "Xác nhận đơn", "Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại.", "Đơn này đã bị hủy – bấm Xác nhận đơn để tạo đơn mới.", "Đã tạo đơn N món – X đ".
- **CSV:** 9 cột `Thời gian, Ngày kinh doanh, Chỗ ngồi, Món, Số lượng, Đơn giá, Thành tiền, Trạng thái, Thanh toán`; BOM; CRLF; chặn `= + - @`.
- **Thế giới "Bao diêm quán bar":**
  - Token: `bg`, `surface`, `raised`, `line`, `edge`, `ink`, `ink-muted`, `ember`, `ember-ink`, `warn`, `danger`.
  - Một khối mực cam mỗi màn. Đường kẻ 1px; không bóng đổ, không quầng sáng.
  - Thang chữ và lưới 4px của `DESIGN.md`; thêm 20 và 32px khi cần.
- **Vùng chạm** ≥ 48px; nút chính màn order ≥ 56px (NFR-02). Số `tabular-nums`. Icon lucide có `aria-hidden` hoặc nằm trong nút có `aria-label`.
- **Chữ gốc 16px ở mọi cỡ màn** (R40). Ô nhập vẫn `max(16px, 1em)`.
- **Thuật ngữ:** Hình thức thanh toán, Tiền mặt, Chuyển khoản, Ảnh chuyển khoản. Không dùng "bill", "hóa đơn", "biên lai" trong giao diện, tên biến và commit.

## Review Focus

1. **Chụp lại khi ảnh trước chưa tải xong:** ảnh của lần chụp sau mới được gửi kèm đơn. Kết quả upload cũ về muộn không được đè lên. → Task 4, test "chụp lại khi ảnh trước chưa tải xong".
2. **Lỗi mạng lúc gửi đơn chuyển khoản:** tấm thanh toán giữ nguyên ảnh. Bấm lại dùng cùng `id` và cùng ảnh, không bắt chụp lại. → Task 4, test "lỗi mạng khi gửi chuyển khoản".
3. **Bấm hai lần liên tiếp vào nút gửi trong tấm thanh toán:** chỉ một lần gọi `create_order`. → Task 4, test "bấm hai lần chỉ gửi một lần".
4. **Cloudinary trả về 200 nhưng `public_id` khác cái đã ký**, hoặc trả HTML lỗi: coi là upload thất bại, không gửi đơn với id lạ. → Task 3, test `uploadTransferPhoto`.
5. **Phiên đăng nhập bị thu hồi giữa lúc chụp ảnh** (đổi PIN quán): route ký trả 401 thì màn order đăng xuất về `/login`, giống `FORBIDDEN`. → Task 4, test "upload bị từ chối quyền".

## Lưu ý cho người thực hiện

- **Trước khi bắt đầu:** working tree đang có thay đổi chưa commit của chủ quán ở `DESIGN.md`, `PRODUCT.md`, `.impeccable/*`, `docs/design/order-brief.md`, spec 2026-10-04 và `scripts/screenshots.mjs`. Hỏi chủ quán commit những thay đổi đó trước. Không tự stash và không gộp chúng vào commit của đợt này. Task 8 sửa `DESIGN.md`, nên phần của chủ quán phải được commit trước.
- **Bước nào dùng database:** Docker Desktop phải chạy. Dùng `npx supabase db reset && npx supabase test db`; reset xong tạo lại tài khoản thử theo README.
- **Không chạy `next build`** khi `npm run dev` đang chạy.
- **Không `db push` lên prod.** Task 9 chỉ soạn bàn giao để chủ quán tự chạy.
- **Cloudinary thật** chỉ cần cho bước kiểm tay. Test tự động mock `fetch` và route.

---

### Task 1: Tài liệu SRS v3.3, GLOSSARY, rules

**Files:**
- Modify: `docs/SRS.md`
- Modify: `GLOSSARY.md`
- Modify: `.claude/rules/secrets.md`
- Modify: `.claude/rules/owner-ui.md`
- Modify: `docs/superpowers/specs/2026-10-07-thanh-toan-design.md` (§4.2)
- Modify: `docs/deploy.md`

**Interfaces:**
- Produces: mã mục SRS mà các task sau trích dẫn: FR-04c (tấm thanh toán), R39 (thanh toán), R40 (chữ gốc 16px).

- [ ] **Step 1: Bảng đầu SRS**

Trong `docs/SRS.md`, đổi `| **Phiên bản** | 3.2 |` thành `| **Phiên bản** | 3.3 |` và `| **Ngày cập nhật** | 2026-10-04 |` thành `| **Ngày cập nhật** | 2026-10-07 |`. Chèn ngay trên dòng `| **Thay đổi ở v3.2** |…`:

```markdown
| **Thay đổi ở v3.3** | **Hình thức thanh toán**: nhân viên chọn tiền mặt hoặc chuyển khoản trước khi đơn được ghi; chuyển khoản hiện mã QR của quán và bắt buộc chụp **ảnh chuyển khoản** (lưu trên Cloudinary). Lịch sử đơn hàng, Đơn vừa tạo và CSV có hình thức thanh toán; xem lại được ảnh (R39). Chữ gốc 16px ở mọi cỡ màn (R40). Thiết kế: `docs/superpowers/specs/2026-10-07-thanh-toan-design.md`. |
```

- [ ] **Step 2: §1.2, §1.3, §2.1**

Trong bảng §1.2, dòng Nhân viên đổi cột "Mục đích" thành: `Tạo đơn hàng, thu tiền (tiền mặt hoặc chuyển khoản kèm ảnh); hủy đơn bấm nhầm trong cửa sổ hủy`.

Trong §1.3 "Trong phạm vi", thêm sau dòng "- Tạo đơn hàng gồm nhiều món…":

```markdown
- Hình thức thanh toán: tiền mặt, hoặc chuyển khoản qua mã QR cố định của quán kèm ảnh chuyển khoản.
```

Trong "Ngoài phạm vi", thay dòng `- Hình thức thanh toán.` bằng:

```markdown
- Đối soát tự động với ngân hàng; mã QR có sẵn số tiền của đơn.
```

Trong bảng §2.1, thêm dòng sau dòng Backend:

```markdown
| Lưu ảnh | Cloudinary (gói miễn phí). Server Next.js chỉ ký yêu cầu upload; trình duyệt upload thẳng lên Cloudinary. |
```

- [ ] **Step 3: FR-04 và FR-04c mới**

Trong FR-04, ngay sau dòng đầu tiên `- Nút "Xác nhận đơn" bị khóa khi …`, thêm:

```markdown
- Bấm "Xác nhận đơn" thì mở **tấm thanh toán** (FR-04c). Đơn chỉ được gửi từ tấm thanh toán.
```

Trong FR-04, dòng `- Client gửi lên \`id\` (UUID do client sinh), chỗ ngồi, phần trăm giảm giá, và các dòng đơn (món, số lượng, giá đang hiển thị).` thêm vào cuối câu, trước dấu chấm: `, hình thức thanh toán và mã ảnh chuyển khoản (nếu có)`.

Chèn mục mới ngay trước `**FR-04b: Đơn vừa tạo và hủy đơn**`:

```markdown
**FR-04c: Thanh toán**
- Tấm thanh toán chiếm toàn màn hình trên điện thoại và là hộp thoại giữa màn trên màn rộng. Tấm luôn hiện chỗ ngồi đang chọn và Thành tiền cỡ lớn.
- **Bước chọn:** "Khách trả bằng?" với hai nút **Tiền mặt** và **Chuyển khoản**. Mọi bước có nút "Quay lại": đóng tấm, giữ nguyên giỏ đơn, giảm giá và chỗ ngồi; chưa đơn nào được ghi.
- **Tiền mặt:** gửi đơn ngay (FR-04).
- **Chuyển khoản:**
  - Hiện mã QR chuyển khoản của quán và Thành tiền, kèm nút "Chụp ảnh chuyển khoản". **Không có cách bỏ qua bước chụp ảnh.**
  - Chụp xong thì hiện ảnh để kiểm tra ("Kiểm tra ảnh"), kèm nút "Chụp lại". Ảnh được tải lên ngay. Nút "Xác nhận đã thanh toán" bị khóa và hiện "Đang tải ảnh…" cho tới khi tải xong.
  - Tải ảnh lỗi thì báo "Chưa tải được ảnh – kiểm tra mạng rồi thử lại." kèm nút "Thử lại".
  - Bấm "Xác nhận đã thanh toán" thì gửi đơn kèm ảnh.
- **Server từ chối** hình thức thanh toán không hợp lệ (`PAYMENT_REQUIRED`), đơn chuyển khoản không có ảnh hợp lệ (`PHOTO_REQUIRED`), và đơn tiền mặt có kèm ảnh (`INVALID_PAYMENT`).
- **Gửi thất bại vì lỗi mạng:** giữ tấm thanh toán và ảnh; lần bấm lại dùng cùng `id`.
- **Thực đơn vừa đổi** hoặc **đơn đã bị hủy** (FR-04): đóng tấm và báo như FR-04. Ảnh đã tải lên được giữ; lần mở tấm sau, chọn Chuyển khoản thì vào thẳng bước kiểm tra ảnh. Ảnh giữ lại bị bỏ khi gửi đơn thành công hoặc khi bấm "Xóa hết".
```

- [ ] **Step 4: FR-04b, FR-06a, FR-07, FR-07a**

FR-04b: sau dòng `- Mỗi đơn ghi giờ · chỗ ngồi · …`, thêm:

```markdown
- Đơn chuyển khoản có nút icon máy ảnh cạnh thành tiền ("Xem ảnh chuyển khoản"); bấm thì xem ảnh toàn màn hình, có nút "Đóng".
```

FR-07: thay dòng `- **Cột:** Thời gian (giờ VN), Chỗ ngồi, Số món, Giảm giá, Thành tiền, Trạng thái.` bằng `- **Cột:** Thời gian (giờ VN), Chỗ ngồi, Số món, Giảm giá, Thành tiền, Thanh toán, Trạng thái.`. Trong hai gạch con ngay dưới:
- Đổi `đủ 6 trường trên. Từ tablet trở lên là bảng 6 cột.` thành `đủ 7 trường trên. Từ tablet trở lên là bảng 7 cột.` và thêm `, hình thức thanh toán` sau `"N món" kèm "−N%" nếu có giảm giá`.
- Đổi `rồi Tạm tính, Giảm giá, Thành tiền.` thành `rồi Tạm tính, Giảm giá, Thành tiền, hình thức thanh toán, và ảnh chuyển khoản thu nhỏ (bấm vào để xem to; ảnh không tải được thì báo "Không tải được ảnh.").`

FR-07, dòng `- **Dòng tổng** …` thay bằng:

```markdown
- **Dòng tổng** của khoảng đang lọc: số đơn, số món, doanh thu, tổng số tiền đã giảm ("Đã giảm X đ"), và doanh thu tách theo hình thức thanh toán ("Tiền mặt X đ · Chuyển khoản Y đ").
```

FR-07a: thay dòng `- 8 cột: …` bằng:

```markdown
- 9 cột: `Thời gian, Ngày kinh doanh, Chỗ ngồi, Món, Số lượng, Đơn giá, Thành tiền, Trạng thái, Thanh toán`. Cột Thanh toán ghi "Tiền mặt" hoặc "Chuyển khoản", lặp ở mọi hàng của đơn. Không xuất ảnh.
```

- [ ] **Step 5: §4, NFR-04, §6, Phụ lục A**

§4, dòng `orders`: thêm vào cuối danh sách cột, trước dấu `|` cuối: `, \`payment_method\` (\`cash\`/\`transfer\`), \`transfer_photo_id\` (public_id ảnh trên Cloudinary; bắt buộc khi \`transfer\`, trống khi \`cash\`)`. Thêm dòng ghi chú ngay dưới bảng:

```markdown
Đơn tạo trước v3.3 có `payment_method = 'cash'` vì khi đó app chưa ghi hình thức thanh toán.
```

NFR-04: thay bằng:

```markdown
| NFR-04 | Mọi kiểm tra quyền chạy ở server. Không có chức năng tự đăng ký. Không bao giờ đưa service_role key lên Vercel. `CLOUDINARY_API_SECRET` chỉ nằm ở server Vercel (không có tiền tố `NEXT_PUBLIC_`) và chỉ route ký upload đọc nó; route chỉ ký cho nhân viên hoặc chủ quán đang đăng nhập. |
```

§6, gạch "Cài đặt ban đầu": thêm `  - Tạo tài khoản Cloudinary, đặt \`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME\`, \`CLOUDINARY_API_KEY\`, \`CLOUDINARY_API_SECRET\` trên Vercel.` trước dòng "Deploy lên Vercel."

Phụ lục A, thêm cuối bảng:

```markdown
| R39 (v3.3) | Thanh toán | Chọn tiền mặt hoặc chuyển khoản trước khi đơn được ghi; không có trạng thái chờ thanh toán. Chuyển khoản: QR cố định của quán, bắt buộc chụp ảnh, xem trước và chụp lại được; ảnh lưu trên Cloudinary, DB lưu public_id. Upload có chữ ký do server cấp. Xem lại ảnh ở Đơn vừa tạo và Lịch sử đơn hàng. Dòng tổng tách tiền mặt / chuyển khoản; CSV thêm cột Thanh toán. Thay Q9. |
| R40 (v3.3) | Chữ gốc | 16px ở mọi cỡ màn, thay mức 15px dưới `lg` của R31. Vùng chạm và ô nhập giữ như R31. |
```

- [ ] **Step 6: GLOSSARY**

Trong `GLOSSARY.md`, thay mục **Đã thanh toán** bằng:

```markdown
**Đã thanh toán** (Paid):
Trạng thái mặc định của đơn hàng: khách đã trả bằng tiền mặt hoặc chuyển khoản trước khi đơn được ghi.
_Avoid_: Hoàn thành, đã chốt
```

Thêm mục mới ngay sau mục **Cửa sổ hủy**, trước `## Con người`:

```markdown
## Thanh toán

**Hình thức thanh toán** (Payment method):
Cách khách trả tiền cho một đơn hàng: tiền mặt hoặc chuyển khoản. Nhân viên chọn trước khi đơn được ghi.
_Avoid_: Phương thức, kiểu trả

**Tiền mặt** (Cash):
Khách trả bằng tiền giấy tại quầy.
_Avoid_: Cash, TM

**Chuyển khoản** (Bank transfer):
Khách quét mã QR của quán và chuyển tiền qua ngân hàng. Bắt buộc có ảnh chuyển khoản.
_Avoid_: CK, banking, QR pay

**Ảnh chuyển khoản** (Transfer photo):
Ảnh nhân viên chụp màn hình xác nhận chuyển tiền trên điện thoại của khách, lưu kèm đơn hàng để đối chiếu.
_Avoid_: Bill, hóa đơn, biên lai, chứng từ
```

- [ ] **Step 7: Rules, spec, deploy**

`.claude/rules/secrets.md`: thay gạch đầu tiên bằng:

```markdown
- **`SUPABASE_SERVICE_ROLE_KEY` chỉ được đọc trong `scripts/`**, là những script chạy trên máy dev. Code trong `src/` chỉ dùng `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STAFF_EMAIL` và `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
- **`CLOUDINARY_API_KEY` và `CLOUDINARY_API_SECRET` chỉ được đọc trong `src/app/api/transfer-photo/sign/route.ts`** (SRS NFR-04). Route đó kiểm tra `is_staff()` trước khi ký, và không bao giờ trả secret về trình duyệt.
```

`.claude/rules/owner-ui.md`: đổi `- **Doanh thu và số cốc chỉ tính đơn đã thanh toán.**` thành `- **Doanh thu và số món chỉ tính đơn đã thanh toán.**`; đổi `BOM, CRLF, 7 cột` thành `BOM, CRLF, 9 cột`.

Spec `docs/superpowers/specs/2026-10-07-thanh-toan-design.md` §4.2: thay hai gạch đầu bằng:

```markdown
- Đơn chuyển khoản có nút icon máy ảnh (lucide `Camera`, vùng chạm 48px) cạnh thành tiền, `aria-label="Xem ảnh chuyển khoản"`. Bấm thì mở **trình xem ảnh** toàn màn hình (ảnh rộng ~1200px), nút "Đóng" ≥ 48px; Esc cũng đóng.
```

`docs/deploy.md` §3 bước 2: thêm sau câu `**Không** thêm service_role key (SRS NFR-04).`:

```markdown
   Thêm `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Cloudinary → Settings → API Keys). Hai biến sau **không** có tiền tố `NEXT_PUBLIC_`.
```

Đặt cùng ba biến vào `.env.local` để chạy local (file không commit).

- [ ] **Step 8: Kiểm tra và commit**

Run: `grep -n "3.3\|FR-04c\|R39\|R40" docs/SRS.md | head -20`
Expected: thấy phiên bản 3.3, mục FR-04c, R39, R40.

```bash
git add docs/SRS.md GLOSSARY.md .claude/rules/secrets.md .claude/rules/owner-ui.md docs/superpowers/specs/2026-10-07-thanh-toan-design.md docs/deploy.md
git commit -m "docs(srs): v3.3 hình thức thanh toán, ảnh chuyển khoản, chữ gốc 16px (R39, R40)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Database: hình thức thanh toán, `create_order` 6 tham số

**Files:**
- Create: `supabase/migrations/20261007000100_payment.sql`
- Create: `supabase/tests/09_payment.test.sql`
- Modify: `supabase/tests/03_create_order.test.sql` (gọi qua hàm tạm 4 tham số)
- Modify: `supabase/tests/05_owner_reports.test.sql:27-29`

**Interfaces:**
- Produces:
  - `public.create_order(p_id uuid, p_seat_id uuid, p_discount_percent integer, p_lines jsonb, p_payment_method text, p_transfer_photo_id text) returns jsonb`; jsonb có thêm `payment_method`, `transfer_photo_id`.
  - `public.list_orders_by_ids(uuid[])` thêm 2 cột `payment_method text`, `transfer_photo_id text` (sau `created_at`, trước `lines`).
  - `public.history_totals(date, date)` jsonb thêm `cash_revenue`, `transfer_revenue`.
  - Cột `orders.payment_method text not null default 'cash'`, `orders.transfer_photo_id text`.

- [ ] **Step 1: Viết test pgTAP mới (đỏ)**

Create `supabase/tests/09_payment.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'), ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');
insert into public.seats (id, name, kind) values ('00000000-0000-0000-0000-0000000000c9', 'Quầy 9', 'counter');
insert into public.menu_items (id, name, price) values ('00000000-0000-0000-0000-0000000000e1', 'Thử A', 190000);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);

-- Tiền mặt
create temp table c1 as select public.create_order('00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'cash', null) as r;
select is((select r ->> 'payment_method' from c1), 'cash', 'đơn tiền mặt');
select is((select transfer_photo_id from public.orders where id = '00000000-0000-0000-0000-000000000101'), null, 'tiền mặt không có ảnh');

-- Chuyển khoản kèm ảnh
create temp table t1 as select public.create_order('00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]',
  'transfer', 'nuoc-noi/transfer/11111111-1111-1111-1111-111111111111') as r;
select is((select (r ->> 'payment_method') || '|' || (r ->> 'transfer_photo_id') from t1),
  'transfer|nuoc-noi/transfer/11111111-1111-1111-1111-111111111111', 'đơn chuyển khoản lưu public_id ảnh');

-- Đầu vào sai
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', null, null)$$,
  'P0001', 'PAYMENT_REQUIRED', 'thiếu hình thức thanh toán');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'card', null)$$,
  'P0001', 'PAYMENT_REQUIRED', 'hình thức thanh toán lạ');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'transfer', null)$$,
  'P0001', 'PHOTO_REQUIRED', 'chuyển khoản thiếu ảnh');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'transfer', 'https://evil.example/x.jpg')$$,
  'P0001', 'PHOTO_REQUIRED', 'ảnh không đúng mẫu public_id');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'cash',
  'nuoc-noi/transfer/11111111-1111-1111-1111-111111111111')$$,
  'P0001', 'INVALID_PAYMENT', 'tiền mặt không được kèm ảnh');

-- Gửi lại cùng id: trả đơn đã ghi trước mọi kiểm tra, kể cả khi lần gửi lại đổi hình thức thanh toán
select is((select public.create_order('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'cash', null)
  ->> 'payment_method'), 'transfer', 'gửi lại cùng id trả về đơn đã ghi');

-- Ràng buộc bảng: không ghi được chuyển khoản thiếu ảnh kể cả khi đi vòng qua RPC
select throws_ok($$insert into public.orders (id, item_count, subtotal_amount, total_amount, seat_id, created_by, business_date, payment_method)
  values (gen_random_uuid(), 1, 1000, 1000, '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000b1', '2026-10-07', 'transfer')$$,
  '23514', null, 'ràng buộc: chuyển khoản phải có ảnh');

-- Đơn vừa tạo trả hình thức thanh toán và ảnh
select is((select payment_method || '|' || transfer_photo_id from public.list_orders_by_ids(array['00000000-0000-0000-0000-000000000102'::uuid])),
  'transfer|nuoc-noi/transfer/11111111-1111-1111-1111-111111111111', 'list_orders_by_ids trả hình thức thanh toán và ảnh');

-- Dòng tổng tách theo hình thức thanh toán
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);
select is((select public.history_totals(public.current_business_date(), public.current_business_date()) ->> 'cash_revenue'),
  '190000', 'doanh thu tiền mặt');
select is((select public.history_totals(public.current_business_date(), public.current_business_date()) ->> 'transfer_revenue'),
  '190000', 'doanh thu chuyển khoản');

-- Quyền thực thi
select ok(not has_function_privilege('anon', 'public.create_order(uuid, uuid, integer, jsonb, text, text)', 'execute'),
  'anon không gọi được create_order');
select hasnt_function('public', 'create_order', array['uuid', 'uuid', 'integer', 'jsonb'], 'bỏ create_order 4 tham số');

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `npx supabase db reset && npx supabase test db`
Expected: `09_payment.test.sql` FAIL (hàm 6 tham số chưa có).

- [ ] **Step 3: Viết migration**

Create `supabase/migrations/20261007000100_payment.sql`:

```sql
-- SRS v3.3 FR-04c, R39: hình thức thanh toán; chuyển khoản bắt buộc có ảnh (public_id Cloudinary).
-- Đơn cũ nhận 'cash': trước v3.3 app không ghi hình thức thanh toán. create_order luôn ghi rõ, không dựa vào default.
alter table public.orders
  add column payment_method text not null default 'cash' check (payment_method in ('cash', 'transfer')),
  add column transfer_photo_id text check (transfer_photo_id ~ '^nuoc-noi/transfer/[0-9a-f-]{36}$'),
  add constraint orders_transfer_photo check ((payment_method = 'transfer') = (transfer_photo_id is not null));

create or replace function public.order_summary(o public.orders, p_duplicate boolean)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'id', o.id, 'item_count', o.item_count, 'subtotal_amount', o.subtotal_amount,
    'discount_percent', o.discount_percent, 'discount_amount', o.discount_amount,
    'total_amount', o.total_amount, 'seat_name', o.seat_name, 'status', o.status,
    'payment_method', o.payment_method, 'transfer_photo_id', o.transfer_photo_id,
    'created_at', o.created_at, 'business_date', o.business_date, 'duplicate', p_duplicate)
$$;

drop function public.create_order(uuid, uuid, integer, jsonb);

create function public.create_order(
  p_id uuid, p_seat_id uuid, p_discount_percent integer, p_lines jsonb,
  p_payment_method text, p_transfer_photo_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_seat_name text;
  v_count integer;
  v_distinct integer;
  v_qty_ok boolean;
  v_price_ok boolean;
  v_items integer;
  v_subtotal bigint;
  v_discount integer;
  v_start smallint;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;

  -- Gửi lại cùng id: trả về đơn đã ghi, kể cả khi thực đơn hoặc hình thức thanh toán đã đổi sau đó
  select * into v_order from public.orders where id = p_id;
  if found then
    return public.order_summary(v_order, true);
  end if;

  if p_discount_percent is null or p_discount_percent < 0 or p_discount_percent > 100 then
    raise exception 'INVALID_DISCOUNT';
  end if;

  if p_seat_id is null then
    raise exception 'SEAT_REQUIRED';
  end if;
  select name into v_seat_name from public.seats where id = p_seat_id and not is_archived;
  if not found then
    raise exception 'SEAT_NOT_FOUND';
  end if;

  -- SRS FR-04c: chuyển khoản bắt buộc có ảnh; tiền mặt không kèm ảnh
  if p_payment_method is null or p_payment_method not in ('cash', 'transfer') then
    raise exception 'PAYMENT_REQUIRED';
  end if;
  if p_payment_method = 'transfer'
     and (p_transfer_photo_id is null or p_transfer_photo_id !~ '^nuoc-noi/transfer/[0-9a-f-]{36}$') then
    raise exception 'PHOTO_REQUIRED';
  end if;
  if p_payment_method = 'cash' and p_transfer_photo_id is not null then
    raise exception 'INVALID_PAYMENT';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) <> 'array'
     or jsonb_array_length(p_lines) < 1 or jsonb_array_length(p_lines) > 30 then
    raise exception 'INVALID_LINES';
  end if;

  -- Đọc dòng đơn; sai kiểu thì báo INVALID_LINES thay vì lỗi Postgres thô
  begin
    select count(*),
           count(distinct (l ->> 'menu_item_id')::uuid),
           bool_and(coalesce((l ->> 'quantity')::integer between 1 and 99, false)),
           coalesce(bool_and((l ->> 'client_price')::integer is not null), false)
    into v_count, v_distinct, v_qty_ok, v_price_ok
    from jsonb_array_elements(p_lines) l;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'INVALID_LINES';
  end;
  if v_distinct <> v_count or not v_price_ok then
    raise exception 'INVALID_LINES';
  end if;
  if not v_qty_ok then
    raise exception 'INVALID_QUANTITY';
  end if;

  -- Khóa các món trong đơn tới hết giao dịch, để giá không đổi giữa lúc kiểm tra và lúc ghi
  perform 1 from public.menu_items
  where id in (select (l ->> 'menu_item_id')::uuid from jsonb_array_elements(p_lines) l)
  for share;

  if exists (
    select 1 from jsonb_array_elements(p_lines) l
    left join public.menu_items m on m.id = (l ->> 'menu_item_id')::uuid
    where m.id is null or m.is_archived or m.price <> (l ->> 'client_price')::integer
  ) then
    raise exception 'MENU_CHANGED' using detail = (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', id, 'name', name, 'price', price, 'is_archived', is_archived)
             order by sort_order, name), '[]'::jsonb)::text
      from public.menu_items);
  end if;

  select sum((l ->> 'quantity')::integer), sum((l ->> 'quantity')::bigint * m.price)
  into v_items, v_subtotal
  from jsonb_array_elements(p_lines) l
  join public.menu_items m on m.id = (l ->> 'menu_item_id')::uuid;
  if v_subtotal > 1000000000 then
    raise exception 'TOTAL_TOO_LARGE';
  end if;
  v_discount := public.discount_amount(v_subtotal, p_discount_percent);

  select business_day_start_hour into v_start from public.settings where id = 1;

  insert into public.orders (id, item_count, subtotal_amount, discount_percent, discount_amount, total_amount,
                             seat_id, seat_name, created_by, created_at, business_date,
                             payment_method, transfer_photo_id)
  values (p_id, v_items, v_subtotal, p_discount_percent, v_discount, v_subtotal - v_discount,
          p_seat_id, v_seat_name, auth.uid(), now(), public.compute_business_date(now(), v_start),
          p_payment_method, p_transfer_photo_id)
  on conflict (id) do nothing
  returning * into v_order;

  if not found then
    select * into v_order from public.orders where id = p_id;
    return public.order_summary(v_order, true);
  end if;

  insert into public.order_lines (order_id, menu_item_id, item_name, unit_price, quantity, sort_order)
  select p_id, m.id, m.name, m.price, (l.value ->> 'quantity')::integer, l.ordinality
  from jsonb_array_elements(p_lines) with ordinality l(value, ordinality)
  join public.menu_items m on m.id = (l.value ->> 'menu_item_id')::uuid;

  return public.order_summary(v_order, false);
end
$$;

revoke execute on function public.create_order(uuid, uuid, integer, jsonb, text, text) from public, anon;
grant execute on function public.create_order(uuid, uuid, integer, jsonb, text, text) to authenticated;

-- SRS FR-04b: Đơn vừa tạo cần hình thức thanh toán và ảnh để xem lại
drop function public.list_orders_by_ids(uuid[]);
create function public.list_orders_by_ids(p_ids uuid[])
returns table (id uuid, item_count integer, subtotal_amount integer, discount_percent integer,
               discount_amount integer, total_amount integer, seat_name text, status text,
               created_at timestamptz, payment_method text, transfer_photo_id text, lines jsonb)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select o.id, o.item_count, o.subtotal_amount, o.discount_percent, o.discount_amount, o.total_amount,
           o.seat_name, o.status, o.created_at, o.payment_method, o.transfer_photo_id,
           (select jsonb_agg(jsonb_build_object(
                     'item_name', ol.item_name, 'unit_price', ol.unit_price,
                     'quantity', ol.quantity, 'line_amount', ol.line_amount) order by ol.sort_order)
            from public.order_lines ol where ol.order_id = o.id)
    from public.orders o
    where o.id = any (p_ids) and o.business_date = public.current_business_date()
    order by o.created_at desc;
end
$$;
revoke execute on function public.list_orders_by_ids(uuid[]) from public, anon;
grant execute on function public.list_orders_by_ids(uuid[]) to authenticated;

-- SRS FR-07 (v3.3): dòng tổng tách doanh thu tiền mặt / chuyển khoản để đối chiếu két và ngân hàng
create or replace function public.history_totals(p_from date, p_to date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  if not public.is_owner() then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'revenue', coalesce(sum(total_amount), 0),
    'item_count', coalesce(sum(item_count), 0),
    'order_count', count(*),
    'discount_total', coalesce(sum(discount_amount), 0),
    'cash_revenue', coalesce(sum(total_amount) filter (where payment_method = 'cash'), 0),
    'transfer_revenue', coalesce(sum(total_amount) filter (where payment_method = 'transfer'), 0))
  into v_result
  from public.orders
  where status = 'paid' and business_date between p_from and p_to;
  return v_result;
end
$$;
```

- [ ] **Step 4: Sửa test cũ gọi `create_order` 4 tham số**

Trong `supabase/tests/03_create_order.test.sql`, ngay sau dòng `select plan(45);` thêm:

```sql
-- create_order có 6 tham số từ v3.3; test này chỉ kiểm tra phần đơn hàng nên gọi qua hàm tạm với tiền mặt
create function pg_temp.co(p_id uuid, p_seat uuid, p_disc integer, p_lines jsonb) returns jsonb
language sql as $$ select public.create_order(p_id, p_seat, p_disc, p_lines, 'cash', null) $$;
```

Rồi thay mọi `public.create_order(` trong file bằng `pg_temp.co(`, trừ dòng thân hàm tạm (dòng có `select public.create_order(p_id, p_seat`):

Run: `sed -i '/select public.create_order(p_id, p_seat/!s/public\.create_order(/pg_temp.co(/g' supabase/tests/03_create_order.test.sql && grep -c "pg_temp.co(" supabase/tests/03_create_order.test.sql`
Expected: `27` (26 lần gọi + 1 dòng định nghĩa).

Trong `supabase/tests/05_owner_reports.test.sql`, thay kỳ vọng của `history_totals`:

```sql
select is(public.history_totals('2026-09-30', '2026-10-15'),
  '{"revenue": 218000, "item_count": 10, "order_count": 4, "discount_total": 7000, "cash_revenue": 218000, "transfer_revenue": 0}'::jsonb,
  'dòng tổng: doanh thu sau giảm, không tính đơn hủy, kèm tổng số tiền đã giảm và tách theo hình thức thanh toán');
```

- [ ] **Step 5: Chạy toàn bộ pgTAP**

Run: `npx supabase db reset && npx supabase test db`
Expected: mọi file PASS, gồm `09_payment.test.sql` 15/15 và `03_create_order.test.sql` 45/45.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261007000100_payment.sql supabase/tests/09_payment.test.sql supabase/tests/03_create_order.test.sql supabase/tests/05_owner_reports.test.sql
git commit -m "feat(db): hình thức thanh toán, chuyển khoản bắt buộc có ảnh; dòng tổng tách tiền mặt/chuyển khoản (SRS v3.3 FR-04c, R39)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Ký upload ở server và upload ảnh từ trình duyệt

**Files:**
- Create: `src/lib/cloudinary.ts`
- Create: `src/lib/cloudinarySign.ts`
- Create: `src/app/api/transfer-photo/sign/route.ts`
- Create: `src/lib/order/transferPhoto.ts`
- Test: `tests/unit/cloudinarySign.test.ts`, `tests/unit/transferPhotoRoute.test.ts`, `tests/unit/order/transferPhoto.test.ts`

**Interfaces:**
- Produces:
  - `TRANSFER_PHOTO_PATTERN: RegExp`; `transferPhotoUrl(publicId: string, width: number): string` (`src/lib/cloudinary.ts`).
  - `signParams(params: Record<string, string | number>, secret: string): string`; `newTransferPhotoId(): string` (`src/lib/cloudinarySign.ts`, chỉ route dùng).
  - `POST /api/transfer-photo/sign` → 200 `{ cloudName, apiKey, publicId, timestamp, signature }` | 401 | 500.
  - `class UploadError extends Error { code: "UNAUTHORIZED" | "FAILED" }`; `uploadTransferPhoto(file: Blob, fetchFn?: typeof fetch): Promise<string>`; `shrinkImage(file: Blob, maxSide?: number): Promise<Blob>` (`src/lib/order/transferPhoto.ts`).

- [ ] **Step 1: Viết test (đỏ)**

Create `tests/unit/cloudinarySign.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { newTransferPhotoId, signParams } from "@/lib/cloudinarySign";
import { TRANSFER_PHOTO_PATTERN, transferPhotoUrl } from "@/lib/cloudinary";

describe("signParams", () => {
  it("khớp ví dụ trong tài liệu Cloudinary (tham số xếp theo tên, nối secret, SHA-1)", () => {
    expect(
      signParams({ timestamp: 1315060510, public_id: "sample_image", eager: "w_400,h_300,c_pad|w_260,h_200,c_crop" }, "abcd"),
    ).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });
});

describe("ảnh chuyển khoản", () => {
  it("public_id do server sinh khớp mẫu DB", () => {
    expect(newTransferPhotoId()).toMatch(TRANSFER_PHOTO_PATTERN);
    expect(newTransferPhotoId()).not.toBe(newTransferPhotoId());
  });
  it("URL xem ảnh ghép từ cloud name và public_id, Cloudinary tự thu nhỏ", () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
    expect(transferPhotoUrl("nuoc-noi/transfer/abc", 480)).toBe(
      "https://res.cloudinary.com/demo/image/upload/c_limit,w_480,q_auto,f_auto/nuoc-noi/transfer/abc",
    );
  });
});
```

Create `tests/unit/transferPhotoRoute.test.ts`:

```ts
// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: async () => ({ rpc }) }));

import { POST } from "@/app/api/transfer-photo/sign/route";
import { signParams } from "@/lib/cloudinarySign";

beforeEach(() => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
  process.env.CLOUDINARY_API_KEY = "key123";
  process.env.CLOUDINARY_API_SECRET = "secret456";
  rpc.mockReset();
});

describe("POST /api/transfer-photo/sign", () => {
  it("không phải nhân viên/chủ quán đang đăng nhập → 401", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    expect((await POST()).status).toBe(401);
    rpc.mockResolvedValue({ data: null, error: { message: "JWT expired" } });
    expect((await POST()).status).toBe(401);
  });

  it("ký public_id do server sinh, không trả secret", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const res = await POST();
    const body = await res.json();
    expect(rpc).toHaveBeenCalledWith("is_staff");
    expect(body.publicId).toMatch(/^nuoc-noi\/transfer\/[0-9a-f-]{36}$/);
    expect(body).toMatchObject({ cloudName: "demo", apiKey: "key123" });
    expect(body.signature).toBe(signParams({ public_id: body.publicId, timestamp: body.timestamp }, "secret456"));
    expect(JSON.stringify(body)).not.toContain("secret456");
  });

  it("thiếu cấu hình Cloudinary → 500", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    delete process.env.CLOUDINARY_API_SECRET;
    expect((await POST()).status).toBe(500);
  });
});
```

Create `tests/unit/order/transferPhoto.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { shrinkImage, uploadTransferPhoto, UploadError } from "@/lib/order/transferPhoto";

const ID = "nuoc-noi/transfer/11111111-1111-1111-1111-111111111111";
const signed = { cloudName: "demo", apiKey: "k", publicId: ID, timestamp: 1, signature: "s" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const file = new Blob(["x"], { type: "image/jpeg" });

describe("uploadTransferPhoto", () => {
  it("xin chữ ký rồi upload thẳng lên Cloudinary, trả public_id", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(json(signed))
      .mockResolvedValueOnce(json({ public_id: ID }));
    await expect(uploadTransferPhoto(file, fetchFn)).resolves.toBe(ID);
    expect(fetchFn.mock.calls[0]).toEqual(["/api/transfer-photo/sign", { method: "POST" }]);
    const [url, init] = fetchFn.mock.calls[1];
    expect(url).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
    const form = init.body as FormData;
    expect([form.get("api_key"), form.get("timestamp"), form.get("public_id"), form.get("signature")]).toEqual(["k", "1", ID, "s"]);
  });

  it("route ký trả 401 → UNAUTHORIZED", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(json({ error: "FORBIDDEN" }, 401));
    await expect(uploadTransferPhoto(file, fetchFn)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("mất mạng → FAILED", async () => {
    const fetchFn = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(uploadTransferPhoto(file, fetchFn)).rejects.toBeInstanceOf(UploadError);
  });

  it("Cloudinary trả public_id khác cái đã ký hoặc trang lỗi → FAILED (Review Focus 4)", async () => {
    const other = vi.fn().mockResolvedValueOnce(json(signed)).mockResolvedValueOnce(json({ public_id: "khac" }));
    await expect(uploadTransferPhoto(file, other)).rejects.toMatchObject({ code: "FAILED" });
    const html = vi.fn().mockResolvedValueOnce(json(signed)).mockResolvedValueOnce(new Response("<html>", { status: 200 }));
    await expect(uploadTransferPhoto(file, html)).rejects.toMatchObject({ code: "FAILED" });
    const bad = vi.fn().mockResolvedValueOnce(json(signed)).mockResolvedValueOnce(json({ error: {} }, 400));
    await expect(uploadTransferPhoto(file, bad)).rejects.toMatchObject({ code: "FAILED" });
  });
});

describe("shrinkImage", () => {
  it("trình duyệt không có createImageBitmap thì trả ảnh gốc", async () => {
    await expect(shrinkImage(file)).resolves.toBe(file);
  });
});
```

- [ ] **Step 2: Chạy để thấy đỏ**

Run: `npx vitest run tests/unit/cloudinarySign.test.ts tests/unit/transferPhotoRoute.test.ts tests/unit/order/transferPhoto.test.ts`
Expected: FAIL (module chưa có).

- [ ] **Step 3: Viết code**

Create `src/lib/cloudinary.ts`:

```ts
// SRS v3.3 FR-04c: ảnh chuyển khoản lưu trên Cloudinary; DB chỉ giữ public_id, URL ghép ở client (spec §3.1)
export const TRANSFER_PHOTO_PATTERN = /^nuoc-noi\/transfer\/[0-9a-f-]{36}$/;

export function transferPhotoUrl(publicId: string, width: number): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/c_limit,w_${width},q_auto,f_auto/${publicId}`;
}
```

Create `src/lib/cloudinarySign.ts`:

```ts
import { createHash, randomUUID } from "node:crypto";

// Chữ ký upload của Cloudinary: tham số xếp theo tên, nối "k=v&…", thêm secret, băm SHA-1.
// Chỉ route ký (server) import file này; secret được truyền vào, file không tự đọc biến môi trường.
export function signParams(params: Record<string, string | number>, secret: string): string {
  const query = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(query + secret).digest("hex");
}

// Server sinh public_id, nên client không tự đặt tên ảnh và DB kiểm tra được mẫu
export function newTransferPhotoId(): string {
  return `nuoc-noi/transfer/${randomUUID()}`;
}
```

Create `src/app/api/transfer-photo/sign/route.ts`:

```ts
import { NextResponse } from "next/server";
import { newTransferPhotoId, signParams } from "@/lib/cloudinarySign";
import { createServerSupabase } from "@/lib/supabase/server";

// SRS v3.3 NFR-04: file duy nhất đọc CLOUDINARY_API_KEY/SECRET. Chỉ ký cho nhân viên hoặc chủ quán
// đang đăng nhập; is_staff() còn xác nhận phiên chưa bị thu hồi (SRS §2.2).
export async function POST() {
  const supabase = await createServerSupabase();
  const { data: allowed, error } = await supabase.rpc("is_staff");
  if (error || allowed !== true) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !secret) return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 500 });

  const publicId = newTransferPhotoId();
  const timestamp = Math.floor(Date.now() / 1000);
  return NextResponse.json({
    cloudName,
    apiKey,
    publicId,
    timestamp,
    signature: signParams({ public_id: publicId, timestamp }, secret),
  });
}
```

Create `src/lib/order/transferPhoto.ts`:

```ts
import { TRANSFER_PHOTO_PATTERN } from "@/lib/cloudinary";

export class UploadError extends Error {
  constructor(public code: "UNAUTHORIZED" | "FAILED") {
    super(code);
    this.name = "UploadError";
  }
}

type Signed = { cloudName: string; apiKey: string; publicId: string; timestamp: number; signature: string };

async function attempt<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    throw e instanceof UploadError ? e : new UploadError("FAILED");
  }
}

// SRS v3.3 FR-04c: xin chữ ký ở server rồi upload thẳng lên Cloudinary; trả public_id để gửi kèm đơn
export async function uploadTransferPhoto(file: Blob, fetchFn: typeof fetch = fetch): Promise<string> {
  const signed = await attempt(async () => {
    const res = await fetchFn("/api/transfer-photo/sign", { method: "POST" });
    if (res.status === 401) throw new UploadError("UNAUTHORIZED");
    if (!res.ok) throw new UploadError("FAILED");
    return (await res.json()) as Signed;
  });
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("public_id", signed.publicId);
  form.append("signature", signed.signature);
  return attempt(async () => {
    const res = await fetchFn(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });
    const body = res.ok ? ((await res.json()) as { public_id?: string }) : null;
    // Chỉ nhận đúng ảnh đã ký; id lạ không bao giờ đi vào đơn (DB cũng kiểm tra mẫu)
    if (body?.public_id !== signed.publicId || !TRANSFER_PHOTO_PATTERN.test(signed.publicId)) {
      throw new UploadError("FAILED");
    }
    return signed.publicId;
  });
}

// Thu nhỏ còn cạnh dài 1600px, JPEG 0,8 (spec §3.4): ảnh 12MP còn vài trăm KB.
// createImageBitmap tự xoay theo EXIF. Trình duyệt không hỗ trợ hoặc lỗi thì gửi ảnh gốc.
export async function shrinkImage(file: Blob, maxSide = 1600): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    return blob ?? file;
  } catch {
    return file;
  }
}
```

- [ ] **Step 4: Chạy test**

Run: `npx vitest run tests/unit/cloudinarySign.test.ts tests/unit/transferPhotoRoute.test.ts tests/unit/order/transferPhoto.test.ts`
Expected: PASS. Nếu test chữ ký Cloudinary lệch, kiểm tra ví dụ tại trang "Generating authentication signatures" của Cloudinary trước khi sửa code. Không sửa kỳ vọng cho khớp code.

Run: `grep -rn "CLOUDINARY_API_SECRET\|CLOUDINARY_API_KEY" src/`
Expected: chỉ có trong `src/app/api/transfer-photo/sign/route.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cloudinary.ts src/lib/cloudinarySign.ts src/app/api/transfer-photo/sign/route.ts src/lib/order/transferPhoto.ts tests/unit/cloudinarySign.test.ts tests/unit/transferPhotoRoute.test.ts tests/unit/order/transferPhoto.test.ts
git commit -m "feat(order): ký upload ảnh chuyển khoản ở server, upload thẳng lên Cloudinary (SRS v3.3 FR-04c, NFR-04)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Tấm thanh toán trên màn order

**Files:**
- Create: `public/qr.jpg` (chép từ `docs/qr.jpg`)
- Create: `src/components/order/PaymentSheet.tsx`
- Modify: `src/lib/api.ts` (kiểu `Payment`, `CreateOrderInput`, `CreatedOrder`, `MyOrder`, `createOrder`)
- Modify: `src/components/order/OrderScreen.tsx`
- Modify: `tests/setup.ts` (polyfill `URL.createObjectURL`)
- Test: `tests/unit/api.test.ts`, `tests/unit/order/OrderScreen.test.tsx`

**Interfaces:**
- Consumes: `uploadTransferPhoto`, `shrinkImage`, `UploadError` (Task 3); `transferPhotoUrl` (Task 3); RPC `create_order` 6 tham số (Task 2).
- Produces:
  - `export type Payment = { method: "cash" } | { method: "transfer"; photoId: string }` trong `src/lib/api.ts`.
  - `CreateOrderInput.payment: Payment`.
  - `CreatedOrder` và `MyOrder` có thêm `payment_method: "cash" | "transfer"` và `transfer_photo_id: string | null`. Task 5 dùng 2 trường này.
  - `OrderScreenProps.uploadPhoto?: (file: Blob) => Promise<string>`.

- [ ] **Step 1: Chép ảnh QR**

Run: `cp docs/qr.jpg public/qr.jpg`
Ảnh 1072×1280, nền trắng. Giữ nền trắng khi hiển thị, vì máy quét cần độ tương phản.

- [ ] **Step 2: Test api (đỏ)**

Trong `tests/unit/api.test.ts`, thay test `"createOrder ánh xạ đúng tham số RPC 4 tham số"` bằng:

```ts
  it("createOrder ánh xạ đúng tham số RPC, kèm hình thức thanh toán", async () => {
    const { client, rpc } = clientReturning({ data: { id: "o1" }, error: null });
    const api = createStaffApi(() => client);
    const base = {
      id: "o1",
      seatId: "s1",
      discountPercent: 10,
      lines: [{ menuItemId: "m1", quantity: 2, clientPrice: 190000 }],
    };
    await api.createOrder({ ...base, payment: { method: "cash" } });
    expect(rpc).toHaveBeenLastCalledWith("create_order", {
      p_id: "o1",
      p_seat_id: "s1",
      p_discount_percent: 10,
      p_lines: [{ menu_item_id: "m1", quantity: 2, client_price: 190000 }],
      p_payment_method: "cash",
      p_transfer_photo_id: null,
    });
    await api.createOrder({ ...base, payment: { method: "transfer", photoId: "nuoc-noi/transfer/x" } });
    expect(rpc).toHaveBeenLastCalledWith(
      "create_order",
      expect.objectContaining({ p_payment_method: "transfer", p_transfer_photo_id: "nuoc-noi/transfer/x" }),
    );
  });
```

- [ ] **Step 3: Sửa `src/lib/api.ts`**

Thay khối kiểu ở đầu file:

```ts
// SRS FR-04: dữ liệu gửi server. Server quyết định mọi số tiền; clientPrice chỉ để server phát hiện thực đơn đã đổi.
export type OrderLineInput = { menuItemId: string; quantity: number; clientPrice: number };
// SRS v3.3 FR-04c: chuyển khoản luôn kèm public_id ảnh đã tải lên
export type Payment = { method: "cash" } | { method: "transfer"; photoId: string };
export type PaymentMethod = Payment["method"];
export type CreateOrderInput = {
  id: string;
  seatId: string;
  discountPercent: number;
  lines: OrderLineInput[];
  payment: Payment;
};
export type CreatedOrder = {
  id: string;
  item_count: number;
  subtotal_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  seat_name: string;
  created_at: string;
  business_date: string;
  duplicate: boolean;
  status: "paid" | "cancelled";
  payment_method: PaymentMethod;
  transfer_photo_id: string | null;
};
export type OrderLine = { item_name: string; unit_price: number; quantity: number; line_amount: number };
export type MyOrder = {
  id: string;
  item_count: number;
  subtotal_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  seat_name: string;
  status: "paid" | "cancelled";
  created_at: string;
  payment_method: PaymentMethod;
  transfer_photo_id: string | null;
  lines: OrderLine[] | null;
};
```

Trong `createStaffApi`, thêm hai tham số vào lời gọi `create_order`, sau `p_lines: …`:

```ts
        p_payment_method: input.payment.method,
        p_transfer_photo_id: input.payment.method === "transfer" ? input.payment.photoId : null,
```

Run: `npx vitest run tests/unit/api.test.ts`
Expected: PASS.

- [ ] **Step 4: Polyfill test**

Thêm cuối `tests/setup.ts`:

```ts
// jsdom chưa có URL.createObjectURL: ảnh xem trước của tấm thanh toán dùng nó
if (!URL.createObjectURL) {
  URL.createObjectURL = () => "blob:preview";
  URL.revokeObjectURL = () => {};
}
```

- [ ] **Step 5: Test màn order (đỏ)**

Trong `tests/unit/order/OrderScreen.test.tsx`:

1. Import thêm: `import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";` (thay dòng import cũ) và `import { UploadError } from "@/lib/order/transferPhoto";`.
2. Trong `created(...)`, thêm `payment_method: "cash", transfer_photo_id: null,` ngay trước `...over`.
3. Trong `setup`, `props` thêm `uploadPhoto: vi.fn(async () => PHOTO),` ngay trước `...overrides`.
4. Thêm sau hàm `openCart`:

```ts
const PHOTO = "nuoc-noi/transfer/11111111-1111-1111-1111-111111111111";
const PHOTO2 = "nuoc-noi/transfer/22222222-2222-2222-2222-222222222222";
const photoFile = () => new File(["x"], "ck.png", { type: "image/png" });
const payDialog = () => screen.getByRole("dialog", { name: "Thanh toán" });
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
async function chooseCash(user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(payDialog()).getByRole("button", { name: "Tiền mặt" }));
}
// Một Classic, chọn Quầy 1, mở tấm thanh toán
async function openPayment(user: ReturnType<typeof userEvent.setup>) {
  await user.click(row(/^Classic/));
  const cart = await openCart(user);
  await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
  await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
  return { cart, pay: payDialog() };
}
async function takePhoto(user: ReturnType<typeof userEvent.setup>, pay: HTMLElement) {
  await user.upload(within(pay).getByLabelText("Ảnh chuyển khoản"), photoFile());
}
```

5. **Sửa các test cũ đang gửi đơn:** sau **mỗi** dòng `await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));` (và các dòng tương tự trong test màn rộng, nếu có), thêm `await chooseCash(user);`. Không thêm vào các dòng `expect(...).toBeDisabled()`.

   Riêng test "lỗi mạng giữ giỏ, bấm lại cùng id": sau lần gửi lỗi, tấm thanh toán vẫn mở. Thay lần bấm lại `"Xác nhận đơn"` + `chooseCash` bằng `await chooseCash(user);`.

   Test đầu tiên dùng `toHaveBeenCalledWith({...})`: thêm `payment: { method: "cash" },` vào object kỳ vọng.

   Kiểm tra lại: `grep -n "Xác nhận đơn\" }));" tests/unit/order/OrderScreen.test.tsx`. Mỗi dòng `user.click` phải có `chooseCash` ngay sau.

6. Thêm các test mới cuối `describe("OrderScreen", …)`:

```ts
  it("Quay lại: đóng tấm thanh toán, giỏ còn nguyên, chưa gửi đơn", async () => {
    const { api, user } = setup();
    const { cart, pay } = await openPayment(user);
    expect(within(pay).getByTestId("pay-total")).toHaveTextContent("190.000đ");
    expect(within(pay).getByText("Quầy 1")).toBeInTheDocument();
    await user.click(within(pay).getByRole("button", { name: "Quay lại" }));
    expect(screen.queryByRole("dialog", { name: "Thanh toán" })).toBeNull();
    expect(api.createOrder).not.toHaveBeenCalled();
    expect(within(cart).getByLabelText("Số lượng Classic")).toHaveValue("1");
  });

  it("chuyển khoản: QR, chụp ảnh bắt buộc, xác nhận khóa tới khi tải ảnh xong, gửi kèm ảnh", async () => {
    const up = deferred<string>();
    const uploadPhoto = vi.fn(() => up.promise);
    const { api, user } = setup({ uploadPhoto });
    const { pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    expect(within(pay).getByRole("img", { name: "Mã QR chuyển khoản của quán" })).toBeInTheDocument();
    expect(within(pay).queryByRole("button", { name: "Xác nhận đã thanh toán" })).toBeNull();
    await takePhoto(user, pay);
    expect(within(pay).getByRole("img", { name: "Ảnh chuyển khoản vừa chụp" })).toBeInTheDocument();
    const confirm = within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveTextContent("Đang tải ảnh…");
    await act(async () => up.resolve(PHOTO));
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    expect(api.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ id: "order-1", payment: { method: "transfer", photoId: PHOTO } }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Đã tạo đơn 1 món – 190.000đ");
    expect(screen.queryByRole("dialog", { name: "Thanh toán" })).toBeNull();
  });

  it("tải ảnh lỗi: báo lỗi, Thử lại gửi lại chính ảnh đó", async () => {
    const uploadPhoto = vi.fn().mockRejectedValueOnce(new UploadError("FAILED")).mockResolvedValueOnce(PHOTO);
    const { user } = setup({ uploadPhoto });
    const { pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    expect(await within(pay).findByText("Chưa tải được ảnh – kiểm tra mạng rồi thử lại.")).toBeInTheDocument();
    expect(within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" })).toBeDisabled();
    await user.click(within(pay).getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" })).toBeEnabled());
    expect(uploadPhoto).toHaveBeenCalledTimes(2);
    expect(uploadPhoto.mock.calls[1][0]).toBe(uploadPhoto.mock.calls[0][0]);
  });

  it("chụp lại khi ảnh trước chưa tải xong: chỉ ảnh mới nhất được gửi (Review Focus 1)", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const uploadPhoto = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { api, user } = setup({ uploadPhoto });
    const { pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    await takePhoto(user, pay); // "Chụp lại" mở cùng ô chọn ảnh
    await act(async () => second.resolve(PHOTO2));
    await act(async () => first.resolve(PHOTO));
    const confirm = within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    expect(api.createOrder).toHaveBeenCalledWith(expect.objectContaining({ payment: { method: "transfer", photoId: PHOTO2 } }));
  });

  it("lỗi mạng khi gửi chuyển khoản: giữ tấm và ảnh, bấm lại cùng id và cùng ảnh (Review Focus 2)", async () => {
    const createOrder = vi
      .fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockImplementationOnce(async (i: CreateOrderInput) => created(i));
    const uploadPhoto = vi.fn(async () => PHOTO);
    const { user } = setup({ uploadPhoto }, { createOrder });
    const { pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    const confirm = within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    expect(await within(pay).findByRole("alert")).toHaveTextContent("kiểm tra mạng");
    expect(within(pay).getByRole("img", { name: "Ảnh chuyển khoản vừa chụp" })).toBeInTheDocument();
    await user.click(confirm);
    await screen.findByText(/Đã tạo đơn/);
    expect(createOrder.mock.calls.map((c) => [c[0].id, c[0].payment])).toEqual([
      ["order-1", { method: "transfer", photoId: PHOTO }],
      ["order-1", { method: "transfer", photoId: PHOTO }],
    ]);
    expect(uploadPhoto).toHaveBeenCalledTimes(1);
  });

  it("MENU_CHANGED: đóng tấm, giữ ảnh; mở lại vào thẳng bước kiểm tra ảnh; Xóa hết thì bỏ ảnh", async () => {
    const details = JSON.stringify([
      { id: "m1", name: "Classic", price: 200000, is_archived: false },
      { id: "m2", name: "Neat", price: 100000, is_archived: false },
    ]);
    const createOrder = vi
      .fn()
      .mockRejectedValueOnce(new RpcError("MENU_CHANGED", details))
      .mockImplementation(async (i: CreateOrderInput) => created(i));
    const uploadPhoto = vi.fn(async () => PHOTO);
    const { user } = setup({ uploadPhoto }, { createOrder });
    const { cart, pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    const confirm = within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    expect(await within(cart).findByText("Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Thanh toán" })).toBeNull();

    // Mở lại: vào thẳng bước kiểm tra ảnh, không phải chụp lại
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await user.click(within(payDialog()).getByRole("button", { name: "Chuyển khoản" }));
    expect(within(payDialog()).getByRole("button", { name: "Xác nhận đã thanh toán" })).toBeEnabled();
    await user.click(within(payDialog()).getByRole("button", { name: "Quay lại" }));

    // Xóa hết thì bỏ ảnh: lần sau chọn Chuyển khoản phải quét QR và chụp lại
    await user.click(within(cart).getByRole("button", { name: "Xóa hết" }));
    await user.click(within(cart).getByRole("button", { name: "Chắc chắn xóa hết?" }));
    await user.click(row(/^Classic/));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await user.click(within(payDialog()).getByRole("button", { name: "Chuyển khoản" }));
    expect(within(payDialog()).getByRole("img", { name: "Mã QR chuyển khoản của quán" })).toBeInTheDocument();
    expect(uploadPhoto).toHaveBeenCalledTimes(1);
  });

  it("bấm hai lần chỉ gửi một lần (Review Focus 3)", async () => {
    const pending = deferred<CreatedOrder>();
    const createOrder = vi.fn(() => pending.promise);
    const { user } = setup({}, { createOrder });
    const { pay } = await openPayment(user);
    const cash = within(pay).getByRole("button", { name: "Tiền mặt" });
    await user.click(cash);
    await user.click(cash);
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(cash).toHaveTextContent("Đang gửi…");
  });

  it("upload bị từ chối quyền thì đăng xuất (Review Focus 5)", async () => {
    const uploadPhoto = vi.fn().mockRejectedValueOnce(new UploadError("UNAUTHORIZED"));
    const { props, user } = setup({ uploadPhoto });
    const { pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    await waitFor(() => expect(props.onUnauthorized).toHaveBeenCalled());
  });
```

Nếu test "Xóa hết" không khớp cách nút Xóa hết hiện tại hoạt động (ví dụ nó nằm trong tấm giỏ đơn với nhãn khác), đọc `src/components/order/CartPanel.tsx` và dùng đúng nhãn đang có. Không đổi nhãn trong component.

Run: `npx vitest run tests/unit/order/OrderScreen.test.tsx`
Expected: FAIL (chưa có tấm thanh toán).

- [ ] **Step 6: Viết `PaymentSheet`**

Create `src/components/order/PaymentSheet.tsx`:

```tsx
"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { transferPhotoUrl } from "@/lib/cloudinary";
import { formatVnd } from "@/lib/money";
import { shrinkImage, UploadError } from "@/lib/order/transferPhoto";

const UPLOAD_ERROR = "Chưa tải được ảnh – kiểm tra mạng rồi thử lại.";
type Step = "choose" | "qr" | "preview";

export type PaymentSheetProps = {
  open: boolean;
  total: number;
  seatName: string;
  sending: boolean;
  error: string | null;
  // Ảnh đã tải lên, OrderScreen giữ qua MENU_CHANGED và lỗi mạng (spec §4.1)
  photoId: string | null;
  upload: (file: Blob) => Promise<string>;
  onPhoto: (photoId: string | null) => void;
  onCash: () => void;
  onTransfer: () => void;
  onClose: () => void;
  onUnauthorized: () => void;
};

// SRS v3.3 FR-04c: tấm thanh toán. Tiền mặt gửi ngay; chuyển khoản: QR → chụp ảnh (bắt buộc) → kiểm tra ảnh → xác nhận.
// <dialog> gốc lo nền tối, khóa focus và Esc (như CartSheet). Toàn màn hình trên điện thoại, hộp giữa màn từ md.
export function PaymentSheet({
  open,
  total,
  seatName,
  sending,
  error,
  photoId,
  upload,
  onPhoto,
  onCash,
  onTransfer,
  onClose,
  onUnauthorized,
}: PaymentSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const lastFile = useRef<Blob | null>(null);
  // Chụp lại khi ảnh trước chưa tải xong: chỉ kết quả của lần chụp mới nhất được tính
  const seq = useRef(0);
  const [step, setStep] = useState<Step>("choose");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function send(file: Blob) {
    const n = ++seq.current;
    lastFile.current = file;
    setUploading(true);
    setUploadFailed(false);
    try {
      const id = await upload(await shrinkImage(file));
      if (n === seq.current) onPhoto(id);
    } catch (e) {
      if (n !== seq.current) return;
      if (e instanceof UploadError && e.code === "UNAUTHORIZED") return onUnauthorized();
      setUploadFailed(true);
    } finally {
      if (n === seq.current) setUploading(false);
    }
  }

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // chọn lại cùng ảnh vẫn kích hoạt change
    if (!file) return;
    onPhoto(null);
    setPreview(URL.createObjectURL(file));
    setStep("preview");
    void send(file);
  }

  const shoot = () => input.current?.click();
  const shown = preview ?? (photoId ? transferPhotoUrl(photoId, 800) : null);
  const primary =
    "min-h-16 w-full rounded-2xl bg-ember font-display text-2xl text-ember-ink transition-[transform,background-color] duration-150 active:scale-[0.98] disabled:bg-raised disabled:text-ink-muted";
  const choice =
    "min-h-16 rounded-2xl border border-edge bg-raised font-display text-2xl transition-[transform,background-color] duration-150 active:scale-[0.98] active:bg-ink active:text-bg disabled:opacity-50";

  return (
    <dialog
      ref={ref}
      aria-label="Thanh toán"
      onClose={() => {
        setStep("choose");
        onClose();
      }}
      onCancel={(e) => sending && e.preventDefault()}
      className="sheet-in m-0 h-dvh max-h-none w-full max-w-none bg-bg p-0 text-ink backdrop:bg-bg/80 md:m-auto md:h-auto md:max-h-[90dvh] md:max-w-md md:rounded-2xl md:border md:border-edge"
    >
      <div className="flex min-h-full flex-col gap-5 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="text-center">
          <p className="text-ink-muted">{seatName}</p>
          <p data-testid="pay-total" className="font-display text-5xl tabular-nums">
            {formatVnd(total)}
          </p>
        </header>

        {step === "choose" && (
          <section className="space-y-3">
            <h2 className="text-center font-display text-2xl">Khách trả bằng?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" disabled={sending} onClick={onCash} className={choice}>
                {sending ? "Đang gửi…" : "Tiền mặt"}
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => setStep(photoId ? "preview" : "qr")}
                className={choice}
              >
                Chuyển khoản
              </button>
            </div>
          </section>
        )}

        {step === "qr" && (
          <section className="space-y-4">
            <h2 className="text-center font-display text-2xl">Quét mã để chuyển khoản</h2>
            <Image
              src="/qr.jpg"
              alt="Mã QR chuyển khoản của quán"
              width={1072}
              height={1280}
              priority
              className="mx-auto w-full max-w-xs rounded-xl bg-white"
            />
            <button type="button" onClick={shoot} className={primary}>
              Chụp ảnh chuyển khoản
            </button>
          </section>
        )}

        {step === "preview" && (
          <section className="space-y-4">
            <h2 className="text-center font-display text-2xl">Kiểm tra ảnh</h2>
            {shown && (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh blob: hoặc Cloudinary đã thu nhỏ
              <img
                src={shown}
                alt="Ảnh chuyển khoản vừa chụp"
                className="mx-auto max-h-[45dvh] rounded-xl border border-edge object-contain"
              />
            )}
            {uploadFailed && (
              <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-danger/60 px-3 py-2 text-danger">
                <span>{UPLOAD_ERROR}</span>
                <button
                  type="button"
                  onClick={() => lastFile.current && void send(lastFile.current)}
                  className="min-h-12 shrink-0 rounded-lg border border-danger/70 px-3 font-semibold"
                >
                  Thử lại
                </button>
              </div>
            )}
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <button
                type="button"
                disabled={sending}
                onClick={shoot}
                className="min-h-16 rounded-2xl border border-edge px-4 font-semibold disabled:opacity-50"
              >
                Chụp lại
              </button>
              <button
                type="button"
                aria-label="Xác nhận đã thanh toán"
                disabled={!photoId || uploading || sending}
                onClick={onTransfer}
                className={primary}
              >
                {sending ? "Đang gửi…" : uploading ? "Đang tải ảnh…" : "Xác nhận đã thanh toán"}
              </button>
            </div>
          </section>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-danger/60 px-3 py-2 text-danger">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={sending}
          onClick={() => ref.current?.close()}
          className="mt-auto min-h-12 rounded-xl border border-edge font-semibold disabled:opacity-50"
        >
          Quay lại
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Ảnh chuyển khoản"
          tabIndex={-1}
          className="sr-only"
          onChange={pick}
        />
      </div>
    </dialog>
  );
}
```

- [ ] **Step 7: Nối vào `OrderScreen`**

Trong `src/components/order/OrderScreen.tsx`:

1. Import: thêm `type Payment` vào dòng import `@/lib/api`; thêm `import { uploadTransferPhoto } from "@/lib/order/transferPhoto";` và `import { PaymentSheet } from "./PaymentSheet";`.
2. `OrderScreenProps` thêm (sau `now?`):

```ts
  // Tải ảnh chuyển khoản lên Cloudinary, trả public_id (SRS v3.3 FR-04c); test truyền hàm giả
  uploadPhoto?: (file: Blob) => Promise<string>;
```

   Thêm `uploadPhoto = uploadTransferPhoto,` vào phần destructure tham số, sau `now = () => new Date(),`.
3. Sau dòng `const pendingId = useRef<string | null>(null);` thêm:

```ts
  const [payOpen, setPayOpen] = useState(false);
  // Ảnh chuyển khoản đã tải lên: giữ qua MENU_CHANGED, lỗi mạng, đơn đã hủy; bỏ khi gửi thành công hoặc Xóa hết (FR-04c)
  const [photoId, setPhotoId] = useState<string | null>(null);
```

4. Thay `const clear = edit<void>(() => setCart([]));` bằng:

```ts
  const clear = edit<void>(() => {
    setCart([]);
    setPhotoId(null);
  });
```

5. Đổi chữ ký `async function handleSubmit()` thành `async function handleSubmit(payment: Payment)`. Trong thân hàm:
   - Lời gọi `api.createOrder({ id, seatId: selection.id, discountPercent: discount, lines: toPayload(cart) })` thêm `payment`: `api.createOrder({ id, seatId: selection.id, discountPercent: discount, lines: toPayload(cart), payment })`.
   - Trong nhánh `if (res.duplicate && res.status === "cancelled") {`, thêm `setPayOpen(false);` trước `setInfo(CANCELLED_TEXT);`.
   - Ngay sau `pendingId.current = null;` của nhánh thành công (dòng trước `setInfo(`), thêm `setPayOpen(false);` và `setPhotoId(null);`.
   - Trong `catch`, nhánh `if (fresh) {`, thêm `setPayOpen(false);` trước `setCart((c) => applyMenu(c, fresh));`.
6. Trong `confirm`, đổi `onSubmit={() => void handleSubmit()}` thành `onSubmit={() => blockReason === null && setPayOpen(true)}`.
7. Thêm `PaymentSheet` ngay trước thẻ đóng `</main>`:

```tsx
      <PaymentSheet
        open={payOpen}
        total={total}
        seatName={selection.kind === "seat" ? selection.name : ""}
        sending={sending}
        error={error}
        photoId={photoId}
        upload={uploadPhoto}
        onPhoto={setPhotoId}
        onCash={() => void handleSubmit({ method: "cash" })}
        onTransfer={() => {
          if (photoId) void handleSubmit({ method: "transfer", photoId });
        }}
        onClose={() => setPayOpen(false)}
        onUnauthorized={onUnauthorized}
      />
```

- [ ] **Step 8: Chạy test**

Run: `npx vitest run tests/unit/order tests/unit/api.test.ts`
Expected: PASS hết, gồm các test cũ đã thêm `chooseCash` và 8 test mới.

Run: `npx tsc --noEmit`
Expected: không có lỗi kiểu trong file của task này. Nếu còn lỗi ở `src/app/admin/(protected)/history/page.tsx`, `src/lib/csv.ts` hoặc `ExportCsvButton.tsx` thì để đó, Task 6–7 sửa.

- [ ] **Step 9: Commit**

```bash
git add public/qr.jpg src/components/order/PaymentSheet.tsx src/components/order/OrderScreen.tsx src/lib/api.ts tests/setup.ts tests/unit/api.test.ts tests/unit/order/OrderScreen.test.tsx
git commit -m "feat(order): tấm thanh toán: tiền mặt hoặc chuyển khoản qua QR, bắt buộc chụp ảnh (SRS v3.3 FR-04, FR-04c)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Xem ảnh chuyển khoản: component dùng chung và Đơn vừa tạo

**Files:**
- Create: `src/components/TransferPhoto.tsx`
- Modify: `src/components/order/RecentOrders.tsx`
- Test: `tests/unit/TransferPhoto.test.tsx`, `tests/unit/order/RecentOrders.test.tsx`

**Interfaces:**
- Consumes: `transferPhotoUrl` (Task 3); `MyOrder.payment_method`, `MyOrder.transfer_photo_id` (Task 4).
- Produces: `PhotoViewer({ publicId: string | null; onClose: () => void })`, `PhotoImg({ publicId, width, className?, alt? })`, `TransferPhotoThumb({ publicId: string })`. Task 6 dùng `TransferPhotoThumb`.

- [ ] **Step 1: Test (đỏ)**

Create `tests/unit/TransferPhoto.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoImg, TransferPhotoThumb } from "@/components/TransferPhoto";

const PHOTO = "nuoc-noi/transfer/11111111-1111-1111-1111-111111111111";

describe("TransferPhoto", () => {
  it("ảnh không tải được thì báo tại chỗ", () => {
    render(<PhotoImg publicId={PHOTO} width={480} />);
    fireEvent.error(screen.getByRole("img", { name: "Ảnh chuyển khoản" }));
    expect(screen.getByText("Không tải được ảnh.")).toBeInTheDocument();
  });

  it("ảnh nhỏ bấm vào thì xem to, Đóng thì tắt", async () => {
    const user = userEvent.setup();
    render(<TransferPhotoThumb publicId={PHOTO} />);
    await user.click(screen.getByRole("button", { name: "Xem ảnh chuyển khoản" }));
    const viewer = screen.getByRole("dialog", { name: "Ảnh chuyển khoản" });
    expect(within(viewer).getByRole("img", { name: "Ảnh chuyển khoản" }).getAttribute("src")).toContain("w_1200");
    await user.click(within(viewer).getByRole("button", { name: "Đóng" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
```

Create `tests/unit/order/RecentOrders.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecentOrders } from "@/components/order/RecentOrders";
import type { MyOrder } from "@/lib/api";

const NOW = new Date("2026-10-07T14:00:00Z");
const PHOTO = "nuoc-noi/transfer/11111111-1111-1111-1111-111111111111";
const order = (over: Partial<MyOrder>): MyOrder => ({
  id: "o1",
  item_count: 1,
  subtotal_amount: 190000,
  discount_percent: 0,
  discount_amount: 0,
  total_amount: 190000,
  seat_name: "Quầy 1",
  status: "paid",
  created_at: NOW.toISOString(),
  payment_method: "cash",
  transfer_photo_id: null,
  lines: [{ item_name: "Classic", unit_price: 190000, quantity: 1, line_amount: 190000 }],
  ...over,
});

describe("RecentOrders", () => {
  it("chỉ đơn chuyển khoản có nút xem ảnh; bấm thì mở ảnh toàn màn hình", async () => {
    const user = userEvent.setup();
    render(
      <RecentOrders
        orders={[order({ id: "o1", payment_method: "transfer", transfer_photo_id: PHOTO }), order({ id: "o2" })]}
        now={() => NOW}
        cancelBusy={false}
        cancellingId={null}
        onCancel={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button", { name: "Xem ảnh chuyển khoản" });
    expect(buttons).toHaveLength(1);
    await user.click(buttons[0]);
    const viewer = screen.getByRole("dialog", { name: "Ảnh chuyển khoản" });
    expect(within(viewer).getByRole("img", { name: "Ảnh chuyển khoản" }).getAttribute("src")).toContain(PHOTO);
    await user.click(within(viewer).getByRole("button", { name: "Đóng" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
```

Run: `npx vitest run tests/unit/TransferPhoto.test.tsx tests/unit/order/RecentOrders.test.tsx`
Expected: FAIL.

- [ ] **Step 2: Viết component**

Create `src/components/TransferPhoto.tsx`:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { transferPhotoUrl } from "@/lib/cloudinary";

// Ảnh Cloudinary đã tự thu nhỏ theo width. Lỗi tải thì báo tại chỗ, phần còn lại của đơn vẫn hiện (spec §5.1)
export function PhotoImg({
  publicId,
  width,
  className,
  alt = "Ảnh chuyển khoản",
}: {
  publicId: string;
  width: number;
  className?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p className="text-sm text-danger">Không tải được ảnh.</p>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary đã thu nhỏ, không qua tối ưu ảnh của Next
    <img src={transferPhotoUrl(publicId, width)} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}

// SRS v3.3 FR-04b, FR-07: xem ảnh chuyển khoản toàn màn hình. <dialog> gốc lo Esc và khóa focus.
export function PhotoViewer({ publicId, onClose }: { publicId: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (publicId && !d.open) d.showModal();
    if (!publicId && d.open) d.close();
  }, [publicId]);
  return (
    <dialog
      ref={ref}
      aria-label="Ảnh chuyển khoản"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto max-h-dvh max-w-none bg-transparent p-4 text-ink backdrop:bg-bg/90"
    >
      {publicId && (
        <div className="flex flex-col items-center gap-3">
          <PhotoImg key={publicId} publicId={publicId} width={1200} className="max-h-[80dvh] w-auto rounded-xl" />
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-xl border border-edge bg-raised px-6 font-semibold"
          >
            Đóng
          </button>
        </div>
      )}
    </dialog>
  );
}

// Lịch sử đơn hàng: ảnh nhỏ, bấm để xem to
export function TransferPhotoThumb({ publicId }: { publicId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Xem ảnh chuyển khoản"
        onClick={() => setOpen(true)}
        className="block min-h-12 overflow-hidden rounded-lg border border-edge"
      >
        <PhotoImg publicId={publicId} width={480} alt="" className="h-32 w-auto" />
      </button>
      <PhotoViewer publicId={open ? publicId : null} onClose={() => setOpen(false)} />
    </>
  );
}
```

- [ ] **Step 3: Đơn vừa tạo**

Trong `src/components/order/RecentOrders.tsx`:
1. Import thêm `import { Camera } from "lucide-react";` và `import { PhotoViewer } from "@/components/TransferPhoto";`.
2. Sau `const nowMs = now().getTime();` thêm `const [photo, setPhoto] = useState<string | null>(null);`. Hook phải nằm trước mọi `return`; file này không có return sớm.
3. Thay dòng `<p className={\`font-semibold tabular-nums ${muted}\`}>{formatVnd(o.total_amount)}</p>` bằng:

```tsx
                <div className="flex items-center gap-1">
                  {o.transfer_photo_id && (
                    <button
                      type="button"
                      aria-label="Xem ảnh chuyển khoản"
                      onClick={() => setPhoto(o.transfer_photo_id)}
                      className="grid size-12 place-items-center rounded-lg text-ink-muted transition-colors duration-150 active:bg-ink active:text-bg"
                    >
                      <Camera aria-hidden="true" size={20} />
                    </button>
                  )}
                  <p className={`font-semibold tabular-nums ${muted}`}>{formatVnd(o.total_amount)}</p>
                </div>
```

4. Thêm `<PhotoViewer publicId={photo} onClose={() => setPhoto(null)} />` ngay trước `</section>`.
5. Sửa comment đầu component thành: `// SRS FR-04b: đơn do máy này tạo trong ngày kinh doanh, in như sổ: giờ và chỗ ngồi | món | thành tiền.` + dòng mới `// Đơn chuyển khoản có nút máy ảnh để xem lại ảnh (v3.3). Đơn hủy giữ dòng, gạch ngang, có dấu HỦY in.`

- [ ] **Step 4: Chạy test**

Run: `npx vitest run tests/unit/TransferPhoto.test.tsx tests/unit/order`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/TransferPhoto.tsx src/components/order/RecentOrders.tsx tests/unit/TransferPhoto.test.tsx tests/unit/order/RecentOrders.test.tsx
git commit -m "feat(order): xem lại ảnh chuyển khoản ở Đơn vừa tạo (SRS v3.3 FR-04b)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Lịch sử đơn hàng và thông báo đơn mới

**Files:**
- Modify (viết lại): `src/app/admin/(protected)/history/page.tsx`
- Create: `src/components/admin/ScrollToOrder.tsx`
- Modify: `src/components/admin/NewOrderNotice.tsx`

**Interfaces:**
- Consumes: `TransferPhotoThumb` (Task 5); `history_totals` có thêm `cash_revenue`, `transfer_revenue` (Task 2); cột `orders.payment_method`, `orders.transfer_photo_id` và RLS đọc `order_lines` của chủ quán.
- Produces: URL `/admin/history?order=<id>` mở sẵn và cuộn tới đơn đó.

- [ ] **Step 1: `ScrollToOrder`**

Create `src/components/admin/ScrollToOrder.tsx`:

```tsx
"use client";
import { useEffect } from "react";

// SRS FR-07: ?order=<mã đơn> mở sẵn và cuộn tới đơn đó
// ponytail: chỉ cuộn khi đơn nằm trong trang đang xem; đơn ngoài khoảng ngày hoặc trang khác thì không có gì xảy ra
export function ScrollToOrder({ id }: { id: string }) {
  useEffect(() => {
    document.getElementById(`order-${id}`)?.scrollIntoView({ block: "center" });
  }, [id]);
  return null;
}
```

- [ ] **Step 2: Viết lại trang Lịch sử đơn hàng**

Thay toàn bộ `src/app/admin/(protected)/history/page.tsx`:

```tsx
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { OwnerCancelButton } from "@/components/admin/OwnerCancelButton";
import { ScrollToOrder } from "@/components/admin/ScrollToOrder";
import { TransferPhotoThumb } from "@/components/TransferPhoto";
import { normalizeRange, parsePage } from "@/lib/admin/range";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatVnDateTime } from "@/lib/time";

const PAGE_SIZE = 50;
const PAYMENT_LABEL = { cash: "Tiền mặt", transfer: "Chuyển khoản" } as const;
type Params = { from?: string; to?: string; page?: string; order?: string };
type Totals = {
  revenue: number;
  item_count: number;
  order_count: number;
  discount_total: number;
  cash_revenue: number;
  transfer_revenue: number;
};
type Row = {
  id: string;
  created_at: string;
  seat_name: string;
  item_count: number;
  subtotal_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  status: "paid" | "cancelled";
  payment_method: keyof typeof PAYMENT_LABEL;
  transfer_photo_id: string | null;
  order_lines: { item_name: string; unit_price: number; quantity: number; line_amount: number }[];
};
// Từ tablet: 7 trường của FR-07 (v3.3) thành 7 cột; nút Hủy nằm ngoài <summary> để bấm Hủy không mở đơn
const COLS =
  "sm:grid sm:grid-cols-[9.5rem_minmax(0,1fr)_3.5rem_4rem_7.5rem_7rem_6.5rem] sm:items-center sm:gap-x-3";
const CANCEL_COL = "shrink-0 sm:w-32 sm:text-right";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const { data: today, error: todayError } = await supabase.rpc("current_business_date");
  if (todayError || !today)
    return <p role="alert">Không tải được lịch sử đơn hàng. Kiểm tra mạng rồi tải lại trang.</p>;
  const { from, to } = normalizeRange(params.from, params.to, today as string);
  const page = parsePage(params.page);
  const start = (page - 1) * PAGE_SIZE;

  const [{ data, count, error }, { data: totals, error: totalsError }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, created_at, seat_name, item_count, subtotal_amount, discount_percent, discount_amount, total_amount, status, payment_method, transfer_photo_id, order_lines(item_name, unit_price, quantity, line_amount, sort_order)",
        { count: "exact" },
      )
      .gte("business_date", from)
      .lte("business_date", to)
      .order("created_at", { ascending: false })
      .order("id")
      .order("sort_order", { referencedTable: "order_lines" })
      .range(start, start + PAGE_SIZE - 1),
    supabase.rpc("history_totals", { p_from: from, p_to: to }),
  ]);
  const rows = (data ?? []) as Row[];
  const t = totals as Totals | null;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (p: number) => `/admin/history?from=${from}&to=${to}&page=${p}`;
  const field = "block min-h-12 rounded-lg border border-edge bg-transparent p-2";
  const pager = "flex min-h-12 items-center gap-1 rounded-lg border border-edge px-3";

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Lịch sử đơn hàng</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-sm">Từ ngày</span>
          <input type="date" name="from" defaultValue={from} className={field} />
        </label>
        <label className="block">
          <span className="text-sm">Đến ngày</span>
          <input type="date" name="to" defaultValue={to} className={field} />
        </label>
        <button type="submit" className="min-h-12 rounded-lg bg-ember px-4 font-bold text-ember-ink">
          Lọc
        </button>
        <ExportCsvButton from={from} to={to} />
      </form>

      {error && (
        <p role="alert" className="text-danger">
          Không tải được danh sách đơn. Kiểm tra mạng rồi tải lại trang.
        </p>
      )}

      <div className="sm:overflow-x-auto">
        <div className="sm:min-w-[50rem]">
          <div className="hidden border-b border-edge py-2 text-sm text-ink-muted sm:flex sm:gap-3">
            <div className={`flex-1 ${COLS}`}>
              <span>Thời gian</span>
              <span>Chỗ ngồi</span>
              <span className="text-right">Số món</span>
              <span className="text-right">Giảm giá</span>
              <span className="text-right">Thành tiền</span>
              <span>Thanh toán</span>
              <span>Trạng thái</span>
            </div>
            <span className={CANCEL_COL}>
              <span className="sr-only">Hủy đơn</span>
            </span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((o) => {
              const cancelled = o.status === "cancelled";
              const muted = cancelled ? "text-ink-muted line-through" : "";
              const status = cancelled ? "Đã hủy" : "Đã thanh toán";
              const payment = PAYMENT_LABEL[o.payment_method];
              return (
                <li key={o.id} id={`order-${o.id}`} className="flex items-start gap-3">
                  {/* FR-07: bấm vào đơn thì mở dòng đơn, bấm lần nữa thì đóng */}
                  <details open={o.id === params.order} className="min-w-0 flex-1">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center py-3 [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0 flex-1 space-y-1 tabular-nums sm:hidden">
                        <p className="flex flex-wrap items-baseline gap-x-2">
                          <span className={muted}>
                            {formatVnDateTime(o.created_at)} · {o.seat_name}
                          </span>
                          <span className="text-xs whitespace-nowrap text-ink-muted">{status}</span>
                        </p>
                        <p className={`flex justify-between gap-4 ${muted}`}>
                          <span>
                            {o.item_count} món{o.discount_percent > 0 && ` −${o.discount_percent}%`} · {payment}
                          </span>
                          <span className="font-semibold">{formatVnd(o.total_amount)}</span>
                        </p>
                      </div>
                      <div className={`hidden flex-1 tabular-nums ${COLS}`}>
                        <span className={muted}>{formatVnDateTime(o.created_at)}</span>
                        <span className={`truncate ${muted}`}>{o.seat_name}</span>
                        <span className={`text-right ${muted}`}>{o.item_count}</span>
                        <span className={`text-right ${muted}`}>
                          {o.discount_percent > 0 ? `−${o.discount_percent}%` : "—"}
                        </span>
                        <span className={`text-right font-semibold ${muted}`}>{formatVnd(o.total_amount)}</span>
                        <span>{payment}</span>
                        <span>{status}</span>
                      </div>
                    </summary>
                    <div className="space-y-1 pb-4 text-sm tabular-nums">
                      <ul className="space-y-1">
                        {o.order_lines.map((l, i) => (
                          <li key={i}>
                            {l.quantity} × {l.item_name} · {formatVnd(l.unit_price)} · {formatVnd(l.line_amount)}
                          </li>
                        ))}
                      </ul>
                      <p className="flex max-w-xs justify-between border-t border-line pt-1">
                        <span>Tạm tính</span>
                        <span>{formatVnd(o.subtotal_amount)}</span>
                      </p>
                      {o.discount_percent > 0 && (
                        <p className="flex max-w-xs justify-between">
                          <span>Giảm {o.discount_percent}%</span>
                          <span>−{formatVnd(o.discount_amount)}</span>
                        </p>
                      )}
                      <p className="flex max-w-xs justify-between font-semibold">
                        <span>Thành tiền</span>
                        <span>{formatVnd(o.total_amount)}</span>
                      </p>
                      <p>Thanh toán: {payment}</p>
                      {o.transfer_photo_id && <TransferPhotoThumb publicId={o.transfer_photo_id} />}
                    </div>
                  </details>
                  <span className={`${CANCEL_COL} py-1.5`}>{!cancelled && <OwnerCancelButton orderId={o.id} />}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {params.order && <ScrollToOrder id={params.order} />}
      {!error && rows.length === 0 && (
        <p className="py-6 text-center text-ink-muted">
          Không có đơn hàng nào trong khoảng này. Chọn khoảng ngày khác rồi bấm Lọc.
        </p>
      )}

      {pages > 1 && (
        <nav aria-label="Phân trang" className="flex items-center gap-3">
          {page > 1 && (
            <Link href={href(page - 1)} className={pager}>
              <ChevronLeft aria-hidden="true" size={18} /> Trước
            </Link>
          )}
          <span className="tabular-nums">
            Trang {page}/{pages}
          </span>
          {page < pages && (
            <Link href={href(page + 1)} className={pager}>
              Sau <ChevronRight aria-hidden="true" size={18} />
            </Link>
          )}
        </nav>
      )}

      {t && (
        <div className="sticky bottom-[calc(49px+env(safe-area-inset-bottom))] my-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-surface px-4 py-2.5 text-sm tabular-nums lg:bottom-4">
          <p>
            {t.order_count} đơn · {t.item_count} món
            <span className="block text-xs font-medium text-ink-muted">
              Không tính đơn đã hủy · Đã giảm {formatVnd(t.discount_total)}
            </span>
          </p>
          <p className="text-xs font-medium text-ink-muted">
            Tiền mặt {formatVnd(t.cash_revenue)} · Chuyển khoản {formatVnd(t.transfer_revenue)}
          </p>
          <p className="text-right">
            <span className="block text-xs font-medium text-ink-muted">Doanh thu</span>
            <strong className="text-base font-semibold">{formatVnd(t.revenue)}</strong>
          </p>
        </div>
      )}
      {totalsError && (
        <p role="alert" className="text-danger">
          Không tải được dòng tổng. Kiểm tra mạng rồi tải lại trang.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Thông báo đơn mới thành liên kết (FR-06a)**

Trong `src/components/admin/NewOrderNotice.tsx`:
1. Thêm `import Link from "next/link";`.
2. Thay khối `<p key={order.id} className="toast-in …">…</p>` bằng:

```tsx
        <Link
          key={order.id}
          href={`/admin/history?order=${order.id}`}
          className="toast-in pointer-events-auto flex min-h-12 items-center rounded-lg border border-edge bg-raised px-4 py-3 font-medium tabular-nums"
        >
          Đơn mới: {order.seat_name} · {order.item_count} món · {formatVnd(order.total_amount)}
        </Link>
```

- [ ] **Step 4: Kiểm tra kiểu và chạy tay**

Run: `npx tsc --noEmit`
Expected: không lỗi trong `history/page.tsx`, `ScrollToOrder.tsx`, `NewOrderNotice.tsx`. Lỗi còn lại ở `src/lib/csv.ts` và `ExportCsvButton.tsx` là việc của Task 7.

Chạy `npm run dev`, đăng nhập chủ quán, tạo một đơn tiền mặt và một đơn chuyển khoản (Cloudinary thật trong `.env.local`) ở `/order`. Ở `/admin/history`:
- Đơn chuyển khoản mở ra có dòng đơn, Tạm tính, Thành tiền, "Thanh toán: Chuyển khoản" và ảnh nhỏ. Bấm ảnh thì xem to, Esc thì đóng.
- Bấm "Hủy" không mở đơn.
- Dòng tổng có "Tiền mặt … · Chuyển khoản …".
- Mở `/admin/history?order=<id đơn chuyển khoản>` thì đơn đó mở sẵn và cuộn tới giữa màn.
- Bấm thông báo "Đơn mới" thì tới đúng đơn.
- Ở cửa sổ 390px, dòng hai tầng có "N món · Chuyển khoản" và thành tiền.

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/(protected)/history/page.tsx" src/components/admin/ScrollToOrder.tsx src/components/admin/NewOrderNotice.tsx
git commit -m "feat(admin): Lịch sử đơn hàng mở xem dòng đơn, hình thức thanh toán và ảnh; ?order=; dòng tổng tách tiền mặt/chuyển khoản (SRS v3.3 FR-06a, FR-07)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: CSV 9 cột

**Files:**
- Modify (viết lại): `src/lib/csv.ts`
- Modify: `src/components/admin/ExportCsvButton.tsx`
- Modify (viết lại): `tests/unit/csv.test.ts`

**Interfaces:**
- Produces: `type CsvOrder` và `ordersToCsv(orders: CsvOrder[]): string`. `csvFileName` giữ nguyên.

- [ ] **Step 1: Test (đỏ)**

Thay toàn bộ `tests/unit/csv.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { csvFileName, ordersToCsv, type CsvOrder } from "@/lib/csv";

const order = (over: Partial<CsvOrder> = {}): CsvOrder => ({
  created_at: "2026-10-03T22:59:05Z",
  business_date: "2026-10-03",
  seat_name: "Quầy 1",
  discount_percent: 10,
  discount_amount: 48000,
  status: "paid",
  payment_method: "transfer",
  order_lines: [
    { item_name: "Classic", unit_price: 190000, quantity: 2, line_amount: 380000 },
    { item_name: "Neat", unit_price: 100000, quantity: 1, line_amount: 100000 },
  ],
  ...over,
});
const lines = (csv: string) => csv.slice(1).split("\r\n");

describe("ordersToCsv", () => {
  it("BOM, header 9 cột, mỗi dòng đơn một hàng, hàng Giảm giá mang số âm, CRLF", () => {
    const csv = ordersToCsv([order()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(lines(csv)).toEqual([
      "Thời gian,Ngày kinh doanh,Chỗ ngồi,Món,Số lượng,Đơn giá,Thành tiền,Trạng thái,Thanh toán",
      "04/10/2026 05:59:05,03/10/2026,Quầy 1,Classic,2,190000,380000,Đã thanh toán,Chuyển khoản",
      "04/10/2026 05:59:05,03/10/2026,Quầy 1,Neat,1,100000,100000,Đã thanh toán,Chuyển khoản",
      "04/10/2026 05:59:05,03/10/2026,Quầy 1,Giảm giá 10%,,,-48000,Đã thanh toán,Chuyển khoản",
      "",
    ]);
  });

  it("cộng cột Thành tiền của đơn đã thanh toán ra đúng doanh thu", () => {
    const rows = lines(ordersToCsv([order(), order({ status: "cancelled" }), order({ discount_percent: 0, discount_amount: 0 })]))
      .slice(1, -1)
      .map((l) => l.split(","));
    const paid = rows.filter((r) => r[7] === "Đã thanh toán").reduce((s, r) => s + Number(r[6]), 0);
    expect(paid).toBe(432000 + 480000);
  });

  it("không giảm giá thì không có hàng Giảm giá; tiền mặt và đơn hủy có nhãn", () => {
    const rows = lines(ordersToCsv([order({ discount_percent: 0, discount_amount: 0, payment_method: "cash", status: "cancelled" })]));
    expect(rows).toHaveLength(4);
    expect(rows[1]).toBe("04/10/2026 05:59:05,03/10/2026,Quầy 1,Classic,2,190000,380000,Đã hủy,Tiền mặt");
  });

  it("escape dấu phẩy và dấu nháy, chặn công thức Excel ở tên món và chỗ ngồi", () => {
    const rows = lines(
      ordersToCsv([
        order({
          seat_name: 'Bàn "VIP", tầng 2',
          discount_percent: 0,
          order_lines: [{ item_name: "=HYPERLINK(1)", unit_price: 1000, quantity: 1, line_amount: 1000 }],
        }),
      ]),
    );
    expect(rows[1]).toContain('"Bàn ""VIP"", tầng 2"');
    expect(rows[1]).toContain(",'=HYPERLINK(1),");
  });
});

describe("csvFileName", () => {
  it("don-hang_<từ>_<đến>.csv", () => {
    expect(csvFileName("2026-10-01", "2026-10-07")).toBe("don-hang_2026-10-01_2026-10-07.csv");
  });
});
```

Run: `npx vitest run tests/unit/csv.test.ts`
Expected: FAIL.

- [ ] **Step 2: Viết `src/lib/csv.ts`**

```ts
import { formatIsoDate, formatVnDateTime } from "@/lib/time";

export type CsvOrder = {
  created_at: string;
  business_date: string;
  seat_name: string;
  discount_percent: number;
  discount_amount: number;
  status: "paid" | "cancelled";
  payment_method: "cash" | "transfer";
  order_lines: { item_name: string; unit_price: number; quantity: number; line_amount: number }[];
};

const HEADER = [
  "Thời gian",
  "Ngày kinh doanh",
  "Chỗ ngồi",
  "Món",
  "Số lượng",
  "Đơn giá",
  "Thành tiền",
  "Trạng thái",
  "Thanh toán",
];
const STATUS_LABEL: Record<CsvOrder["status"], string> = { paid: "Đã thanh toán", cancelled: "Đã hủy" };
const PAYMENT_LABEL: Record<CsvOrder["payment_method"], string> = { cash: "Tiền mặt", transfer: "Chuyển khoản" };

function textCell(value: string): string {
  // Chặn CSV injection: Excel coi ô bắt đầu bằng = + - @ là công thức
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// BOM để Excel đọc đúng UTF-8 (SRS FR-07a)
const BOM = String.fromCharCode(0xfeff);

// SRS FR-07a (v3.3): mỗi dòng đơn một hàng; đơn có giảm giá thêm hàng "Giảm giá N%" mang số âm,
// nên cộng cột Thành tiền của các đơn đã thanh toán ra đúng doanh thu
export function ordersToCsv(orders: CsvOrder[]): string {
  const rows = orders.flatMap((o) => {
    const head = [textCell(formatVnDateTime(o.created_at)), textCell(formatIsoDate(o.business_date)), textCell(o.seat_name)];
    const tail = [textCell(STATUS_LABEL[o.status]), textCell(PAYMENT_LABEL[o.payment_method])];
    const out = o.order_lines.map((l) => [
      ...head,
      textCell(l.item_name),
      String(l.quantity),
      String(l.unit_price),
      String(l.line_amount),
      ...tail,
    ]);
    if (o.discount_percent > 0) {
      out.push([...head, textCell(`Giảm giá ${o.discount_percent}%`), "", "", String(-o.discount_amount), ...tail]);
    }
    return out.map((r) => r.join(","));
  });
  return BOM + [HEADER.join(","), ...rows].join("\r\n") + "\r\n";
}

export function csvFileName(from: string, to: string): string {
  return `don-hang_${from}_${to}.csv`;
}
```

- [ ] **Step 3: `ExportCsvButton` đọc dòng đơn**

Trong `src/components/admin/ExportCsvButton.tsx`:
- Đổi import thành `import { csvFileName, ordersToCsv, type CsvOrder } from "@/lib/csv";` và `const rows: HistoryRow[] = [];` thành `const rows: CsvOrder[] = [];`, `rows.push(...(data as HistoryRow[]));` thành `rows.push(...(data as CsvOrder[]));`.
- Thay chuỗi trong `.select(…)` bằng `"created_at, business_date, seat_name, discount_percent, discount_amount, status, payment_method, order_lines(item_name, unit_price, quantity, line_amount, sort_order)"`.
- Thêm `.order("sort_order", { referencedTable: "order_lines" })` ngay sau `.order("id")`.

- [ ] **Step 4: Chạy test**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: tất cả PASS, không lỗi kiểu, không lỗi lint mới.

- [ ] **Step 5: Commit**

```bash
git add src/lib/csv.ts src/components/admin/ExportCsvButton.tsx tests/unit/csv.test.ts
git commit -m "feat(admin): CSV 9 cột: mỗi dòng đơn một hàng, hàng Giảm giá, cột Thanh toán (SRS v3.3 FR-07a)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Chữ gốc 16px và kiểm tay

**Files:**
- Modify: `src/app/globals.css:48-51,178-182`
- Modify: `DESIGN.md` (dòng nói "Cỡ chữ gốc 15px dưới `lg`")
- Modify: `docs/manual-test.md`

- [ ] **Step 1: Đổi chữ gốc**

Trong `src/app/globals.css`:
- Khối `html { … }` ở dòng 48: xóa dòng `font-size: 93.75%; /* điện thoại: chữ 15px, từ lg trở lên 16px */`.
- Xóa cả khối:

```css
@media (min-width: 64rem) {
  html {
    font-size: 100%;
  }
}
```

Run: `grep -n "93.75\|15px" src/app/globals.css DESIGN.md`
Expected: chỉ còn dòng trong `DESIGN.md`. Sửa dòng đó thành:

```markdown
Cỡ chữ gốc 16px ở mọi cỡ màn (SRS R40); mọi cỡ `rem` tính từ đó. Ô nhập giữ chữ ≥ 16px (`max(16px, 1em)`) để iOS Safari không tự phóng to.
```

- [ ] **Step 2: Kiểm tra bố cục ở 360px và 390px**

Chạy `npm run dev`. Mở `/order` trong Chrome DevTools ở khung 360×780 và 390×844.
- Nút Ghế quầy vẫn vừa **2 hàng × 6** (R24).
- Thanh giỏ đơn không tràn khi Thành tiền 1.000.000.000đ (Review Focus 4 của đợt 3).
- Tấm thanh toán: QR không bị cắt; nút "Chụp lại" và "Xác nhận đã thanh toán" nằm cùng một hàng.

Nếu nút ghế quầy rơi xuống hàng 3 ở 360px, chỉ chỉnh khoảng cách trong `src/components/order/SeatPicker.tsx` (giảm `gap` của lưới ghế quầy). Không giảm chữ gốc. Chụp ảnh trước và sau bằng `node scripts/screenshots.mjs` (ảnh ra `.impeccable/review/`, không commit).

- [ ] **Step 3: Danh sách kiểm tay**

Thêm cuối `docs/manual-test.md`:

```markdown
## Thanh toán và ảnh chuyển khoản (SRS v3.3 FR-04c, R39)

Cần `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` thật. Thử trên **Chrome Android** và **Safari iOS** bằng điện thoại thật (camera thật).

- [ ] Xác nhận đơn → Tiền mặt: đơn tạo ngay, "Đã tạo đơn…" + Hoàn tác.
- [ ] Xác nhận đơn → Chuyển khoản: QR hiện rõ, quét được bằng app ngân hàng.
- [ ] "Chụp ảnh chuyển khoản" mở camera sau. Chụp xong thấy ảnh, nút xác nhận hiện "Đang tải ảnh…" rồi bật.
- [ ] "Chụp lại" thay ảnh; ảnh mới nhất là ảnh được lưu (mở Lịch sử để kiểm tra).
- [ ] Bật chế độ máy bay sau khi chụp: báo "Chưa tải được ảnh…"; tắt máy bay, "Thử lại" thành công.
- [ ] "Quay lại" ở mọi bước: giỏ đơn còn nguyên, không có đơn mới trong Lịch sử.
- [ ] Đơn vừa tạo: đơn chuyển khoản có nút máy ảnh, bấm xem ảnh to, "Đóng" tắt.
- [ ] Lịch sử đơn hàng: mở đơn chuyển khoản thấy ảnh nhỏ; bấm thấy ảnh to; dòng tổng tách Tiền mặt / Chuyển khoản; CSV có cột Thanh toán.
- [ ] Đổi PIN quán khi điện thoại nhân viên đang ở bước chụp ảnh: lần tải ảnh kế tiếp đưa về `/login`.

## Chữ gốc 16px (R40)

- [ ] Điện thoại 360px: nút Ghế quầy vẫn 2 hàng × 6; thanh giỏ đơn không tràn.
- [ ] Trang chủ quán ở 390px: thanh điều hướng dưới và dòng tổng Lịch sử không tràn.
```

- [ ] **Step 4: Chạy toàn bộ test và commit**

Run: `npx vitest run && npx tsc --noEmit && npm run lint`
Expected: PASS.

```bash
git add src/app/globals.css DESIGN.md docs/manual-test.md
git commit -m "feat(design): chữ gốc 16px ở mọi cỡ màn; danh sách kiểm tay thanh toán (SRS v3.3 R40)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Nếu Step 2 có sửa `SeatPicker.tsx`, thêm nó vào cùng commit.

---

### Task 9: Đối chiếu SRS, kiểm tra cuối, bàn giao prod

**Files:**
- Modify: chỉ khi `srs-reviewer` hoặc kiểm tra cuối báo lệch.

- [ ] **Step 1: Kiểm tra toàn bộ**

Run: `npx supabase db reset && npx supabase test db && npx vitest run && npx tsc --noEmit && npm run lint`
Expected: tất cả PASS.

Dừng `npm run dev` rồi chạy `npm run build`.
Expected: build thành công; route `/api/transfer-photo/sign` có trong danh sách route (ƒ, dynamic).

Run: `grep -rn "cốc\|Số cốc\|hóa đơn\|[Bb]ill\b" src/ --include=*.ts --include=*.tsx`
Expected: không còn kết quả.

- [ ] **Step 2: Giao `srs-reviewer`**

Giao subagent `srs-reviewer` với prompt:

> Đối chiếu `git diff <BASE của đợt 4>..HEAD -- supabase/ src/ tests/ docs/ DESIGN.md GLOSSARY.md .claude/rules/` với SRS v3.3 (FR-04, FR-04b, FR-04c, FR-06a, FR-07, FR-07a, §4, NFR-02, NFR-04, NFR-05, R39, R40), GLOSSARY, `.claude/rules/` và spec `docs/superpowers/specs/2026-10-07-thanh-toan-design.md`. Chú ý: secret Cloudinary chỉ trong route ký; server từ chối chuyển khoản thiếu ảnh; không có đường gửi đơn chuyển khoản mà bỏ qua ảnh trên giao diện; doanh thu và số món chỉ tính đơn đã thanh toán.

`<BASE của đợt 4>` là commit ngay trước commit của Task 1 (`git log --oneline` để lấy).

Sửa mọi chỗ lệch mà agent báo, chạy lại Step 1, rồi commit:

```bash
git commit -am "fix: sửa theo đối chiếu SRS v3.3 đợt 4

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Chỉ báo xong khi kết quả là **khớp SRS** (CLAUDE.md, "Trước khi báo xong").

- [ ] **Step 3: Soạn bàn giao prod cho chủ quán (không tự chạy)**

Prod chưa nhận migration nào từ đợt 1. Migration `20261005000200_order_lines.sql` **xóa toàn bộ đơn hàng và lịch sử đổi giá** (R36). Gửi chủ quán đoạn này, không tự chạy:

```text
Trước khi đưa đợt 1–4 lên prod:
1. Đếm đơn trên prod (Supabase Dashboard → SQL Editor):
     select count(*) from public.orders;
   Migration v3.0 sẽ xóa hết số đơn này (R36). Nếu cần giữ, xuất CSV ở /admin/history trước.
2. Đặt 3 biến Cloudinary trên Vercel (docs/deploy.md §3).
3. Ở máy dev: npx supabase db push
4. Deploy Vercel, rồi chạy danh sách "Thanh toán và ảnh chuyển khoản" trong docs/manual-test.md trên điện thoại thật.
```

---

## Self-review (đã chạy)

- **Phủ spec:**
  - §3.1–3.2 → Task 2. §3.3–3.4 → Task 3.
  - §4.1 → Task 4. §4.2 → Task 5.
  - §5.1 → Task 6. §5.2 → Task 7. §5.3: không đổi (FR-06a đã có từ trước, Task 6 chỉ thêm liên kết cho phần đợt 4 còn nợ).
  - §6 → Task 8. §7 → Task 1. §8 → test trong Task 2–7 và danh sách kiểm tay ở Task 8.
  - Phần đợt 4 còn nợ (Lịch sử `<details>` và `?order=`, CSV 8→9 cột, thông báo thành liên kết, bàn giao prod) → Task 6, 7, 9. "Số món" ở Tổng quan đã xong ở đợt 2b.
- **Tên và kiểu thống nhất:** `Payment` và `photoId` (Task 4); `payment_method` và `transfer_photo_id` (DB, `MyOrder`, `CsvOrder`, `Row`); `TransferPhotoThumb` và `PhotoViewer` (Task 5 → 6); `uploadTransferPhoto(file: Blob)` khớp `uploadPhoto?: (file: Blob) => Promise<string>`.
- **Review Focus:** cả 5 mục đều có test trong task sở hữu (Task 3 mục 4; Task 4 mục 1, 2, 3, 5).
