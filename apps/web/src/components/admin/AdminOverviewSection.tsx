import React from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import { AlertTriangleIcon, CupIcon } from './AdminIcons';
import { formatVnd } from '../../lib/format';
import { RevenueSparkline, type RevenueSparklineOrder } from './RevenueSparkline';

interface AdminOverviewSectionProps {
  revenueToday: number;
  ordersCount: number;
  completedCount?: number;
  activeCount?: number;
  grossProfit?: number;
  lowStockItemsCount: number;
  recentOrders: Array<{
    id: number;
    status: string;
    totalAmount: number;
    createdAt: string;
    itemsSummary?: string;
  }>;
  chartOrders?: RevenueSparklineOrder[];
  onNavigateInventory: () => void;
}

export function AdminOverviewSection({
  revenueToday,
  ordersCount,
  completedCount = 0,
  activeCount = 0,
  grossProfit = 0,
  lowStockItemsCount,
  recentOrders,
  chartOrders,
  onNavigateInventory,
}: AdminOverviewSectionProps) {
  return (
    <div className="space-y-4">
      {/* Hero Revenue Card with Mini Sparkline Chart */}
      <div className={`${styles.card} ${styles.cardHighlight}`}>
        <div className={styles.metricHeader}>
          <div>
            <p className={styles.metricLabel}>Doanh thu hôm nay</p>
            <h2 className={styles.metricValue}>{formatVnd(revenueToday)}</h2>
          </div>
          <span className={styles.growthPill}>{activeCount} đang xử lý</span>
        </div>

        {/* 🌟 Mini Sparkline Line Chart */}
        <RevenueSparkline orders={chartOrders ?? recentOrders} />

        {/* 2-col Stats */}
        <div className={styles.gridStats}>
          <div className={styles.statBox}>
            <span className={styles.statBoxLabel}>Tổng đơn hàng</span>
            <div className={styles.statBoxValue}>{ordersCount} đơn</div>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statBoxLabel}>Lợi nhuận gộp</span>
            <div className={styles.statBoxValue}>{formatVnd(grossProfit)}</div>
          </div>
        </div>

        <div className="mt-2.5 text-[11px] text-[#78716C] flex justify-between">
          <span>Hoàn tất: {completedCount} đơn</span>
          <span>Đang chờ/pha: {activeCount} đơn</span>
        </div>
      </div>

      {/* Customer Menu Shortcut Card */}
      <div className="p-3 rounded-2xl border border-[#EBE3D5] bg-[#FFFFFF] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#1C1917] text-[#FAF6F0]">
            <CupIcon size={16} strokeWidth={2} />
          </div>
          <div>
            <div className="font-bold text-xs text-[#1C1917]">Xem Thực Đơn Khách Hàng</div>
            <div className="text-[10px] text-[#78716C]">Trải nghiệm giao diện đặt món của khách</div>
          </div>
        </div>
        <Link
          href="/menu"
          className="px-2.5 py-1 rounded-md text-[10px] font-bold text-[#FFFFFF] shadow-sm flex items-center gap-1 bg-[#1C1917] hover:bg-[#2C2420] transition-colors"
        >
          <span>Mở</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockItemsCount > 0 && (
        <div className={styles.alertCard}>
          <div className={styles.alertLeft}>
            <AlertTriangleIcon size={20} className={styles.alertIcon} />
            <div>
              <h3 className={styles.alertTitle}>
                {lowStockItemsCount} nguyên liệu sắp hết
              </h3>
              <p className={styles.alertDesc}>
                Vui lòng kiểm tra và nhập thêm nguyên vật liệu
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.alertActionBtn}
            onClick={onNavigateInventory}
          >
            Nhập kho
          </button>
        </div>
      )}

      {/* Recent Orders Card Stack */}
      <div className={styles.card}>
        <div className="flex justify-between items-center mb-3">
          <p className={styles.metricLabel}>Đơn hàng gần đây</p>
          <span className="text-[10px] text-[#059669] font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            <span>Trực tiếp</span>
          </span>
        </div>

        <div className="space-y-2.5">
          {recentOrders.length === 0 ? (
            <p className="text-xs text-[#78716C] py-2 text-center">
              Chưa có đơn hàng nào hôm nay
            </p>
          ) : (
            recentOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="p-3 rounded-xl bg-[#FAF6F0] border border-[#EBE3D5] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#1C1917]">
                      #{order.id}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#78716C] mt-0.5">
                    {order.itemsSummary || 'Đơn gọi món tại quầy'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#9C6644]">
                    {formatVnd(order.totalAmount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
