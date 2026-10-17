/** Same aspect ratio as real cards to avoid layout shift during loading. */
export default function MenuSkeleton() {
  return (
    <div role="status" aria-label="Đang tải danh sách sản phẩm" className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-[#E8E5E1] bg-white" aria-hidden="true">
          <div className="aspect-square animate-pulse bg-[#ECE3D9]" />
          <div className="space-y-3 p-3 sm:p-4"><div className="h-3 w-1/3 animate-pulse rounded bg-[#EEE6DD]"/><div className="h-5 w-4/5 animate-pulse rounded bg-[#EEE6DD]"/><div className="h-4 w-3/5 animate-pulse rounded bg-[#EEE6DD]"/><div className="h-6 w-2/5 animate-pulse rounded bg-[#EEE6DD]"/></div>
        </div>
      ))}
      <span className="sr-only">Đang tải thực đơn BrewLite...</span>
    </div>
  );
}
