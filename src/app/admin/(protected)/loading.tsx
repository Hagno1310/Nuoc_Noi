export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Đang tải" className="space-y-4">
      <div className="h-8 w-48 rounded bg-raised motion-safe:animate-pulse" />
      <div className="h-40 rounded-xl bg-raised motion-safe:animate-pulse" />
      <div className="h-24 rounded-xl bg-raised motion-safe:animate-pulse" />
    </div>
  );
}
