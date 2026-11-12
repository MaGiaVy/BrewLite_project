import React from 'react';
import styles from './admin.module.css';
import { AlertTriangleIcon } from './AdminIcons';
import { formatVnd } from '../../lib/format';

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
  onNavigateInventory,
}: AdminOverviewSectionProps) {
  return (
    <div className="space-y-4">
      {/* Hero Revenue Card */}
      <div className={`${styles.card} ${styles.cardHighlight}`}>
        <div className={styles.metricHeader}>
          <div>
            <p className={styles.metricLabel}>Doanh thu hôm nay</p>
            <h2 className={styles.metricValue}>{formatVnd(revenueToday)}</h2>
          </div>
          <span className={styles.growthPill}>{activeCount} đang xử lý</span>
        </div>

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

        <div className="mt-2.5 text-[11px] text-[#a89587] flex justify-between">
          <span>Hoàn tất: {completedCount} đơn</span>
          <span>Đang chờ/pha: {activeCount} đơn</span>
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
