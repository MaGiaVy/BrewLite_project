'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AuthHydration from '@/components/AuthHydration';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, getTotalItems, getSubtotal } = useCartStore();

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();
  const estimatedPoints = Math.floor(subtotal / 10000);

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      // Chưa đăng nhập -> Chuyển sang đăng nhập kèm redirect
      router.push('/auth/login?redirect=/checkout');
    } else {
      // Đã đăng nhập -> Vào thẳng checkout
      router.push('/checkout');
    }
  };

  return (
    <AuthHydration>
      <div className="min-h-screen bg-[#FBF8F3] text-[#2A1810] flex flex-col pb-24 md:pb-12">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
          {/* Header Giỏ hàng */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E5E1]">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#C28B5B]">
                THANH TOÁN KHÔNG TIỀN MẶT · 100% CASHLESS KIOSK
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2A1810] mt-1">
                Giỏ hàng của bạn · Cart
              </h1>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2A1810] hover:text-[#C28B5B] transition-colors self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Tiếp tục chọn món · Continue browsing
            </Link>
          </div>

          {items.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* Cột trái (7/12): Danh sách món trong giỏ */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="font-serif text-xl font-bold text-[#2A1810]">
                      Món đã chọn
                    </h2>
                    <span className="text-xs text-[#6B5D52] bg-white px-2.5 py-1 rounded-full border border-[#E8E5E1]">
                      {totalItems} món trong giỏ
                    </span>
                  </div>
                  <button
                    onClick={clearCart}
                    className="text-xs font-semibold text-[#B3261E] hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>

                {/* Danh sách từng món */}
                <div className="flex flex-col gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E5E1] shadow-2xs hover:border-[#C28B5B]/50 transition-colors"
                    >
                      {/* Ảnh và thông tin món */}
                      <div className="flex items-start gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-20 w-20 shrink-0 rounded-xl object-cover bg-[#F7F3EE] border border-[#E8E5E1]"
                        />
                        <div>
                          <h3 className="font-serif text-base font-bold text-[#2A1810]">
                            {item.name}
                          </h3>

                          {/* Tags tùy chọn: Size, Topping, Đá/Đường */}
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#F7F3EE] text-[11px] font-semibold text-[#6B5D52]">
                              Size {item.size} {item.size === 'M' ? '(+5.000đ)' : item.size === 'L' ? '(+10.000đ)' : '(Mặc định)'}
                            </span>
                            {item.toppings?.map((t) => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded-md bg-[#F8EBE0] text-[11px] font-semibold text-[#8A5A00]"
                              >
                                + {t.name} (+{t.price.toLocaleString('vi-VN')}đ)
                              </span>
                            ))}
                            {(item.ice || item.sugar) && (
                              <span className="px-2 py-0.5 rounded-md bg-[#F7F3EE] text-[11px] font-medium text-[#6B5D52]">
                                {item.ice || '100% Đá'} · {item.sugar || 'Chuẩn Ngọt'}
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-xs text-[#6B5D52]">
                            Đơn giá: {item.unitPrice.toLocaleString('vi-VN')}đ
                          </p>
                        </div>
                      </div>

                      {/* Bộ điều khiển số lượng và thành tiền */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F7F3EE]">
                        <p className="font-serif text-lg font-bold text-[#2A1810]">
                          {item.lineTotal.toLocaleString('vi-VN')}đ
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center rounded-full border border-[#E8E5E1] bg-[#F7F3EE] p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-[#2A1810] hover:bg-white transition-colors"
                              aria-label="Giảm số lượng"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                            <span className="w-7 text-center font-bold text-xs text-[#2A1810]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-[#2A1810] hover:bg-white transition-colors"
                              aria-label="Tăng số lượng"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:text-[#B3261E] hover:bg-red-50 transition-colors ml-1"
                            title="Xóa món này"
                            aria-label="Xóa món"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cột phải (5/12): Bảng tóm tắt đơn hàng */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="rounded-3xl bg-white border border-[#E8E5E1] p-6 shadow-xs sticky top-24">
                  <h3 className="font-serif text-lg font-bold text-[#2A1810] pb-4 border-b border-[#E8E5E1]">
                    Tóm tắt đơn hàng · SUMMARY
                  </h3>

                  <div className="py-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between text-[#6B5D52]">
                      <span>Tạm tính ({totalItems} món) · Subtotal</span>
                      <span className="font-semibold text-[#2A1810]">
                        {subtotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[#6B5D52]">
                      <span>Phí dịch vụ Kiosk · Service fee</span>
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                        0đ (Miễn phí)
                      </span>
                    </div>

                    <div className="pt-3 border-t border-[#E8E5E1] flex items-baseline justify-between">
                      <div>
                        <p className="font-bold text-xs uppercase text-[#6B5D52]">
                          Tổng tạm tính
                        </p>
                        <p className="text-[11px] text-[#6B5D52]">
                          (Chưa bao gồm mã giảm giá)
                        </p>
                      </div>
                      <span className="font-serif text-2xl font-bold text-[#2A1810]">
                        {subtotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    {/* Dự kiến điểm thưởng */}
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8EBE0] border border-[#EAD8CA] text-xs font-semibold text-[#8A5A00]">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#C28B5B]" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" stroke="#8A5A00" strokeWidth="1.5" fill="#F8EBE0" />
                        </svg>
                        Điểm thưởng tích lũy dự kiến
                      </span>
                      <span>+{estimatedPoints} điểm</span>
                    </div>
                  </div>

                  {/* Nút hành động chính */}
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-[#2A1810] text-white hover:bg-[#42271A] active:scale-[0.99] transition-all shadow-md mt-2"
                  >
                    <span className="font-bold text-sm sm:text-base">
                      Tiến hành thanh toán · Checkout
                    </span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>

                  {!isAuthenticated && (
                    <p className="text-[11px] text-center text-[#8A5A00] mt-3">
                      ℹ️ Bạn sẽ được yêu cầu đăng nhập trước khi hoàn tất thanh toán.
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-[#F7F3EE] space-y-2 text-xs text-[#6B5D52]">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Bảo mật thanh toán chuẩn PCI-DSS Level 1 Sandbox</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#C28B5B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Quầy pha chế sẵn sàng: Trạm 01 & 02 · Chuẩn bị trong 3-5p</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Giỏ hàng trống */
            <div className="mt-12 flex flex-col items-center justify-center rounded-3xl bg-white border border-[#E8E5E1] py-20 px-4 text-center max-w-xl mx-auto shadow-2xs">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#F8EBE0] text-[#8A5A00] mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#2A1810]">
                Giỏ hàng của bạn đang trống
              </h2>
              <p className="text-sm text-[#6B5D52] mt-2 max-w-sm">
                Hãy khám phá thực đơn cà phê thủ công và trà thanh mát của BrewLite để chọn cho mình thức uống yêu thích nhé!
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#2A1810] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#42271A] transition-all shadow-sm"
              >
                Khám phá thực đơn ngay
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}
        </main>

        <MobileBottomNav />
      </div>
    </AuthHydration>
  );
}
