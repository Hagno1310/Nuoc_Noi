---
version: 1
slug: "src-app-order-page-tsx"
primary_target: "src/app/order/page.tsx"
related_targets: ["src/app/login/page.tsx","src/components/order"]
---

Scope: `/order` and `/login` (staff, Operate). Source brief: `docs/design/order-brief.md` (behavior and states; its visual sections are superseded by this contract). Behavior: `docs/SRS.md` v3.1.

## Direction contract

THESIS: Every screen is the face of a Nước Nôi bar matchbook; the menu is a bold printed price list and a sent order is a struck match. Refuses the glowing neon dark POS and the coloured tile grid.
OWN-WORLD: Flat matte black card #141210, cream ink #EFE6D2, exactly one spot ink, flame orange #E8572C, reserved for the primary action and the live selection; neutrals locked to a 5-step ramp; one family, Archivo, carrying everything through weight and width (condensed heavy for display, normal for body); one 1px rule system; no glow, no light streak, no grain, no shadow; hand-drawn wordmark printed flat; the rough striker strip is the only textured divider; one reversed plate per screen (the orange cart plate here); states are printed marks; discontinued items print grey and keep their place; warning and error colour stays inside its own frame.
STORY: The staffer glances at the price list, taps items (+1 each), opens Giỏ đơn, taps a seat, confirms; the striker strip flares once and they know the order landed.
FIRST VIEWPORT: 390×844. Flat wordmark centred at top; price list of 8 bold rows, 56px each, condensed heavy name left, price right, orange quantity at the row's start when in the cart; Đơn vừa tạo below the fold; at the bottom the striker strip, and on it the orange plate: item count and Thành tiền at display size left, Giỏ đơn right. Cart sheet: lines with − / field / +, discount, Tạm tính / Giảm / Thành tiền, seats 2×6 plus Bàn and Mang về, the chosen seat named large, orange Xác nhận đơn. Signature interaction: the strip flares left to right in 400ms on a successful send.
FORM: Bao diêm quán bar, position 6 of the bar-only list, seed 73f06246 (re-roll 3), assigned, code-led.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
