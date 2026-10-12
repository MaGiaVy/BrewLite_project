'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AuthHydration from '@/components/AuthHydration';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { createOrder, CreateOrderPayload } from '@/api/orders';
import { processPayment } from '@/api/payments';
import { fetchProducts } from '@/api/products';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { items, clearCart, getTotalItems, getSubtotal } = useCartStore();

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();

  // Trạng thái Voucher
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
    discountAmount: number;
  } | null>({
    // Khởi tạo mặc định mã BREWCOZY như Mockup Ảnh 3
    code: 'BREWCOZY',
    discountType: 'PERCENT',
    discountValue: 15,
    discountAmount: Math.floor(subtotal * 0.15),
  });

  // Phương thức thanh toán: WALLET hoặc CARD
  const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'CARD'>('WALLET');

  // Trạng thái đang xử lý thanh toán
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Bảo vệ Auth: Nếu chưa đăng nhập -> chuyển sang login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [authLoading, isAuthenticated, router]);

  // Cập nhật lại discountAmount nếu subtotal thay đổi
  useEffect(() => {
    if (appliedVoucher) {
      if (appliedVoucher.discountType === 'PERCENT') {
        const amt = Math.min(25000, Math.floor((subtotal * appliedVoucher.discountValue) / 100));
        setAppliedVoucher((prev) => (prev ? { ...prev, discountAmount: amt } : null));
      } else {
        const amt = Math.min(subtotal, appliedVoucher.discountValue);
        setAppliedVoucher((prev) => (prev ? { ...prev, discountAmount: amt } : null));
      }
    }
  }, [subtotal]);

  // Tính tổng thanh toán cuối cùng
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const rewardPoints = Math.floor(finalTotal / 10000);

  // Xử lý áp mã Voucher
  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    const code = voucherInput.trim().toUpperCase();

    if (!code) {
      setVoucherError('Vui lòng nhập mã ưu đãi');
      return;
    }

    if (code === 'BREWCOZY') {
      const amt = Math.min(25000, Math.floor(subtotal * 0.15));
      setAppliedVoucher({
        code: 'BREWCOZY',
        discountType: 'PERCENT',
        discountValue: 15,
        discountAmount: amt,
      });
      setVoucherInput('');
    } else if (code === 'BREWLITE10') {
      if (subtotal < 50000) {
        setVoucherError('Mã BREWLITE10 yêu cầu đơn hàng từ 50.000đ trở lên');
        return;
      }
      const amt = Math.min(20000, Math.floor(subtotal * 0.1));
      setAppliedVoucher({
        code: 'BREWLITE10',
        discountType: 'PERCENT',
        discountValue: 10,
        discountAmount: amt,
      });
      setVoucherInput('');
    } else if (code === 'WELCOME20') {
      if (subtotal < 30000) {
        setVoucherError('Mã WELCOME20 yêu cầu đơn hàng từ 30.000đ trở lên');
        return;
      }
      const amt = Math.min(subtotal, 20000);
      setAppliedVoucher({
        code: 'WELCOME20',
        discountType: 'FIXED',
        discountValue: 20000,
        discountAmount: amt,
      });
      setVoucherInput('');
    } else {
      setVoucherError('Mã ưu đãi không hợp lệ hoặc đã hết lượt sử dụng');
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError('');
  };

  // Trạng thái lỗi trong quá trình thanh toán
  const [checkoutError, setCheckoutError] = useState('');

  // Xác nhận thanh toán (Ráp nối API Task 8 & Task 10)
  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setCheckoutError('');

    try {
      // 1. Tạo Idempotency-Key cho đơn hàng
      const orderIdempotencyKey =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 2. Lấy danh mục sản phẩm từ CSDL để chuẩn hóa ID sản phẩm thực tế
      let dbProducts: any[] = [];
      try {
        dbProducts = await fetchProducts();
      } catch (_) {}

      // 3. Định dạng DTO gửi lên Backend
      const orderPayload: CreateOrderPayload = {
        items: items.map((it) => {
          const matched = dbProducts.find(
            (p) =>
              p.id === it.productId ||
              p.name.trim().toLowerCase() === it.name.trim().toLowerCase()
          );
          return {
            productId: matched?.id || it.productId,
            productName: it.name,
            size: it.size,
            ice: it.ice,
            sugar: it.sugar,
            quantity: it.quantity,
            toppingIds:
              it.toppings
                ?.map((t) => t.id)
                .filter((id) => id && !id.startsWith('top-')) || [],
          };
        }),
        voucherCode: appliedVoucher?.code,
        paymentMethod,
      };

      // 4. Gọi Backend POST /api/v1/orders
      const createdOrder = await createOrder(orderPayload, orderIdempotencyKey);

      // 4. Gọi Backend POST /api/v1/payments (Task 8: Mock Payment Gateway)
      const paymentIdempotencyKey = `pay-${createdOrder.id}-${orderIdempotencyKey}`;
      const payResult = await processPayment(
        {
          orderId: createdOrder.id,
          amount: createdOrder.finalTotal,
          method: paymentMethod,
          forceSuccess: true, // Đảm bảo đơn chuyển PAID trơn tru cho demo
        },
        paymentIdempotencyKey
      );

      // 5. Lưu thông tin đơn vào localStorage làm cache cho trang tracking
      const orderData = {
        orderId: createdOrder.id,
        createdAt: createdOrder.createdAt || new Date().toISOString(),
        items,
        subtotal: createdOrder.subtotal || subtotal,
        discountAmount: createdOrder.discountAmount || discountAmount,
        finalTotal: createdOrder.finalTotal || finalTotal,
        paymentMethod: paymentMethod === 'WALLET' ? 'Ví điện tử' : 'Thẻ ngân hàng',
        voucherCode: appliedVoucher?.code,
        rewardPoints: payResult?.data?.loyaltyPointsAdded || rewardPoints,
        transactionCode: payResult?.data?.paymentId || `TX-${createdOrder.id.substring(0, 8)}`,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('brewlite-last-order', JSON.stringify(orderData));
      }

      // 6. Đặt cờ đang chuyển hướng để tránh nhấp nháy giỏ hàng trống
      setIsRedirecting(true);

      // 7. Xóa giỏ hàng sau khi thanh toán thành công
      clearCart();

      // 8. Chuyển hướng sang trang Theo dõi đơn hàng với orderId thật từ Database
      router.push(`/orders/${createdOrder.id}`);
    } catch (err: any) {
      console.error('Lỗi thanh toán:', err);
      setIsRedirecting(false);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra trong quá trình tạo đơn hoặc thanh toán. Vui lòng thử lại!';
      setCheckoutError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || (!isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A1810]" />
          <p className="mt-4 text-sm text-[#6B5D52]">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Màn hình chuyển hướng mượt mà ngay sau khi bấm thanh toán thành công
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#C28B5B] border-t-transparent" />
          <h2 className="font-serif text-xl font-bold text-[#2A1810] mt-4">
            Thanh toán thành công!
          </h2>
          <p className="mt-1 text-sm text-[#6B5D52]">
            Đang chuyển sang màn hình nhận đồ uống tại quầy...
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isProcessing && !isRedirecting) {
    return (
      <AuthHydration>
        <div className="min-h-screen bg-[#FBF8F3] flex flex-col">
          <Navbar />
          <main className="mx-auto max-w-xl px-4 py-20 text-center flex-1">
            <h1 className="font-serif text-2xl font-bold text-[#2A1810]">
              Chưa có sản phẩm để thanh toán
            </h1>
            <p className="text-sm text-[#6B5D52] mt-2">
              Giỏ hàng của bạn đang trống, vui lòng chọn đồ uống trước khi thanh toán.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#2A1810] px-6 py-3.5 text-sm font-bold text-white shadow-sm"
            >
              Quay lại thực đơn
            </Link>
          </main>
        </div>
      </AuthHydration>
    );
  }

  return (
    <AuthHydration>
      <div className="min-h-screen bg-[#FBF8F3] text-[#2A1810] flex flex-col pb-24 md:pb-12">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
          {/* Header Trang Thanh toán */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E5E1]">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#C28B5B]">
                THANH TOÁN KHÔNG TIỀN MẶT · 100% CASHLESS KIOSK
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2A1810] mt-1">
                Thanh toán đơn hàng · Checkout
              </h1>
            </div>

            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#2A1810] hover:text-[#C28B5B] transition-colors self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại giỏ hàng · Back to cart
            </Link>
          </div>

          {/* Bố cục 2 Cột chuẩn Mockup Ảnh 3 */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Cột trái (7/12): Danh sách món + Voucher + Phương thức thanh toán */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* 1. Danh sách món tóm tắt */}
              <div className="rounded-3xl bg-white border border-[#E8E5E1] p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#F7F3EE]">
                  <h2 className="font-serif text-lg font-bold text-[#2A1810]">
                    Món đã chọn ({totalItems} món trong đơn)
                  </h2>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Express Bar Prep
                  </span>
                </div>

                <div className="divide-y divide-[#F7F3EE] mt-2">
                  {items.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-12 w-12 rounded-xl object-cover bg-[#F7F3EE] border border-[#E8E5E1]"
                        />
                        <div>
                          <p className="font-serif font-bold text-sm text-[#2A1810]">
                            {item.quantity}x {item.name}
                          </p>
                          <p className="text-[11px] text-[#6B5D52]">
                            Size {item.size} {item.toppings?.length ? `· +${item.toppings.map((t) => t.name).join(', ')}` : ''} {item.ice ? `· ${item.ice}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-serif font-bold text-sm text-[#2A1810]">
                        {item.lineTotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Khối Mã ưu đãi · Voucher */}
              <div className="rounded-3xl bg-white border border-[#E8E5E1] p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-base font-bold text-[#2A1810] flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#C28B5B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Mã ưu đãi · Voucher
                  </h3>
                  {appliedVoucher && (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Đã áp dụng 1 ưu đãi
                    </span>
                  )}
                </div>

                {/* Thẻ Voucher đã áp dụng */}
                {appliedVoucher ? (
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F8EBE0] border border-[#EAD8CA] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2A1810] text-[#C28B5B]">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2A1810]">
                            {appliedVoucher.code}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {appliedVoucher.discountType === 'PERCENT' ? `-${appliedVoucher.discountValue}%` : '-20.000đ'}
                          </span>
                        </div>
                        <p className="text-xs text-[#8A5A00] mt-0.5">
                          Đã tiết kiệm được {appliedVoucher.discountAmount.toLocaleString('vi-VN')}đ cho giỏ hàng này
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-xs font-bold text-[#B3261E] hover:underline px-2 py-1"
                    >
                      ✕ Gỡ · Remove
                    </button>
                  </div>
                ) : (
                  /* Form nhập mã mới */
                  <form onSubmit={handleApplyVoucher} className="flex gap-2">
                    <input
                      type="text"
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.target.value)}
                      placeholder="NHẬP MÃ ƯU ĐÃI (BREWCOZY, BREWLITE10...)"
                      className="flex-1 rounded-2xl border border-[#E8E5E1] bg-[#F7F3EE] px-4 py-3 text-xs sm:text-sm uppercase font-semibold text-[#2A1810] placeholder-stone-400 focus:bg-white focus:border-[#2A1810] focus:outline-none transition-all"
                    />
                    <button
                      type="submit"
                      className="rounded-2xl bg-[#2A1810] px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#42271A] transition-colors"
                    >
                      Áp dụng · Apply
                    </button>
                  </form>
                )}

                {voucherError && (
                  <p className="text-xs text-[#B3261E] mt-2 font-medium">
                    ⚠️ {voucherError}
                  </p>
                )}
              </div>

              {/* 3. Khối Phương thức thanh toán (Sandbox Mode) */}
              <div className="rounded-3xl bg-white border border-[#E8E5E1] p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#2A1810]">
                      Phương thức thanh toán
                    </h3>
                    <p className="text-xs text-[#6B5D52]">
                      Payment Method · Express Cashless Kiosk
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200 text-[10px] font-bold text-[#8A5A00]">
                    ⚡ Sandbox Mode
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {/* Option 1: Ví điện tử */}
                  <label
                    onClick={() => setPaymentMethod('WALLET')}
                    className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'WALLET'
                        ? 'bg-[#F8EBE0]/50 border-[#C28B5B] shadow-2xs'
                        : 'bg-white border-[#E8E5E1] hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2A1810] text-[#FBF8F3]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M7 15h0M2 10h20" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2A1810]">
                            Ví điện tử (mô phỏng)
                          </span>
                          <span className="text-[10px] font-bold text-[#6B5D52]">
                            · E-wallet (mock)
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-[9px] font-bold text-[#8A5A00]">
                            MÔ PHỎNG
                          </span>
                        </div>
                        <p className="text-xs text-[#6B5D52] mt-1 leading-relaxed">
                          Môi trường thử nghiệm sandbox không trừ tiền thật. Đơn hàng hoàn tất và chuyển vào quầy pha chế ngay lập tức.
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-[#8A5A00]">
                          <span>⚡ Phê duyệt tức thời</span>
                          <span>·</span>
                          <span>🛡️ Không cần nhập thẻ</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          paymentMethod === 'WALLET'
                            ? 'border-[#2A1810] bg-[#2A1810] text-white'
                            : 'border-[#E8E5E1]'
                        }`}
                      >
                        {paymentMethod === 'WALLET' && (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Thẻ ngân hàng */}
                  <label
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'CARD'
                        ? 'bg-[#F8EBE0]/50 border-[#C28B5B] shadow-2xs'
                        : 'bg-white border-[#E8E5E1] hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-800 text-stone-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2A1810]">
                            Thẻ ngân hàng (mô phỏng)
                          </span>
                          <span className="text-[10px] font-bold text-[#6B5D52]">
                            · Card (mock)
                          </span>
                        </div>
                        <p className="text-xs text-[#6B5D52] mt-1">
                          Hỗ trợ thẻ nội địa Napas, Visa, Mastercard trong môi trường Sandbox giả lập.
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          paymentMethod === 'CARD'
                            ? 'border-[#2A1810] bg-[#2A1810] text-white'
                            : 'border-[#E8E5E1]'
                        }`}
                      >
                        {paymentMethod === 'CARD' && (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Banner cam kết */}
                <div className="mt-4 p-3.5 rounded-2xl bg-[#F7F3EE] flex items-start gap-3 text-xs text-[#6B5D52]">
                  <span className="text-base">📢</span>
                  <span>
                    <strong>Cam kết 100% Không Tiền Mặt:</strong> BrewLite phục vụ tốc độ cao cho khách hàng năng động. Tất cả đơn hàng thanh toán qua cổng số hóa đều được điều phối trực tiếp tới Barista Trạm 01 & 02 để bắt đầu pha chế trong vòng 3 phút.
                  </span>
                </div>
              </div>
            </div>

            {/* Cột phải (5/12): Bảng tính tiền & Nút xác nhận thanh toán */}
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

                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700">
                      <span>Khuyến mãi {appliedVoucher?.code}</span>
                      <span className="font-bold">
                        -{discountAmount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[#6B5D52]">
                    <span>Phí dịch vụ Kiosk · Service fee</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                      0đ (Miễn phí)
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E8E5E1] flex items-baseline justify-between">
                    <div>
                      <p className="font-bold text-xs uppercase text-[#2A1810]">
                        TỔNG THANH TOÁN
                      </p>
                      <p className="text-[11px] text-[#6B5D52]">
                        Total Amount (VAT incl.)
                      </p>
                    </div>
                    <span className="font-serif text-3xl font-bold text-[#2A1810]">
                      {finalTotal.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  {/* Điểm thưởng tích lũy */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8EBE0] border border-[#EAD8CA] text-xs font-semibold text-[#8A5A00]">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#C28B5B]" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" stroke="#8A5A00" strokeWidth="1.5" fill="#F8EBE0" />
                      </svg>
                      Điểm thưởng tích lũy · Reward points
                    </span>
                    <span className="font-bold">+{rewardPoints} điểm</span>
                  </div>
                </div>

                {/* Thông báo lỗi thanh toán nếu có */}
                {checkoutError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <svg className="w-4 h-4 shrink-0 text-red-500 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{checkoutError}</span>
                  </div>
                )}

                {/* Nút hành động chính: Xác nhận thanh toán */}
                <button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="w-full flex flex-col items-center justify-center py-4 px-6 rounded-2xl bg-[#2A1810] text-white hover:bg-[#42271A] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md mt-2"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="font-bold text-sm sm:text-base">
                        Đang khởi tạo thanh toán sandbox...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-sm sm:text-base">
                          Xác nhận thanh toán · Confirm
                        </span>
                        <span className="font-serif text-lg font-bold">
                          — {finalTotal.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-300 mt-0.5">
                        Ví Sandbox · Khởi tạo đơn tức thời
                      </span>
                    </>
                  )}
                </button>

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
                    <span>Quầy pha chế sẵn sàng: Trạm 01 & 02 · Thời gian chờ ~3-5p</span>
                  </div>
                </div>

                {/* Thẻ nhận thông báo kệ lấy Express */}
                <div className="mt-4 p-4 rounded-2xl bg-[#F7F3EE] border border-[#E8E5E1] flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2A1810] shadow-2xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#2A1810]">
                      Nhận thông báo Kệ Lấy Express
                    </p>
                    <p className="text-[11px] text-[#6B5D52] mt-0.5 leading-relaxed">
                      Mã QR nhận món độc bản sẽ xuất hiện ngay sau khi hoàn tất. Quý khách chỉ cần quét mã tại Kệ Express 04 để lấy ly mang đi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthHydration>
  );
}
