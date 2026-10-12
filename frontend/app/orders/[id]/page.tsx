'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AuthHydration from '@/components/AuthHydration';
import { fetchOrderById } from '@/api/orders';

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  // Dữ liệu đơn hàng (Khởi tạo mặc định và tự động cập nhật từ Backend thật)
  const [order, setOrder] = useState<any>({
    orderId: orderId || '1042',
    createdAt: '10/10/2026 · 10:42',
    status: 'PAID', // 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED'
    items: [
      {
        id: '1',
        name: 'Cà Phê Muối',
        size: 'M',
        toppingsText: 'Kem muối biển đặc biệt',
        iceSugar: '50% Đá · Chuẩn Ngọt',
        quantity: 1,
        lineTotal: 63000,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=400&auto=format&fit=crop',
      },
      {
        id: '2',
        name: 'Cà Phê Sữa Đá',
        size: 'S',
        toppingsText: 'Không topping',
        iceSugar: '70% Đá · Ít Đường',
        quantity: 1,
        lineTotal: 42000,
        imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=400&auto=format&fit=crop',
      },
    ],
    subtotal: 105000,
    voucherCode: 'BREWCOZY',
    discountAmount: 15750,
    finalTotal: 89250,
    paymentMethod: 'Ví điện tử (mô phỏng)',
    rewardPoints: 8,
    transactionCode: 'TX-904291',
  });

  const [currentTime, setCurrentTime] = useState('');

  // Polling 5 giây gọi Backend API thật (Task 9)
  useEffect(() => {
    let isMounted = true;

    const loadOrderData = async () => {
      try {
        const data = await fetchOrderById(orderId);
        if (data && isMounted) {
          setOrder((prev: any) => ({
            ...prev,
            orderId: data.id,
            status: data.status,
            createdAt: new Date(data.createdAt).toLocaleString('vi-VN'),
            subtotal: data.subtotal,
            discountAmount: data.discountAmount,
            finalTotal: data.finalTotal,
            paymentMethod: data.paymentMethod === 'WALLET' ? 'Ví điện tử' : 'Thẻ ngân hàng',
            voucherCode: data.voucher?.code || prev.voucherCode,
            transactionCode: data.payments?.[0]?.id || `TX-${data.id.substring(0, 8)}`,
            items:
              data.items && data.items.length > 0
                ? data.items.map((it: any) => ({
                    id: it.id,
                    name: it.product?.name || 'Đồ uống BrewLite',
                    size: it.size,
                    toppingsText: it.toppings?.length
                      ? it.toppings.map((t: any) => t.toppingName).join(', ')
                      : 'Không topping',
                    iceSugar: `${it.ice || '100% Đá'} · ${it.sugar || 'Chuẩn Ngọt'}`,
                    quantity: it.quantity,
                    lineTotal: it.lineTotal,
                    imageUrl:
                      it.product?.imageUrl ||
                      'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400',
                  }))
                : prev.items,
          }));
        }
      } catch {
        // Fallback đọc cache từ localStorage nếu offline hoặc đơn hàng mới tạo
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('brewlite-last-order');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && isMounted) {
                setOrder((prev: any) => ({
                  ...prev,
                  orderId: parsed.orderId || prev.orderId,
                  items: parsed.items?.length
                    ? parsed.items.map((it: any) => ({
                        id: it.id,
                        name: it.name,
                        size: it.size,
                        toppingsText: it.toppings?.length
                          ? it.toppings.map((t: any) => t.name).join(', ')
                          : 'Không topping',
                        iceSugar: `${it.ice || '100% Đá'} · ${it.sugar || 'Chuẩn Ngọt'}`,
                        quantity: it.quantity,
                        lineTotal: it.lineTotal,
                        imageUrl: it.imageUrl,
                      }))
                    : prev.items,
                  subtotal: parsed.subtotal || prev.subtotal,
                  discountAmount: parsed.discountAmount || prev.discountAmount,
                  finalTotal: parsed.finalTotal || prev.finalTotal,
                  paymentMethod: parsed.paymentMethod || prev.paymentMethod,
                  voucherCode: parsed.voucherCode || prev.voucherCode,
                  rewardPoints: parsed.rewardPoints || prev.rewardPoints,
                }));
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    };

    // Gọi lần đầu
    loadOrderData();

    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN'));
    };
    updateClock();

    // Polling 5s
    const interval = setInterval(() => {
      loadOrderData();
      updateClock();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  // Hàm tính bước tiến trình theo trạng thái (Order State Machine)
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'PAID':
        return 2;
      case 'PREPARING':
        return 3;
      case 'READY':
        return 4;
      case 'COMPLETED':
        return 5;
      case 'CANCELLED':
      case 'PAYMENT_FAILED':
        return 0;
      default:
        return 3;
    }
  };

  const currentStep = getStepIndex(order.status);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { text: 'Chờ thanh toán · Pending', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'PAID':
        return { text: 'Đã thanh toán · Paid', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'PREPARING':
        return { text: 'Đang pha chế · Preparing', bg: 'bg-[#F8EBE0] text-[#8A5A00] border-[#EAD8CA]' };
      case 'READY':
        return { text: 'Sẵn sàng nhận · Ready', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'COMPLETED':
        return { text: 'Hoàn tất · Completed', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'CANCELLED':
        return { text: 'Đã hủy đơn · Cancelled', bg: 'bg-stone-100 text-stone-700 border-stone-200' };
      case 'PAYMENT_FAILED':
        return { text: 'Thanh toán lỗi · Payment Failed', bg: 'bg-red-50 text-red-700 border-red-200' };
      default:
        return { text: 'Đang xử lý · In progress', bg: 'bg-[#F8EBE0] text-[#8A5A00] border-[#EAD8CA]' };
    }
  };

  const statusBadge = getStatusBadge(order.status);

  return (
    <AuthHydration>
      <div className="min-h-screen bg-[#FBF8F3] text-[#2A1810] flex flex-col pb-24 md:pb-12">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
          {/* Header Thông tin Mã đơn */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E5E1]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B5D52]">
                  MÃ ĐƠN · ORDER ID
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#F7F3EE] text-[10px] font-bold text-[#6B5D52]">
                  Express Kiosk
                </span>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2A1810]">
                  #{order.orderId}
                </h1>
                <span className="text-xs text-[#6B5D52] font-mono">
                  {order.createdAt}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold ${statusBadge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${
                  order.status === 'READY' || order.status === 'COMPLETED'
                    ? 'bg-emerald-600'
                    : order.status === 'PAYMENT_FAILED'
                    ? 'bg-red-500'
                    : 'bg-[#C28B5B] animate-pulse'
                }`} />
                {statusBadge.text}
              </span>
              <span className="text-[11px] text-[#6B5D52]">
                🔄 Tự động cập nhật mỗi 5 giây · Cập nhật lúc {currentTime || '10:42:05'}
              </span>
            </div>
          </div>

          {/* Bố cục 2 Cột chuẩn Mockup Ảnh 4 */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Cột trái (7/12): Stepper tiến trình + Thông báo Trạm nhận món */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Card Trạng thái & Mời tới quầy nhận nước - Option A (Theo chuẩn DESIGN.md & Wireframe Thầy) */}
              {order.status === 'READY' || order.status === 'COMPLETED' || currentStep >= 4 ? (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FAF5EE] via-white to-[#F5EBE1] border-2 border-[#C28B5B]/50 p-6 sm:p-7 shadow-[0_8px_30px_rgba(42,24,16,0.07)] transition-all">
                  {/* Watermark trang trí số trạm mờ */}
                  <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#C28B5B]/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-1 right-5 opacity-10 pointer-events-none select-none text-[#2A1810] font-serif text-8xl font-black">
                    02
                  </div>

                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-xs font-bold tracking-wide uppercase border border-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping inline-block mr-1" />
                        {order.status === 'COMPLETED'
                          ? '✨ Đã nhận đồ uống · Completed'
                          : '🎉 Mời tới quầy lấy nước · Ready for pickup'}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#8A5A00] bg-[#F8EBE0] px-2.5 py-1 rounded-lg border border-[#EAD8CA]">
                        Trạm 02 · Station 02
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2A1810] text-[#C28B5B] shadow-md ring-4 ring-[#F8EBE0]">
                        {order.status === 'COMPLETED' ? (
                          <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v4M10 2v4M14 2v4" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2A1810] tracking-tight">
                          {order.status === 'COMPLETED'
                            ? 'Cảm ơn bạn! Đơn hàng đã hoàn tất'
                            : 'Đồ uống đã sẵn sàng! Mời bạn tới quầy nhận nước'}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#6B5D52] mt-1.5 leading-relaxed">
                          {order.status === 'COMPLETED'
                            ? `Đơn hàng #${order.orderId} đã được trao tận tay quý khách. Chúc bạn có những phút giây thưởng thức hương vị cà phê mộc tuyệt vời!`
                            : `Barista đã hoàn tất pha chế món uống của bạn với lớp crema sánh mịn và hương thơm tròn đầy. Vui lòng xuất trình mã đơn #${order.orderId} tại Quầy Bar Express (Trạm 02) để nhận đồ uống nhé!`}
                        </p>
                      </div>
                    </div>

                    {/* Vùng chỉ dẫn quầy và nút về trang chủ theo Wireframe 5 của Thầy */}
                    <div className="mt-2 pt-4 border-t border-[#E8E5E1]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-[#2A1810] font-medium">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        <span>Quầy Bar Express: <strong>Trạm 02 (Active Lane)</strong> · Không cần xếp hàng</span>
                      </div>

                      <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A1810] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#42271A] transition-all shadow-sm"
                      >
                        ← Về trang chủ thực đơn
                      </Link>
                    </div>
                  </div>
                </div>
              ) : order.status === 'PAYMENT_FAILED' ? (
                <div className="rounded-3xl bg-red-50 border border-red-200 p-5 sm:p-6 shadow-2xs flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-red-900">
                      Thanh toán chưa thành công
                    </h3>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">
                      Đơn hàng của bạn vẫn được giữ chỗ trong giỏ hàng và kho nguyên liệu. Vui lòng kiểm tra lại số dư hoặc chọn phương thức thanh toán khác.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl bg-white border border-[#E8E5E1] p-5 sm:p-6 shadow-2xs flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2A1810] text-[#FBF8F3]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#2A1810]">
                      {order.status === 'PAID'
                        ? 'Đã thanh toán thành công · Đang chuyển đến Barista'
                        : 'Đơn hàng của bạn đang được pha chế'}
                    </h3>
                    <p className="text-xs text-[#6B5D52] mt-1 leading-relaxed">
                      Hạt Arabica Cầu Đất tuyển chọn rang mộc mẻ nhỏ. Slow-crafted aroma & velvety espresso blend mang đến lớp crema sánh dày chuẩn xác.
                    </p>
                  </div>
                </div>
              )}

              {/* Card Tiến trình chuẩn bị (Brewing Progress Stepper) */}
              <div className="rounded-3xl bg-white border border-[#E8E5E1] p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-[#F7F3EE]">
                  <h3 className="font-serif text-base font-bold text-[#2A1810]">
                    Tiến trình chuẩn bị · Brewing Progress
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-[#F8EBE0] text-xs font-bold text-[#8A5A00]">
                    {currentStep > 0 ? `Bước ${currentStep} / 5` : 'Đã kết thúc'}
                  </span>
                </div>

                {/* Stepper 5 bước trên Desktop */}
                <div className="hidden sm:grid grid-cols-5 gap-2 pt-6 pb-2 text-center relative">
                  {/* Đường line kết nối */}
                  <div className="absolute top-11 left-[10%] right-[10%] h-1 bg-[#E8E5E1] -z-0">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, ((currentStep - 1) / 4) * 100))}%` }}
                    />
                  </div>

                  {[
                    { index: 1, name: 'Chờ thanh toán', sub: 'Pending' },
                    { index: 2, name: 'Đã thanh toán', sub: 'Paid' },
                    { index: 3, name: 'Đang pha chế', sub: 'Preparing' },
                    { index: 4, name: 'Sẵn sàng', sub: 'Ready' },
                    { index: 5, name: 'Hoàn tất', sub: 'Completed' },
                  ].map((s) => {
                    const isDone = s.index < currentStep || (currentStep === 5 && s.index === 5);
                    const isCurrent = s.index === currentStep && currentStep < 5;
                    return (
                      <div
                        key={s.index}
                        className={`flex flex-col items-center relative z-10 transition-opacity duration-300 ${
                          !isDone && !isCurrent ? 'opacity-50' : ''
                        }`}
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 ${
                            isDone
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-[#2A1810] text-[#C28B5B] ring-4 ring-[#F8EBE0] shadow-md animate-pulse'
                              : 'bg-[#F7F3EE] border border-[#E8E5E1] text-[#6B5D52]'
                          }`}
                        >
                          {isDone ? (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : isCurrent ? (
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2c1.1 0 2 .9 2 2v1.5a5.5 5.5 0 0 1 5.5 5.5c0 3.3-2.7 6-6 6s-6-2.7-6-6A5.5 5.5 0 0 1 11 5.5V4c0-1.1.9-2 2-2z" />
                            </svg>
                          ) : (
                            <span className="text-xs font-bold">{s.index}</span>
                          )}
                        </div>
                        <p className="font-bold text-xs text-[#2A1810] mt-2">{s.name}</p>
                        <p className={`text-[10px] ${isCurrent ? 'font-bold text-[#8A5A00]' : 'text-[#6B5D52]'}`}>
                          {s.sub}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar rút gọn trên Mobile */}
                <div className="sm:hidden pt-4">
                  <div className="w-full bg-[#F7F3EE] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#2A1810] h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, (currentStep / 5) * 100))}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#2A1810] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#C28B5B] inline-block animate-pulse" />
                      Bước {currentStep}/5: {statusBadge.text}
                    </span>
                    <span className="text-[#6B5D52]">
                      {currentStep >= 4 ? 'Sẵn sàng tại quầy' : 'Dự kiến: ~2-3 phút'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Trạm Nhận Nhanh Station 02 */}
              <div className="rounded-3xl bg-white border border-[#E8E5E1] p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F8EBE0] font-serif font-bold text-xl text-[#2A1810] border border-[#EAD8CA]">
                    02
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-base text-[#2A1810]">
                        Trạm Nhận Nhanh · Station 02
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Active Lane
                      </span>
                    </div>
                    <p className="text-xs text-[#6B5D52] mt-0.5">
                      {currentStep >= 4
                        ? `Đồ uống đã có mặt tại quầy. Vui lòng đọc mã #${order.orderId} cho Barista để nhận nước.`
                        : `Vui lòng theo dõi màn hình hiển thị số #${order.orderId} tại quầy Bar Express.`}
                    </p>
                  </div>
                </div>

                <div className="sm:text-right shrink-0">
                  <p className="text-[11px] text-[#6B5D52]">Thời gian dự kiến</p>
                  <p className={`font-serif text-lg font-bold ${currentStep >= 4 ? 'text-emerald-700' : 'text-[#8A5A00]'}`}>
                    {currentStep >= 4 ? 'Sẵn sàng nhận ngay' : '~2 - 3 phút'}
                  </p>
                </div>
              </div>

              {/* Nút hành động phía dưới */}
              <div className="flex items-center gap-4 pt-2">
                <Link
                  href="/"
                  className="flex-1 text-center py-3.5 px-4 rounded-2xl bg-white border border-[#E8E5E1] text-xs sm:text-sm font-bold text-[#2A1810] hover:border-[#2A1810] transition-colors shadow-2xs"
                >
                  ← Về thực đơn · Back to menu
                </Link>
                <Link
                  href="/orders"
                  className="flex-1 text-center py-3.5 px-4 rounded-2xl bg-[#2A1810] text-xs sm:text-sm font-bold text-white hover:bg-[#42271A] transition-colors shadow-md"
                >
                  📋 Lịch sử đơn · My orders
                </Link>
              </div>
            </div>

            {/* Cột phải (5/12): Chi tiết đơn hàng */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="rounded-3xl bg-white border border-[#E8E5E1] p-6 shadow-xs sticky top-24">
                <div className="flex items-center justify-between pb-4 border-b border-[#E8E5E1]">
                  <h3 className="font-serif text-lg font-bold text-[#2A1810]">
                    Chi tiết đơn hàng
                  </h3>
                  <span className="text-xs text-[#6B5D52]">
                    Order Items · {order.items?.length || 2} món
                  </span>
                </div>

                {/* Danh sách món */}
                <div className="py-4 space-y-4 border-b border-[#E8E5E1]">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-11 w-11 rounded-xl object-cover bg-[#F7F3EE] border border-[#E8E5E1]"
                        />
                        <div>
                          <p className="font-serif font-bold text-xs sm:text-sm text-[#2A1810]">
                            {item.quantity}x {item.name}
                          </p>
                          <p className="text-[11px] text-[#6B5D52]">
                            Size {item.size} · {item.toppingsText}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            {item.iceSugar}
                          </p>
                        </div>
                      </div>
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#2A1810]">
                        {item.lineTotal?.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bảng phân bổ chi phí */}
                <div className="py-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-[#6B5D52]">
                    <span>Tạm tính · Subtotal</span>
                    <span className="font-semibold text-[#2A1810]">
                      {order.subtotal?.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  {order.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700">
                      <span>Ưu đãi {order.voucherCode}</span>
                      <span className="font-bold">
                        -{order.discountAmount?.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[#6B5D52]">
                    <span>Phương thức thanh toán</span>
                    <span className="font-semibold text-[#2A1810]">
                      {order.paymentMethod}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E8E5E1] flex items-baseline justify-between">
                    <span className="font-bold text-sm text-[#2A1810]">
                      Tổng thanh toán
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#2A1810]">
                      {order.finalTotal?.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  {/* Điểm thưởng */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8EBE0] border border-[#EAD8CA] text-xs font-semibold text-[#8A5A00] mt-3">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#C28B5B]" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10" stroke="#8A5A00" strokeWidth="1.5" fill="#F8EBE0" />
                      </svg>
                      +{order.rewardPoints} điểm · Reward points
                    </span>
                    <span className="text-[11px] text-[#8A5A00]">Tích lũy tự động</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#F7F3EE] flex items-center justify-between text-[11px] text-[#6B5D52]">
                  <span>Giao dịch xác thực qua Kiosk Hub</span>
                  <span className="font-mono">Mã GD: #{order.transactionCode}</span>
                </div>

                {/* Card hỗ trợ Barista */}
                <div className="mt-4 p-3.5 rounded-2xl bg-[#F7F3EE] border border-[#E8E5E1] flex items-center justify-between text-xs text-[#2A1810] hover:border-[#2A1810] transition-colors cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🎧</span>
                    <div>
                      <p className="font-bold">Cần hỗ trợ về món?</p>
                      <p className="text-[11px] text-[#6B5D52]">Liên hệ trực tiếp Barista tại Trạm 02</p>
                    </div>
                  </div>
                  <span>→</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthHydration>
  );
}
