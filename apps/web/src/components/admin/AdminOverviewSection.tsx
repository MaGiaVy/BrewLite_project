import React from 'react';
import styles from './admin.module.css';
import { AlertTriangleIcon } from './AdminIcons';
import { formatVnd } from '../../lib/format';

interface AdminOverviewSectionProps {
  revenueToday: number;
  ordersCount: number;
  lowStockItemsCount: number;
  recentOrders: Array<{
    id: number;
    status: string;
    totalAmount: number;
    createdAt: string;
    itemsSummary?: string;
  }>;
  onNavigateInventory: () => void;
}

export function AdminOverviewSection({
  revenueToday,
  ordersCount,
  lowStockItemsCount,
  recentOrders,
  onNavigateInventory,
}: AdminOverviewSectionProps) {
  return (
    <div className="space-y-4">
      {/* Hero Revenue Card */}
      <div className={`${styles.card} ${styles.cardHighlight}`}>
        <div className={styles.metricHeader}>
          <div>
            <p className={styles.metricLabel}>Doanh thu hôm nay</p>
            <h2 className={styles.metricValue}>
              {formatVnd(revenueToday || 18450000)}
            </h2>
          </div>
          <span className={styles.growthPill}>▲ +14.2%</span>
        </div>

        {/* 7-Day Mini Sparkline Chart */}
        <div className="mt-4 pt-3 border-t border-[#361f15] flex items-end justify-between gap-1 h-14">
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-[#361f15] rounded-t h-7" />
            <span className="text-[9px] text-[#a89587]">T2</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-[#361f15] rounded-t h-9" />
            <span className="text-[9px] text-[#a89587]">T3</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-[#361f15] rounded-t h-6" />
            <span className="text-[9px] text-[#a89587]">T4</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-[#361f15] rounded-t h-10" />
            <span className="text-[9px] text-[#a89587]">T5</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-[#361f15] rounded-t h-8" />
            <span className="text-[9px] text-[#a89587]">T6</span>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-[#d4af37] rounded-t h-12" />
            <span className="text-[9px] font-bold text-[#d4af37]">H.Nay</span>
          </div>
        </div>

        {/* 2-col Stats */}
        <div className={styles.gridStats}>
          <div className={styles.statBox}>
            <span className={styles.statBoxLabel}>Tổng đơn hàng</span>
            <div className={styles.statBoxValue}>{ordersCount || 142} đơn</div>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statBoxLabel}>Tốc độ pha chế</span>
            <div className={styles.statBoxValue}>~4.2 phút / đơn</div>
          </div>
        </div>
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
                Hạt cà phê và sữa tươi đang ở mức tối thiểu
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
          <span className="text-[10px] text-[#34d399] font-mono font-bold">
            ⚡ Trực tiếp
          </span>
        </div>

        <div className="space-y-2.5">
          {recentOrders.length === 0 ? (
            <p className="text-xs text-[#a89587] py-2 text-center">
              Chưa có đơn hàng nào hôm nay
            </p>
          ) : (
            recentOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="p-3 rounded-xl bg-[#1a120e] border border-[#361f15] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#fff8f0]">
                      #{order.id}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/30">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#d3bfb2] mt-0.5">
                    {order.itemsSummary || 'Đơn gọi món tại quầy'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#d4af37]">
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
