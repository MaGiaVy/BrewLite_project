import React, { useMemo, useState } from 'react';
import {
  isLate,
  nextAction,
  parseNotesChips,
  parseToppings,
  waitMinutes,
  type StaffOrder,
  type StaffOrderItem,
} from '../../lib/staff-orders';
import { BookOpenIcon } from '../admin/AdminIcons';
import styles from './staff.module.css';

export interface OrderCardProps {
  order: StaffOrder;
  now?: Date;
  busy?: boolean;
  onAction: (order: StaffOrder, next: 'PREPARING' | 'READY' | 'COMPLETED') => void;
  onCancel?: (order: StaffOrder) => void;
  onOpenRecipe?: (item: StaffOrderItem) => void;
}

interface CupEntry {
  cupKey: string;
  item: StaffOrderItem;
  cupIndex: number;
  totalForThisItem: number;
  productName: string;
  size: string | null;
  noteChips: string[];
  toppingChips: string[];
  hasRecipe: boolean;
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

  // Per-cup completed state for checklist
  const [completedCups, setCompletedCups] = useState<Record<string, boolean>>({});

  const toggleCup = (key: string) => {
    setCompletedCups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Expand items into cup entries
  const cupsList = useMemo<CupEntry[]>(() => {
    const list: CupEntry[] = [];
    order.items.forEach((item) => {
      const qty = Math.max(1, item.quantity || 1);
      const hasRecipe = Boolean(
        (item.recipeBreakdown && item.recipeBreakdown.length > 0) ||
        (item.toppingBreakdown && item.toppingBreakdown.length > 0)
      );
      const noteChips = parseNotesChips(item.notes);
      const toppingChips = parseToppings(item.toppings);
      const productName =
        item.productName || item.product?.name || `Món #${item.productId}`;

      for (let i = 0; i < qty; i++) {
        list.push({
          cupKey: `${item.id}-${i}`,
          item,
          cupIndex: i + 1,
          totalForThisItem: qty,
          productName,
          size: item.size || null,
          noteChips,
          toppingChips,
          hasRecipe,
        });
      }
    });
    return list;
  }, [order.items]);

  const totalCups = cupsList.length;
  const completedCount = useMemo(() => {
    return cupsList.filter((c) => completedCups[c.cupKey]).length;
  }, [cupsList, completedCups]);

  const allCupsChecked = totalCups > 0 && completedCount === totalCups;

  // Status Chip mapping
  const statusChipMap = {
    PAID: { label: 'Mới', class: styles.chipPaid, cardClass: styles.cardPaid },
    PREPARING: { label: 'Đang pha', class: styles.chipPreparing, cardClass: styles.cardPreparing },
    READY: { label: 'Sẵn sàng', class: styles.chipReady, cardClass: styles.cardReady },
    COMPLETED: { label: 'Đã xong', class: styles.chipCompleted, cardClass: styles.cardCompleted },
    CANCELLED: { label: 'Đã hủy', class: styles.chipCompleted, cardClass: styles.cardCompleted },
  };

  const statusConfig = statusChipMap[order.status] || statusChipMap.COMPLETED;

  // Dynamic Action Button Label
  const getActionLabel = () => {
    if (busy) return 'Đang xử lý...';
    if (!action) return '';

    if (order.status === 'PREPARING') {
      if (allCupsChecked) {
        return `Đã xong đủ ${totalCups}/${totalCups} ly — Báo Sẵn Sàng!`;
      }
      if (completedCount > 0) {
        return `Báo đã xong (Đã làm ${completedCount}/${totalCups} ly)`;
      }
      return action.label;
    }

    return action.label;
  };

  return (
    <div className={`${styles.card} ${statusConfig.cardClass}`}>
      {/* Top: ID + Chip */}
      <div className={styles.cardTop}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={styles.orderId}>#BL-{order.id}</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#6f4e37' }}>
            ({totalCups} ly)
          </span>
        </div>
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

      {/* Items Section: Checklist + Tag Chips */}
      <div className={styles.itemsSection}>
        {cupsList.map((cup, globalIdx) => {
          const isChecked = Boolean(completedCups[cup.cupKey]);
          const showCupNum = cup.totalForThisItem > 1;

          return (
            <div
              key={cup.cupKey}
              className={`${styles.cupBox} ${isChecked ? styles.cupBoxCompleted : ''}`}
            >
              <div className={styles.cupMain}>
                {/* Circular indicator */}
                <div
                  className={`${styles.cupIndex} ${
                    isChecked ? styles.cupIndexChecked : ''
                  }`}
                  aria-hidden="true"
                >
                  {isChecked ? '✓' : globalIdx + 1}
                </div>

                <div className={styles.cupDetails}>
                  {/* Drink Name */}
                  <div
                    className={`${styles.cupTitle} ${
                      isChecked ? styles.cupTitleCompleted : ''
                    }`}
                  >
                    1x {cup.productName}
                    {showCupNum && (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#7a6350',
                          marginLeft: '6px',
                        }}
                      >
                        (Ly {cup.cupIndex}/{cup.totalForThisItem})
                      </span>
                    )}
                  </div>

                  {/* Tag Chips for Customizations */}
                  <div className={styles.chipGroup}>
                    {cup.size && (
                      <span className={styles.chipSize}>SIZE {cup.size}</span>
                    )}
                    {cup.noteChips.map((chip, idx) => (
                      <span key={idx} className={styles.chipOption}>
                        {chip}
                      </span>
                    ))}
                    {cup.toppingChips.map((top, idx) => (
                      <span key={idx} className={styles.chipTopping}>
                        +{top}
                      </span>
                    ))}
                  </div>

                  {/* Recipe Trigger Button (once per item) */}
                  {cup.hasRecipe && cup.cupIndex === 1 && onOpenRecipe && (
                    <button
                      type="button"
                      className={styles.recipeTriggerBtn}
                      onClick={() => onOpenRecipe(cup.item)}
                      aria-label={`Xem công thức ${cup.productName}`}
                    >
                      <BookOpenIcon size={13} strokeWidth={2} />
                      <span>Xem công thức</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Checklist Toggle Button (Only in PREPARING mode) */}
              {order.status === 'PREPARING' && (
                <div>
                  {isChecked ? (
                    <button
                      type="button"
                      className={styles.btnUndoCup}
                      onClick={() => toggleCup(cup.cupKey)}
                    >
                      Hoàn tác
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.btnCheckCup}
                      onClick={() => toggleCup(cup.cupKey)}
                    >
                      Xong ly này
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Primary Action Button */}
      {action && (
        <div className={styles.cardActions}>
          <button
            type="button"
            className={`${styles.btnPrimary} ${
              action.next === 'COMPLETED' ? styles.btnPrimaryReady : ''
            } ${allCupsChecked && order.status === 'PREPARING' ? styles.btnAllCupsReady : ''}`}
            disabled={busy}
            onClick={() => onAction(order, action.next)}
          >
            {getActionLabel()}
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
