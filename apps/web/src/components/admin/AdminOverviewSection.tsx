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

const STATUS_PILL_CLASS: Record<string, string> = {
  CANCELLED: styles.orderStatusPillCancelled,
  PAYMENT_FAILED: styles.orderStatusPillCancelled,
  PENDING: styles.orderStatusPillPending,
  PAID: styles.orderStatusPillPaid,
  PREPARING: styles.orderStatusPillPaid,
};

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
    <div className={styles.sectionStackLg}>
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

        <div className={styles.overviewSplitRow}>
          <span>Hoàn tất: {completedCount} đơn</span>
          <span>Đang chờ/pha: {activeCount} đơn</span>
        </div>
      </div>

      {/* Customer Menu Shortcut Card */}
      <div className={styles.shortcutCard}>
        <div className={styles.shortcutLeft}>
          <div className={styles.shortcutIconBox}>
            <CupIcon size={16} strokeWidth={2} />
          </div>
          <div>
            <div className={styles.shortcutTitle}>Xem Thực Đơn Khách Hàng</div>
            <div className={styles.shortcutSubtitle}>Trải nghiệm giao diện đặt món của khách</div>
          </div>
        </div>
        <Link href="/menu" className={styles.shortcutOpenBtn}>
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
        <div className={styles.recentOrdersHeader}>
          <p className={styles.metricLabel}>Đơn hàng gần đây</p>
          <span className={styles.liveIndicator}>
            <span className={styles.liveDot} />
            <span>Trực tiếp</span>
          </span>
        </div>

        <div className={styles.stackSm}>
          {recentOrders.length === 0 ? (
            <p className={styles.emptyInlineText}>
              Chưa có đơn hàng nào hôm nay
            </p>
          ) : (
            recentOrders.slice(0, 4).map((order) => {
              const statusTone = STATUS_PILL_CLASS[order.status] ?? '';
              return (
                <div key={order.id} className={styles.recentOrderCard}>
                  <div className={styles.recentOrderInfo}>
                    <div className={styles.recentOrderTopRow}>
                      <span className={styles.recentOrderId}>
                        #{order.id}
                      </span>
                      <span className={`${styles.orderStatusPill} ${statusTone}`.trim()}>
                        {order.status}
                      </span>
                    </div>
                    <p className={styles.recentOrderSummary}>
                      {order.itemsSummary || 'Đơn gọi món tại quầy'}
                    </p>
                  </div>
                  <div className={styles.recentOrderRight}>
                    <span className={styles.recentOrderAmount}>
                      {formatVnd(order.totalAmount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
