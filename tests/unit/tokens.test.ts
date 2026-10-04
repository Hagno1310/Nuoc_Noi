import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Đọc token từ :root của globals.css, để test chặn được bảng màu trượt khỏi hợp đồng thiết kế
const css = readFileSync("src/app/globals.css", "utf8");
const root = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")));
const token = (name: string) => {
  const m = root.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`thiếu token --${name}`);
  return m[1].toLowerCase();
};

function luminance(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("token Bao diêm quán bar", () => {
  it("trung tính khóa đúng 5 bậc", () => {
    const neutrals = new Set(
      ["bg", "surface", "raised", "line", "edge", "ink", "ink-muted"].map(token),
    );
    expect([...neutrals].sort()).toEqual(
      ["#1a1e15", "#232819", "#4a5238", "#a9b08f", "#e6d8b4"].sort(),
    );
  });

  it("chữ đạt WCAG AA trên nền tối (phòng tối)", () => {
    expect(contrast(token("ink"), token("bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("ink-muted"), token("bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("ink-muted"), token("raised"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("danger"), token("bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("warn"), token("bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("ok"), token("bg"))).toBeGreaterThanOrEqual(4.5);
  });

  it("chữ trên mực cam là màu nền, đạt AA; viền điều khiển ≥ 3:1", () => {
    expect(token("ember")).toBe("#e8572c");
    expect(contrast(token("ember-ink"), token("ember"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("edge"), token("bg"))).toBeGreaterThanOrEqual(3);
  });

  it("không còn hiệu ứng của thế giới cũ", () => {
    for (const gone of ["feTurbulence", ".halo", ".streak", ".develop", ".arc-draw", ".bar-rise", ".exposure-streak", "drop-shadow"]) {
      expect(css).not.toContain(gone);
    }
  });

  it("chữ hiển thị là Archivo hẹp đậm, cùng một họ với chữ thường", () => {
    expect(css).toMatch(/--font-sans:\s*var\(--font-archivo\)/);
    expect(css).toMatch(/--font-display:\s*var\(--font-archivo\)/);
    expect(css).toMatch(/\.font-display\s*\{[^}]*font-stretch:\s*72%/);
  });
});
