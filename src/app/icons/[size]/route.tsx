import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

const SIZES = ["192", "512"];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

// Logo gốc (PRODUCT.md: không vẽ lại logo bằng font) trên nền ô liu đậm; 60% khung để an toàn cho icon maskable
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });
  const px = Number(size);
  const logo = await readFile(
    join(process.cwd(), "public/brand/nuoc-noi-wordmark.png"),
  );
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1A1E15",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        width={px * 0.6}
        height={(px * 0.6 * 1016) / 1096}
        alt=""
      />
    </div>,
    { width: px, height: px },
  );
}
