export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ===== Cột trái: Ảnh nền + Quote ===== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Ảnh nền cà phê */}
        <img
          src="https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?w=1200&q=80"
          alt="BrewLite Coffee"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay tối nhẹ */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Quote nằm dưới cùng */}
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <blockquote className="text-2xl font-light italic leading-relaxed mb-4">
            &ldquo;Sự kết hợp hoàn hảo giữa những hạt cà phê đậm vị và những
            ly trà trái cây thanh mát, mang đến nguồn cảm hứng bất tận.&rdquo;
          </blockquote>
          <p className="text-sm font-medium tracking-wide">
            — BrewLite Việt Nam
          </p>
        </div>
      </div>

      {/* ===== Cột phải: Form đăng nhập / đăng ký ===== */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-stone-50 px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
