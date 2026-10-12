'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AuthHydration from '@/components/AuthHydration';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyOrders } from '@/api/orders';

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dữ liệu đơn hàng mẫu chuẩn kịch bản Kiosk
  const sampleOrders = [
    {
      id: '1042',
      date: '10/10/2026 · 10:42',
      status: 'PREPARING',
      statusText: 'Đang pha chế · Preparing',
      badgeClass: 'bg-[#F8EBE0] text-[#8A5A00] border-[#EAD8CA]',
      summary: '2 món: Cà Phê Muối (Size M), Cà Phê Sữa Đá (Size S)',
      total: 89250,
      rewardPoints: 8,
    },
    {
      id: '1038',
      date: '08/10/2026 · 15:20',
      status: 'COMPLETED',
      statusText: 'Hoàn tất · Completed',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      summary: '1 món: Caramel Macchiato (Size L)',
      total: 65000,
      rewardPoints: 6,
    },
    {
      id: '1025',
      date: '05/10/2026 · 09:15',
      status: 'CANCELLED',
      statusText: 'Đã hủy · Cancelled',
      badgeClass: 'bg-stone-100 text-[#6B5D52] border-stone-200',
      summary: '1 món: Cold Brew Cam Sả (Size S)',
      total: 52000,
      rewardPoints: 0,
    },
  ];

  // Tải danh sách đơn hàng thực tế từ Backend (GET /api/v1/orders/me)
  useEffect(() => {
    let isMounted = true;
    fetchMyOrders()
      .then((data) => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          const mapped = data.map((ord: any) => {
            const summary = ord.items?.length
              ? `${ord.items.length} món: ${ord.items.map((i: any) => i.product?.name || 'Món nước').join(', ')}`
              : 'Đơn hàng đồ uống BrewLite';

            let statusText = 'Đang xử lý';
            let badgeClass = 'bg-[#F8EBE0] text-[#8A5A00] border-[#EAD8CA]';
            if (ord.status === 'COMPLETED') {
              statusText = 'Hoàn tất · Completed';
              badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            } else if (ord.status === 'CANCELLED') {
              statusText = 'Đã hủy · Cancelled';
              badgeClass = 'bg-stone-100 text-[#6B5D52] border-stone-200';
            } else if (ord.status === 'PAID') {
              statusText = 'Đã thanh toán · Paid';
              badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
            } else if (ord.status === 'PREPARING') {
              statusText = 'Đang pha chế · Preparing';
              badgeClass = 'bg-[#F8EBE0] text-[#8A5A00] border-[#EAD8CA]';
            } else if (ord.status === 'READY') {
              statusText = 'Sẵn sàng nhận · Ready';
              badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            }

            return {
              id: ord.id,
              date: new Date(ord.createdAt).toLocaleString('vi-VN'),
              status: ord.status,
              statusText,
              badgeClass,
              summary,
              total: ord.finalTotal,
              rewardPoints: Math.floor(ord.finalTotal / 10000),
            };
          });
          setOrdersList(mapped);
        } else {
          setOrdersList(sampleOrders);
        }
      })
      .catch(() => {
        if (isMounted) setOrdersList(sampleOrders);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayOrders = ordersList.length > 0 ? ordersList : sampleOrders;

  const filteredOrders = displayOrders.filter((order) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') return order.status === 'PREPARING' || order.status === 'PENDING' || order.status === 'PAID' || order.status === 'READY';
    if (activeTab === 'COMPLETED') return order.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return order.status === 'CANCELLED';
    return true;
  });

  return (
    <AuthHydration>
      <div className="min-h-screen bg-[#FBF8F3] text-[#2A1810] flex flex-col pb-24 md:pb-12">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E5E1]">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#C28B5B]">
                LỊCH SỬ GỌI MÓN · ORDER HISTORY
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#2A1810] mt-1">
                Đơn hàng của tôi · My orders
              </h1>
            </div>

            {/* Thống kê điểm thưởng tài khoản */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-[#E8E5E1] shadow-2xs self-start sm:self-auto">
              <span className="text-base">⭐</span>
              <div>
                <p className="text-[11px] text-[#6B5D52]">Điểm thưởng tích lũy</p>
                <p className="font-serif font-bold text-sm text-[#8A5A00]">
                  {user?.loyaltyPoints ?? 120} điểm BrewLite
                </p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'ALL', label: 'Tất cả · All' },
              { id: 'ACTIVE', label: 'Đang xử lý · In progress' },
              { id: 'COMPLETED', label: 'Hoàn tất · Completed' },
              { id: 'CANCELLED', label: 'Đã hủy · Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#2A1810] text-white shadow-xs'
                    : 'bg-white text-[#6B5D52] border border-[#E8E5E1] hover:border-[#2A1810]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Danh sách đơn hàng */}
          <div className="mt-6 flex flex-col gap-4">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8E5E1] shadow-2xs hover:border-[#C28B5B]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-serif text-xl font-bold text-[#2A1810]">
                        #{ord.id}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${ord.badgeClass}`}
                      >
                        {ord.statusText}
                      </span>
                      <span className="text-xs text-[#6B5D52] font-mono hidden sm:inline">
                        {ord.date}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#6B5D52]">
                      {ord.summary}
                    </p>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-serif font-bold text-base text-[#2A1810]">
                        {ord.total.toLocaleString('vi-VN')}đ
                      </span>
                      {ord.rewardPoints > 0 && (
                        <span className="text-[#8A5A00] font-semibold">
                          +{ord.rewardPoints} điểm thưởng
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F7F3EE]">
                    <Link
                      href={`/orders/${ord.id}`}
                      className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl bg-[#F8EBE0] text-[#2A1810] text-xs font-bold hover:bg-[#2A1810] hover:text-white transition-all shadow-2xs"
                    >
                      Xem chi tiết đơn →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center rounded-3xl bg-white border border-[#E8E5E1]">
                <p className="text-sm text-[#6B5D52]">
                  Không tìm thấy đơn hàng nào trong mục này.
                </p>
              </div>
            )}
          </div>
        </main>

        <MobileBottomNav />
      </div>
    </AuthHydration>
  );
}
