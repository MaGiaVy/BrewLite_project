'use client';

import { useState, useEffect, useMemo } from 'react';
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
    code: 'BREWCOZY',
    discountType: 'PERCENT',
    discountValue: 15,
    discountAmount: Math.floor(subtotal * 0.15),
  });

  // Phương thức thanh toán: WALLET (VietQR/MoMo/ZaloPay), CARD (Thẻ ngân hàng), APPLE_PAY (Apple Pay / Face ID)
  type PaymentMethodType = 'WALLET' | 'CARD' | 'APPLE_PAY';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('WALLET');

  // Chế độ mô phỏng lỗi (dùng để demo State Machine: PAYMENT_FAILED)
  const [simulateFailure, setSimulateFailure] = useState(false);

  // Form Thẻ Tín Dụng / Ghi Nợ (Mock Stripe Element)
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardName, setCardName] = useState('BREWLITE GUEST');

  // Modal giả lập sinh trắc học Face ID / Touch ID cho Apple Pay
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricState, setBiometricState] = useState<'SCANNING' | 'SUCCESS' | 'FAILED'>('SCANNING');

  // Trạng thái sao chép clipboard
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Trạng thái đang xử lý thanh toán
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Tự động nhận diện loại thẻ dựa trên tiền tố số thẻ
  const cardBrand = useMemo(() => {
    const raw = cardNumber.replace(/\s/g, '');
    if (raw.startsWith('4')) return 'Visa';
    if (raw.startsWith('5')) return 'Mastercard';
    if (raw.startsWith('9704')) return 'Napas';
    return 'Thẻ Quốc tế';
  }, [cardNumber]);

  // Sao chép nhanh vào clipboard
  const handleCopy = (text: string, fieldName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

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

  // Xác nhận thanh toán (Ráp nối API Task 8 & Task 10)
  const executePayment = async (overrideMethod?: PaymentMethodType) => {
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
      const currentMethod = overrideMethod || paymentMethod;
      const backendPaymentMethod = currentMethod === 'CARD' || currentMethod === 'APPLE_PAY' ? 'CARD' : 'WALLET';

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
        paymentMethod: backendPaymentMethod,
      };

      // 4. Gọi Backend POST /api/v1/orders
      const createdOrder = await createOrder(orderPayload, orderIdempotencyKey);

      // 5. Gọi Backend POST /api/v1/payments (Task 8 & 10: Mock Gateway + State Machine)
      const paymentIdempotencyKey = `pay-${createdOrder.id}-${orderIdempotencyKey}`;
      const payResult = await processPayment(
        {
          orderId: createdOrder.id,
          amount: createdOrder.finalTotal,
          method: backendPaymentMethod,
          forceSuccess: !simulateFailure, // Nếu bật simulateFailure -> forceSuccess = false để test State Machine
        },
        paymentIdempotencyKey
      );

      // Xử lý kết quả trả về từ Backend
      if (payResult?.data?.status === 'FAILURE' || simulateFailure) {
        setCheckoutError(
          payResult?.message ||
            '⚠️ [State Machine Demo] Giao dịch thanh toán bị từ chối bởi Ngân hàng / Ví điện tử. Trạng thái đơn hàng đã chuyển sang PAYMENT_FAILED.'
        );
        setIsProcessing(false);
        return;
      }

      // 6. Thanh toán thành công (PAID): Lưu thông tin đơn vào localStorage làm cache
      const orderData = {
        orderId: createdOrder.id,
        createdAt: createdOrder.createdAt || new Date().toISOString(),
        items,
        subtotal: createdOrder.subtotal || subtotal,
        discountAmount: createdOrder.discountAmount || discountAmount,
        finalTotal: createdOrder.finalTotal || finalTotal,
        paymentMethod:
          currentMethod === 'WALLET'
            ? 'VietQR / Ví điện tử'
            : currentMethod === 'APPLE_PAY'
            ? 'Apple Pay (Face ID)'
            : 'Thẻ thanh toán quốc tế',
        voucherCode: appliedVoucher?.code,
        rewardPoints: payResult?.data?.loyaltyPointsAdded || rewardPoints,
        transactionCode: payResult?.data?.paymentId || `TX-${createdOrder.id.substring(0, 8)}`,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('brewlite-last-order', JSON.stringify(orderData));
      }

      // 7. Đặt cờ đang chuyển hướng để tránh nhấp nháy
      setIsRedirecting(true);

      // 8. Xóa giỏ hàng sau khi thanh toán thành công
      clearCart();

      // 9. Chuyển hướng sang trang Theo dõi đơn hàng với orderId thật từ Database
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

  // Kích hoạt mô phỏng sinh trắc học Face ID cho Apple Pay
  const triggerBiometricPayment = () => {
    setShowBiometricModal(true);
    setBiometricState('SCANNING');

    setTimeout(() => {
      if (simulateFailure) {
        setBiometricState('FAILED');
        setTimeout(() => {
          setShowBiometricModal(false);
          setCheckoutError(
            '⚠️ [Biometric Demo] Xác thực sinh trắc học Face ID bị từ chối hoặc giao dịch thất bại. Đơn hàng chuyển sang PAYMENT_FAILED.'
          );
        }, 1200);
      } else {
        setBiometricState('SUCCESS');
        setTimeout(async () => {
          setShowBiometricModal(false);
          await executePayment('APPLE_PAY');
        }, 700);
      }
    }, 1500);
  };

  const handleConfirmPayment = () => {
    if (paymentMethod === 'APPLE_PAY') {
      triggerBiometricPayment();
    } else {
      executePayment();
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

  // Màn hình chuyển hướng mượt mà ngay sau khi thanh toán thành công
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[#FBF8F3] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#C28B5B] border-t-transparent" />
          <h2 className="font-serif text-xl font-bold text-[#2A1810] mt-4">
            Thanh toán thành công!
          </h2>
          <p className="mt-1 text-sm text-[#6B5D52]">
            Đang chuyển sang màn hình nhận đồ uống tại quầy Express...
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
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#2A1810] px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#42271A] transition-colors"
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

          {/* Bố cục 2 Cột */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Cột trái (7/12): Danh sách món + Voucher + Phương thức thanh toán (VietQR/Face ID/Thẻ) */}
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

                <div className="divide-y divide-[#F7F3EE] mt-2 max-h-72 overflow-y-auto pr-1">
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
                    <svg className="w-5 h-5 text-[#C28B5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Mã ưu đãi thành viên · Voucher
                  </h3>
                  <span className="text-[11px] font-semibold text-[#6B5D52]">
                    Tối đa 1 mã / đơn
                  </span>
                </div>

                {appliedVoucher ? (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8EBE0]/60 border border-[#C28B5B]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2A1810] text-[#C28B5B]">
                        ✓
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#2A1810]">
                          Mã: {appliedVoucher.code} (-{appliedVoucher.discountValue}{appliedVoucher.discountType === 'PERCENT' ? '%' : 'đ'})
                        </p>
                        <p className="text-xs text-emerald-700 font-medium">
                          Đã giảm -{appliedVoucher.discountAmount.toLocaleString('vi-VN')}đ vào đơn hàng
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-xs text-[#B3261E] hover:underline font-bold px-2 py-1"
                    >
                      Gỡ bỏ
                    </button>
                  </div>
                ) : (
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
                      Áp dụng
                    </button>
                  </form>
                )}

                {voucherError && (
                  <p className="text-xs text-[#B3261E] mt-2 font-medium">
                    ⚠️ {voucherError}
                  </p>
                )}
              </div>

              {/* 3. Khối Phương thức thanh toán nâng cao (VietQR / Biometric / Thẻ) */}
              <div className="rounded-3xl bg-white border border-[#E8E5E1] p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F7F3EE]">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#2A1810]">
                      Phương thức thanh toán
                    </h3>
                    <p className="text-xs text-[#6B5D52]">
                      100% Cashless Kiosk · An Toàn & Chuẩn Xác
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Cổng thanh toán tự động
                  </span>
                </div>

                {/* Danh sách các tùy chọn thanh toán */}
                <div className="flex flex-col gap-3.5">
                  {/* TÙY CHỌN 1: Chuyển khoản VietQR / Ví MoMo / ZaloPay */}
                  <div
                    onClick={() => setPaymentMethod('WALLET')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'WALLET'
                        ? 'bg-[#FAF6F0] border-[#C28B5B] shadow-2xs'
                        : 'bg-white border-[#E8E5E1] hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2A1810] text-[#FBF8F3]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M7 15h0M2 10h20" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-[#2A1810]">
                              Chuyển khoản VietQR / Ví điện tử
                            </span>
                            <span className="bg-[#FDF0E6] text-[#C25E00] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Khuyên dùng
                            </span>
                          </div>
                          <p className="text-xs text-[#6B5D52] mt-0.5">
                            Quét mã QR bằng mọi app Ngân hàng (MB, VCB, Techcom...) hoặc MoMo, ZaloPay
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded bg-[#E6F0FA] text-[#005BAA] border border-[#B8D5F2]">
                          VietQR
                        </span>
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded bg-[#FDF0EC] text-[#C93B1F] border border-[#F8D0C3]">
                          NAPAS 247
                        </span>
                      </div>
                    </div>

                    {/* Khối mở rộng con: Hiển thị mã VietQR động thật và thông tin ngân hàng MB */}
                    {paymentMethod === 'WALLET' && (
                      <div className="mt-4 pt-4 border-t border-[#EAE4DC] flex flex-col md:flex-row items-center md:items-start gap-5">
                        {/* Ảnh VietQR động từ img.vietqr.io */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="relative w-44 h-44 bg-white border border-[#EAE4DC] rounded-2xl p-2 shadow-xs flex items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${finalTotal}&addInfo=BREWLITE_ORDER&accountName=BREWLITE%20ROASTERY`}
                              alt="VietQR BrewLite Roastery"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-[10px] text-stone-500 mt-1.5 font-medium flex items-center gap-1">
                            ⚡ Quét tự động điền đúng số tiền & nội dung
                          </span>
                        </div>

                        {/* Thông tin tài khoản ngân hàng + Nút Sao chép */}
                        <div className="flex-1 w-full flex flex-col gap-2 text-xs">
                          <div className="bg-white rounded-xl p-3 border border-[#E8E5E1] flex flex-col gap-2">
                            <div className="flex items-center justify-between pb-1.5 border-b border-[#F7F3EE]">
                              <span className="text-stone-500">Ngân hàng thụ hưởng:</span>
                              <span className="font-bold text-[#1A120B]">MB Bank (Quân Đội)</span>
                            </div>

                            <div className="flex items-center justify-between pb-1.5 border-b border-[#F7F3EE]">
                              <span className="text-stone-500">Chủ tài khoản:</span>
                              <span className="font-bold text-[#1A120B]">BREWLITE ROASTERY</span>
                            </div>

                            <div className="flex items-center justify-between pb-1.5 border-b border-[#F7F3EE]">
                              <span className="text-stone-500">Số tài khoản:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-[#1A120B]">
                                  0987654321
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy('0987654321', 'accountNumber');
                                  }}
                                  className="px-2 py-0.5 rounded bg-[#F7F3EE] hover:bg-stone-200 text-[#845326] border border-stone-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                                >
                                  {copiedField === 'accountNumber' ? '✓ Đã chép' : 'Sao chép'}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pb-1.5 border-b border-[#F7F3EE]">
                              <span className="text-stone-500">Số tiền chuyển:</span>
                              <span className="font-serif font-bold text-sm text-[#C28B5B]">
                                {finalTotal.toLocaleString('vi-VN')}đ
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-stone-500">Nội dung chuyển:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-[#F7F3EE] px-2 py-0.5 rounded border border-[#E8E5E1] text-[#1A120B]">
                                  BREWLITE_ORDER
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy('BREWLITE_ORDER', 'memo');
                                  }}
                                  className="px-2 py-0.5 rounded bg-[#F7F3EE] hover:bg-stone-200 text-[#845326] border border-stone-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                                >
                                  {copiedField === 'memo' ? '✓ Đã chép' : 'Sao chép'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TÙY CHỌN 2: Apple Pay / Google Wallet (Sinh trắc học Face ID) */}
                  <div
                    onClick={() => setPaymentMethod('APPLE_PAY')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'APPLE_PAY'
                        ? 'bg-[#FAF6F0] border-[#C28B5B] shadow-2xs'
                        : 'bg-white border-[#E8E5E1] hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 384 512">
                            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#2A1810]">
                              Apple Pay / Google Wallet (1-Chạm Face ID)
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Sinh trắc học
                            </span>
                          </div>
                          <p className="text-xs text-[#6B5D52] mt-0.5">
                            Thanh toán siêu tốc không cần nhập thẻ qua cảm biến khuôn mặt Face ID / Touch ID
                          </p>
                        </div>
                      </div>
                    </div>

                    {paymentMethod === 'APPLE_PAY' && (
                      <div className="mt-3 pt-3 border-t border-[#EAE4DC] flex items-center justify-between text-xs text-stone-600">
                        <span>Nhấn nút thanh toán để kích hoạt mô phỏng quét Face ID</span>
                        <span className="font-semibold text-black flex items-center gap-1">
                           Pay Express
                        </span>
                      </div>
                    )}
                  </div>

                  {/* TÙY CHỌN 3: Thẻ ngân hàng / Thẻ quốc tế (Visa / Mastercard) */}
                  <div
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'CARD'
                        ? 'bg-[#FAF6F0] border-[#C28B5B] shadow-2xs'
                        : 'bg-white border-[#E8E5E1] hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
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
                              Thẻ ngân hàng & Thẻ quốc tế
                            </span>
                            <span className="text-[10px] font-bold text-[#6B5D52]">
                              ({cardBrand})
                            </span>
                          </div>
                          <p className="text-xs text-[#6B5D52] mt-0.5">
                            Hỗ trợ thẻ nội địa Napas và thẻ quốc tế Visa, Mastercard Sandbox
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Form nhập thẻ */}
                    {paymentMethod === 'CARD' && (
                      <div className="mt-4 pt-4 border-t border-[#EAE4DC] grid grid-cols-2 gap-3 text-xs">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                            Số thẻ:
                          </label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="w-full rounded-xl border border-[#E8E5E1] bg-white px-3 py-2 text-xs font-mono font-bold text-[#2A1810]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                            Hết hạn:
                          </label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full rounded-xl border border-[#E8E5E1] bg-white px-3 py-2 text-xs font-mono font-bold text-[#2A1810]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                            CVC / CVV:
                          </label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full rounded-xl border border-[#E8E5E1] bg-white px-3 py-2 text-xs font-mono font-bold text-[#2A1810]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* KHỐI KIỂM THỬ ĐẶC BIỆT: CÔNG TẮC SIMULATE FAILURE CHO GIẢNG VIÊN */}
                <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🧪</span>
                      <div>
                        <p className="font-bold text-xs text-[#8A5A00] uppercase tracking-wide">
                          Chế độ Kiểm thử State Machine (Task 10)
                        </p>
                        <p className="text-[11px] text-stone-600 mt-0.5">
                          Bật tùy chọn này để mô phỏng lỗi thanh toán và kiểm tra trạng thái PAYMENT_FAILED
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={simulateFailure}
                        onChange={(e) => setSimulateFailure(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600" />
                    </label>
                  </div>
                  {simulateFailure && (
                    <div className="mt-2.5 pt-2 border-t border-amber-200/80 text-[11px] text-red-700 font-semibold flex items-center gap-1.5">
                      <span>⚠️ Đang bật: Hệ thống sẽ cố tình giả lập ngân hàng từ chối giao dịch để thầy nghiệm thu trạng thái PAYMENT_FAILED của State Machine!</span>
                    </div>
                  )}
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

                  {/* Điểm thưởng tích lũy (Loyalty Points Task 10) */}
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#F8EBE0] border border-[#EAD8CA] text-xs font-semibold text-[#8A5A00]">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-600 font-bold">⭐</span>
                      Tích lũy ngay vào tài khoản BrewLite
                    </span>
                    <span className="font-bold font-mono text-sm">+{rewardPoints} Hạt Vàng</span>
                  </div>
                </div>

                {/* Thông báo lỗi thanh toán / Alert Error State Machine */}
                {checkoutError && (
                  <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-xs text-red-700 flex items-start gap-3 my-2 animate-shake">
                    <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      ✕
                    </div>
                    <div>
                      <p className="font-bold text-sm text-red-900 mb-0.5">Thanh toán không thành công</p>
                      <p className="leading-relaxed">{checkoutError}</p>
                    </div>
                  </div>
                )}

                {/* Nút hành động chính: Xác nhận thanh toán */}
                <button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className={`w-full flex flex-col items-center justify-center py-4 px-6 rounded-2xl text-white active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md mt-2 ${
                    simulateFailure
                      ? 'bg-red-800 hover:bg-red-900'
                      : paymentMethod === 'APPLE_PAY'
                      ? 'bg-black hover:bg-neutral-800'
                      : 'bg-[#2A1810] hover:bg-[#42271A]'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="font-bold text-sm sm:text-base">
                        Đang kết nối cổng thanh toán...
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                          {paymentMethod === 'APPLE_PAY' && ''}
                          {simulateFailure
                            ? 'Mô phỏng Thất Bại (Test State Machine)'
                            : paymentMethod === 'APPLE_PAY'
                            ? 'Thanh toán với Face ID'
                            : 'Xác nhận thanh toán · Confirm'}
                        </span>
                        <span className="font-serif text-lg font-bold">
                          — {finalTotal.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-300 mt-0.5">
                        {paymentMethod === 'WALLET'
                          ? 'Mã VietQR động · Nhận tại quầy Express'
                          : paymentMethod === 'APPLE_PAY'
                          ? 'Xác thực sinh trắc học 1-chạm'
                          : 'Thẻ thanh toán · Hoàn tất tức thời'}
                      </span>
                    </>
                  )}
                </button>

                <div className="mt-4 pt-4 border-t border-[#F7F3EE] space-y-2 text-xs text-[#6B5D52]">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Bảo mật giao dịch đa tầng · Idempotency Protected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#C28B5B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>Quầy pha chế sẵn sàng: Trạm 01 & 02 · Chuẩn bị trong ~3-5p</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* MODAL MÔ PHỎNG SINH TRẮC HỌC FACE ID KHI CHỌN APPLE PAY */}
        {showBiometricModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 text-center flex flex-col items-center">
              {/* Vòng tròn biểu tượng Face ID */}
              <div className="relative w-24 h-24 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                {biometricState === 'SCANNING' && (
                  <>
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin" />
                    <svg className="w-12 h-12 text-stone-700 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3H5a2 2 0 00-2 2v2m0 10v2a2 2 0 002 2h2m10-18h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M9 10h.01M15 10h.01M9 15h6" />
                    </svg>
                  </>
                )}
                {biometricState === 'SUCCESS' && (
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center text-3xl font-bold animate-scale-up">
                    ✓
                  </div>
                )}
                {biometricState === 'FAILED' && (
                  <div className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center text-3xl font-bold animate-shake">
                    ✕
                  </div>
                )}
              </div>

              <h4 className="font-serif text-lg font-bold text-[#1A120B]">
                {biometricState === 'SCANNING'
                  ? 'Đang nhận diện khuôn mặt Face ID...'
                  : biometricState === 'SUCCESS'
                  ? 'Xác thực sinh trắc học thành công!'
                  : 'Xác thực thất bại!'}
              </h4>
              <p className="text-xs text-stone-500 mt-1">
                {biometricState === 'SCANNING'
                  ? 'Vui lòng nhìn thẳng vào màn hình để hoàn tất giao dịch Apple Pay'
                  : biometricState === 'SUCCESS'
                  ? 'Giao dịch đang được chuyển tới máy chủ BrewLite...'
                  : 'Không thể xác thực danh tính chủ thẻ.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </AuthHydration>
  );
}
