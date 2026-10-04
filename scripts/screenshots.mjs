// Chụp ảnh trang chủ quán cho finish review (impeccable): node scripts/screenshots.mjs
// Cần dev server ở localhost:3000 và tài khoản thử trong README (chỉ dùng trên máy local).
import { chromium } from "playwright";
const base = "http://localhost:3000";
const out = ".impeccable/review";
const browser = await chromium.launch();
const shot = async (ctx, path, file) => {
  const p = await ctx.newPage();
  await p.goto(base + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(2000); // chờ biểu đồ đo bề rộng (ResizeObserver) rồi mới chụp
  await p.screenshot({ path: `${out}/${file}`, fullPage: true });
  if (path.includes("dashboard")) console.log("fontStretch", await p.evaluate(() => getComputedStyle(document.querySelector(".font-display")).fontStretch));
  await p.close();
};
// Màn đăng nhập trước khi có phiên
const anon = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
await shot(anon, "/admin/login", "mobile-login.png");
await shot(anon, "/login", "mobile-staff-login.png");
await anon.close();
for (const [w, h, prefix] of [[390, 844, "mobile"], [1440, 900, "desktop"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base + "/admin/login");
  await p.fill('input[type="email"]', "owner@quan.vn");
  await p.fill('input[type="password"]', "matkhau123");
  await p.click('button[type="submit"]');
  await p.waitForURL("**/admin/dashboard", { timeout: 30000 });
  await p.close();
  await shot(ctx, "/admin/dashboard", `${prefix}.png`);
  await shot(ctx, "/admin/menu", `${prefix}-menu.png`);
  await shot(ctx, "/admin/settings", `${prefix}-settings.png`);
  // Hàng đang mở: nút của hàng (Đổi tên, Đổi giá, Ẩn)
  for (const [path, row, file] of [["/admin/menu", /^BeSpoke/, "menu-open"], ["/admin/settings", /^Quầy 1$/, "settings-open"]]) {
    const p = await ctx.newPage();
    await p.goto(base + path, { waitUntil: "networkidle" });
    await p.getByRole("button", { name: row }).first().click();
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${out}/${prefix}-${file}.png` });
    await p.close();
  }
  await ctx.close();
}
await browser.close();
