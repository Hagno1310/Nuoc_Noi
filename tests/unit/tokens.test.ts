import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Đọc token từ :root của globals.css, để bảng màu không trượt khỏi DESIGN.md
const css = readFileSync("src/app/globals.css", "utf8");
const root = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")));
const token = (name: string) => {
  const m = root.match(new RegExp(`--${name}: *(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`thiếu token --${name}`);
  return m[1].toLowerCase();
};
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("token DESIGN.md", () => {
  it("chữ đạt WCAG AA trên mọi bậc nền", () => {
    for (const bg of ["bg", "surface", "surface-2"])
      for (const fg of ["ink", "muted"]) expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it("màu trạng thái đọc được trên nền soft của nó", () => {
    for (const t of ["ok", "warn", "danger", "accent"]) expect(contrast(token(t), token(`${t}-soft`))).toBeGreaterThanOrEqual(4.5);
  });

  it("chữ trên nền nhấn và nền danger đạt AA", () => {
    expect(contrast(token("accent-ink"), token("accent"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("accent-ink"), token("danger"))).toBeGreaterThanOrEqual(4.5);
  });
});
