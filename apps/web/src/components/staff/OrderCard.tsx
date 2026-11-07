import React from 'react';
import {
  isLate,
  nextAction,
  parseToppings,
  waitMinutes,
  type StaffOrder,
  type StaffOrderItem,
} from '../../lib/staff-orders';
import styles from './staff.module.css';

export interface OrderCardProps {
  order: StaffOrder;
  now?: Date;
  busy?: boolean;
  onAction: (order: StaffOrder, next: 'PREPARING' | 'READY' | 'COMPLETED') => void;
  onCancel?: (order: StaffOrder) => void;
  onOpenRecipe?: (item: StaffOrderItem) => void;
}

export function OrderCard({
  order,
  now = new Date(),
  busy = false,
  onAction,
  onCancel,
  onOpenRecipe,
}: OrderCardProps) {
  const minutes = waitMinutes(order.createdAt, now);
  const late = isLate(minutes);
  const action = nextAction(order.status);

  const statusChipMap = {
    PAID: { label: 'Mới', class: styles.chipPaid, cardClass: styles.cardPaid },
    PREPARING: { label: 'Đang pha', class: styles.chipPreparing, cardClass: styles.cardPreparing },
    READY: { label: 'Sẵn sàng', class: styles.chipReady, cardClass: styles.cardReady },
    COMPLETED: { label: 'Đã xong', class: styles.chipCompleted, cardClass: styles.cardCompleted },
    CANCELLED: { label: 'Đã hủy', class: styles.chipCompleted, cardClass: styles.cardCompleted },
  };

  const statusConfig = statusChipMap[order.status] || statusChipMap.COMPLETED;

  return (
    <div className={`${styles.card} ${statusConfig.cardClass}`}>
      {/* Top: ID + Chip */}
      <div className={styles.cardTop}>
        <span className={styles.orderId}>#BL-{order.id}</span>
        <span className={`${styles.chip} ${statusConfig.class}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Wait time */}
      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
        <div className={`${styles.waitStatus} ${late ? styles.waitLate : ''}`}>
          {order.status === 'PAID' && <span className={styles.pulseDot} />}
          <span>
            Chờ {minutes} phút{late ? ' · quá lâu' : ''}
          </span>
        </div>
      )}

      {/* Items List */}
      <div className={styles.itemsSection}>
        {order.items.map((item) => {
          const hasRecipe =
            (item.recipeBreakdown && item.recipeBreakdown.length > 0) ||
            (item.toppingBreakdown && item.toppingBreakdown.length > 0);
          const toppingsList = parseToppings(item.toppings);

          return (
            <div key={item.id} className={styles.itemRow}>
              <div className={styles.itemMain}>
                <span>
                  <strong>{item.quantity}x</strong>{' '}
                  {item.productName || item.product?.name || `Món #${item.productId}`}
                </span>
                {item.size && (
                  <span className={styles.sizeBadge}>Size {item.size}</span>
                )}
              </div>

              <div className={styles.itemMeta}>
                {toppingsList.map((top, idx) => (
                  <span key={idx} className={styles.toppingBadge}>
                    +{top}
                  </span>
                ))}

                {hasRecipe && onOpenRecipe && (
                  <button
                    type="button"
                    className={styles.recipeTriggerBtn}
                    onClick={() => onOpenRecipe(item)}
                    aria-label={`Xem công thức ${item.productName || ''}`}
                  >
                    📖 Xem công thức
                  </button>
                )}
              </div>

              {item.notes && (
                <div className={styles.noteBox}>
                  <span>Ghi chú: {item.notes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {action && (
        <div className={styles.cardActions}>
          <button
            type="button"
            className={`${styles.btnPrimary} ${
              action.next === 'COMPLETED' ? styles.btnPrimaryReady : ''
            }`}
            disabled={busy}
            onClick={() => onAction(order, action.next)}
          >
            {busy ? 'Đang xử lý...' : action.label}
          </button>

          {order.status === 'PAID' && onCancel && (
            <button
              type="button"
              className={styles.btnCancel}
              disabled={busy}
              onClick={() => onCancel(order)}
              aria-label="Hủy đơn"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
