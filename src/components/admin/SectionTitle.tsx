// Tiêu đề mục: chữ biển hẹp đậm trên một đường kẻ 1px (hệ đường kẻ duy nhất của Bao diêm quán bar)
export function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="border-b border-line pb-2 font-display text-xl">{children}</h2>
  );
}
