---
version: 1
slug: "src-app-admin-protected-dashboard-page-tsx"
primary_target: "src/app/admin/(protected)/dashboard/page.tsx"
related_targets: ["src/app/admin","src/components/admin"]
---

Scope: `/admin/*` (owner, Operate). Source brief: `docs/design/owner-brief.md` (behavior; its visual sections are superseded by this contract). Behavior: `docs/SRS.md` v3.1.

## Direction contract

THESIS: The owner's side of the same matchbook: tonight's revenue printed as the one reversed plate inside a flat business-day dial, everything else set as a quiet printed ledger. Refuses stat-card dashboards and glowing charts.
OWN-WORLD: Same world as /order: matte black card, cream ink, one flame-orange spot ink for the primary action, the live selection and the one reversed plate; 5-step neutral ramp; Archivo only, condensed heavy for figures and headings, normal for body; one 1px rule system for ledgers, settings and the menu list; no glow, streak, grain or shadow; cancelled orders keep their row, struck through with a printed HỦY mark; owner primary buttons 48px (SRS NFR-02, R37).
STORY: The owner opens the app, reads tonight's revenue in one glance, then drops into Thực đơn, the ledger or settings only when needed.
FIRST VIEWPORT: Phone: flat wordmark and Đăng xuất strip; the business-day dial fills the width as a flat orange stroke over a faint 1px track, the revenue plate centred in it; item count and order count below; comparison rows as a ruled ledger; fixed 5-icon bottom nav. Desktop: left rail with printed nav, dial beside the comparison ledger.
FORM: Bao diêm quán bar, position 6 of the bar-only list, seed 73f06246 (re-roll 3), assigned, code-led.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
