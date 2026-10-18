'use client';

import { useState, useMemo, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AuthHydration from '@/components/AuthHydration';
import ProductCard from '@/components/ProductCard';
import MobileBottomNav from '@/components/MobileBottomNav';
import { MOCK_PRODUCTS, DEFAULT_TOPPINGS, Product } from '@/data/mockProducts';
import { fetchProducts } from '@/api/products';

export default function Home() {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copyToast, setCopyToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Tải dữ liệu từ Backend API (kết nối trực tiếp PostgreSQL)
  const loadProducts = () => {
    setIsLoading(true);
    setFetchError(null);
    fetchProducts()
      .then((data) => {
        if (data && data.length > 0) {
          const mapped: Product[] = data.map((p, idx) => ({
            id: p.id,
            code: `BREW-${String(idx + 1).padStart(2, '0')}`,
            name: p.name,
            subtitle:
              p.category === 'COFFEE_VN'
                ? 'Cà Phê Truyền Thống'
                : p.category === 'ESPRESSO'
                ? 'Pha Máy Espresso'
                : 'Trà Thanh Mát',
            category: p.category,
            badge:
              p.name.includes('Muối')
                ? 'BESTSELLER'
                : p.name.includes('Sữa Đá')
                ? 'TRUYỀN THỐNG'
                : p.name.includes('Macchiato')
                ? 'PHA MÁY'
                : p.name.includes('Sen Vàng')
                ? 'SIGNATURE'
                : undefined,
            price: p.price,
            stock: p.stock,
            imageUrl: p.imageUrl,
            description: p.description,
            toppings: DEFAULT_TOPPINGS,
          }));
          setProductsList(mapped);
        } else {
          setProductsList([]);
        }
      })
      .catch((err) => {
        console.error('Lỗi kết nối Backend API:', err);
        setFetchError('Không thể kết nối đến máy chủ BrewLite. Vui lòng kiểm tra kết nối mạng hoặc thử lại.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Lọc sản phẩm theo thanh tìm kiếm
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productsList;
    const query = searchQuery.toLowerCase().trim();
    return productsList.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.subtitle.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
    );
  }, [productsList, searchQuery]);

  // Sao chép mã giảm giá BREWCOZY
  const handleCopyVoucher = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText('BREWCOZY');
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  return (
    <AuthHydration>
      <div className="min-h-screen bg-[#FBF8F3] text-[#2A1810] flex flex-col pb-20 md:pb-0">
        {/* Header điều hướng Roastery */}
        <Navbar />

        {/* Toast thông báo sao chép */}
        {copyToast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-[#2A1810] px-5 py-3 text-sm font-semibold text-white shadow-xl animate-fade-in">
            <svg className="w-5 h-5 text-[#C28B5B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Đã sao chép mã ưu đãi BREWCOZY (-15%)!
          </div>
        )}

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col gap-8">
          {/* 1. Header Thực đơn & Hero Banner Roastery */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#C28B5B]">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                SINGLE ORIGIN & ARTISANAL ROASTERY
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#2A1810] mt-1.5">
                Thực đơn · Menu
              </h1>
              <p className="text-sm sm:text-base text-[#6B5D52] mt-1 max-w-2xl">
                Hương vị thủ công rang mộc, trải nghiệm gọi món không tiền mặt tốc độ cao.
              </p>
            </div>

            {/* Badge Kiosk Pickup thời gian chuẩn bị */}
            <div className="self-start md:self-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-[#E8E5E1] shadow-2xs">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8EBE0] text-[#8A5A00]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#2A1810]">3 - 5 Phút Chuẩn Bị</p>
                <p className="text-[11px] text-[#6B5D52]">Express pickup tại quầy bar</p>
              </div>
            </div>
          </section>

          {/* 2. Banner Ưu Đãi Thanh Toán BREWCOZY */}
          <section className="relative overflow-hidden rounded-3xl bg-[#2A1810] text-white p-5 sm:p-7 shadow-sm">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#C28B5B]/30 border border-[#C28B5B]/50 text-[#C28B5B]">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white">
                      ƯU ĐÃI THANH TOÁN
                    </span>
                    <span className="text-xs text-stone-300">Chỉ áp dụng hôm nay</span>
                  </div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold mt-1 text-white">
                    Giảm ngay 15% với mã <span className="text-[#C28B5B] tracking-wide">BREWCOZY</span>
                  </h2>
                  <p className="text-xs text-stone-300 mt-0.5 max-w-xl">
                    Áp dụng tức thì khi thanh toán không tiền mặt qua VietQR, Apple Pay hoặc thẻ chạm contactless.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyVoucher}
                className="self-start md:self-auto inline-flex items-center gap-2 rounded-2xl bg-[#F8EBE0] px-5 py-3 text-xs sm:text-sm font-bold text-[#2A1810] hover:bg-white active:scale-95 transition-all shadow-xs"
              >
                <svg className="w-4 h-4 text-[#8A5A00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Sao chép mã
              </button>
            </div>
          </section>

          {/* 3. Thanh Tìm Kiếm Đồ Uống & Hướng dẫn */}
          <section className="flex flex-col gap-3">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm đồ uống, cà phê... · Search drinks, roasts..."
                className="w-full rounded-2xl bg-white border border-[#E8E5E1] pl-12 pr-4 py-3.5 text-sm text-[#2A1810] placeholder-[#6B5D52] shadow-2xs focus:border-[#2A1810] focus:outline-none focus:ring-1 focus:ring-[#2A1810] transition-colors"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B5D52]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#6B5D52] hover:text-[#2A1810]"
                >
                  Xóa
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[#6B5D52] px-1">
              <span>Đang hiển thị {filteredProducts.length} món trong thực đơn thủ công</span>
              <span className="hidden sm:inline">Chạm vào món để tùy chỉnh đường, đá & kích cỡ</span>
            </div>
          </section>

          {/* 4. Lưới Sản Phẩm Đồ Uống */}
          <section>
            {/* Trạng thái Loading: Hiển thị Skeleton Card khi đang tải */}
            {isLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-3xl bg-white border border-[#E8E5E1] p-3 shadow-2xs">
                    <div className="aspect-square rounded-2xl bg-stone-200 mb-3" />
                    <div className="h-4 bg-stone-200 rounded-full w-3/4 mb-2" />
                    <div className="h-3 bg-stone-100 rounded-full w-1/2 mb-3" />
                    <div className="h-8 bg-stone-200 rounded-xl w-full" />
                  </div>
                ))}
              </div>
            )}

            {/* Trạng thái Lỗi: Hiển thị banner thông báo và nút Thử lại */}
            {!isLoading && fetchError && (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-red-50 border border-red-200 py-12 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-500 mb-4">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="font-serif text-lg font-bold text-red-800">
                  Lỗi kết nối máy chủ
                </h3>
                <p className="text-xs text-red-600 mt-1 max-w-md">
                  {fetchError}
                </p>
                <div className="flex items-center gap-3 mt-5">
                  <button
                    onClick={loadProducts}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                  >
                    Thử lại
                  </button>
                  <button
                    onClick={() => {
                      setProductsList(MOCK_PRODUCTS);
                      setFetchError(null);
                    }}
                    className="rounded-xl bg-white border border-red-300 px-5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-50 transition-colors"
                  >
                    Dùng dữ liệu mẫu (Demo)
                  </button>
                </div>
              </div>
            )}

            {/* Trạng thái Trống: Không có sản phẩm nào trong database */}
            {!isLoading && !fetchError && productsList.length === 0 && !searchQuery && (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white border border-[#E8E5E1] py-16 px-4 text-center">
                <span className="text-4xl mb-3">📭</span>
                <h3 className="font-serif text-lg font-bold text-[#2A1810]">
                  Thực đơn đang trống
                </h3>
                <p className="text-xs text-[#6B5D52] mt-1 max-w-sm">
                  Chưa có sản phẩm nào trong cơ sở dữ liệu. Vui lòng liên hệ quản trị viên để thêm sản phẩm hoặc chạy seed dữ liệu.
                </p>
              </div>
            )}

            {/* Trạng thái Bình thường: Hiển thị lưới sản phẩm */}
            {!isLoading && !fetchError && productsList.length > 0 && (
              <>
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-3xl bg-white border border-[#E8E5E1] py-16 px-4 text-center">
                    <span className="text-4xl mb-3">☕</span>
                    <h3 className="font-serif text-lg font-bold text-[#2A1810]">
                      Không tìm thấy đồ uống nào
                    </h3>
                    <p className="text-xs text-[#6B5D52] mt-1 max-w-sm">
                      Không có sản phẩm nào khớp với từ khóa &ldquo;{searchQuery}&rdquo;. Vui lòng thử tìm với tên món khác.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 rounded-xl bg-[#2A1810] px-4 py-2 text-xs font-semibold text-white"
                    >
                      Xem lại toàn bộ thực đơn
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* 5. Banner Cam Kết 100% Cashless Roastery */}
          <section className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-white border border-[#E8E5E1] p-5 sm:p-6 shadow-2xs mt-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2A1810] text-[#FBF8F3]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-sm text-[#2A1810] flex items-center gap-2">
                  100% Cashless Roastery
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                </p>
                <p className="text-xs text-[#6B5D52] mt-0.5">
                  Chạm thẻ & Mã QR siêu tốc · Không dùng tiền mặt để phục vụ nhanh hơn.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#2A1810]">
              <span className="px-3 py-1.5 rounded-xl bg-[#F7F3EE] border border-[#E8E5E1]">
                VietQR Express
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#F7F3EE] border border-[#E8E5E1]">
                Napas / Visa / Master
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[#F7F3EE] border border-[#E8E5E1]">
                Apple & MoMo
              </span>
            </div>
          </section>
        </main>

        {/* 6. Footer Kiosk Roastery */}
        <footer className="mt-12 bg-white border-t border-[#E8E5E1] pt-12 pb-16 md:pb-12 text-[#2A1810]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-[#E8E5E1]">
              {/* Cột 1: Thông tin thương hiệu */}
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2A1810] text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                    </svg>
                  </div>
                  <span className="font-serif text-lg font-bold">BrewLite Roastery</span>
                </div>
                <p className="text-xs text-[#6B5D52] leading-relaxed mt-3 max-w-sm">
                  Trải nghiệm cà phê thủ công cao cấp với quy trình đặt món 100% không tiền mặt. Tinh gọn, chuẩn xác và đúng hương vị mộc bản.
                </p>
                <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#8A5A00]">
                  <span>☕ 100% Cashless Express Pickup · VietQR, Thẻ & Ví điện tử</span>
                </div>
              </div>

              {/* Cột 2: Khám phá Catalog */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#2A1810]">
                  KHÁM PHÁ · CATALOG
                </h4>
                <ul className="mt-3 space-y-2 text-xs text-[#6B5D52]">
                  <li>Cà phê pha máy · Espresso Bar</li>
                  <li>Phin truyền thống · Slow Drip</li>
                  <li>Trà thủ công · Botanical Cold Brew</li>
                  <li>Bánh nướng mộc · Fresh Bakes</li>
                </ul>
              </div>

              {/* Cột 3: Xưởng rang & Giờ mở cửa */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#2A1810]">
                  XƯỞNG RANG & GIỜ MỞ CỬA
                </h4>
                <p className="text-xs text-[#6B5D52] mt-3">
                  06:30 - 21:00 hàng ngày (Mở cửa cả ngày lễ)
                </p>
                <p className="text-xs text-[#6B5D52] mt-1">
                  Trạm lấy món express sẵn sàng trong 3-5 phút sau khi thanh toán.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-[#F7F3EE] px-2.5 py-1 rounded-full text-[#6B5D52]">
                    Kiosk Express Pickup
                  </span>
                  <span className="text-[10px] font-bold bg-[#F7F3EE] px-2.5 py-1 rounded-full text-[#6B5D52]">
                    Quầy Bar 01 & 02
                  </span>
                </div>
              </div>
            </div>

            {/* Chân trang bản quyền */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6B5D52]">
              <p>© 2026 BrewLite Specialty Coffee Roasters. Tất cả quyền được bảo lưu.</p>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-[#2A1810]">Chính sách bảo mật</a>
                <a href="#" className="hover:text-[#2A1810]">Điều khoản dịch vụ</a>
                <a href="#" className="hover:text-[#2A1810]">Hướng dẫn thanh toán</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Bottom Navigation trên Mobile */}
        <MobileBottomNav />
      </div>
    </AuthHydration>
  );
}
