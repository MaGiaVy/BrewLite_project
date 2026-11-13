import React, { useEffect } from 'react';
import type { StaffOrderItem } from '../../lib/staff-orders';
import styles from './staff.module.css';

export interface RecipeSheetProps {
  item: StaffOrderItem;
  onClose: () => void;
}

export function RecipeSheet({ item, onClose }: RecipeSheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const recipes = item.recipeBreakdown || [];
  const toppings = item.toppingBreakdown || [];

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.sheetContent}>
        <div className={styles.sheetHeader}>
          <span>
            Công thức: {item.productName || item.product?.name || `Món #${item.productId}`} ({item.quantity}x)
          </span>
          <button
            type="button"
            className={styles.recipeTriggerBtn}
            onClick={onClose}
            aria-label="Đóng bảng công thức"
          >
            ✕ Đóng
          </button>
        </div>

        {recipes.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', color: '#5a4636' }}>
              Nguyên liệu pha chế (Size {item.size || 'M'}):
            </div>
            <table className={styles.recipeTable}>
              <thead>
                <tr>
                  <th>Nguyên liệu</th>
                  <th>Mỗi ly</th>
                  <th>Tổng ({item.quantity}x)</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.ingredientName}</td>
                    <td>
                      {r.amountPerUnit}
                      {r.unit}
                    </td>
                    <td>
                      <strong>
                        {r.totalAmount}
                        {r.unit}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {toppings.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '6px', color: '#9a3412' }}>
              Topping thêm:
            </div>
            <table className={styles.recipeTable}>
              <thead>
                <tr>
                  <th>Topping</th>
                  <th>Nguyên liệu</th>
                  <th>Tổng</th>
                </tr>
              </thead>
              <tbody>
                {toppings.map((t, idx) => (
                  <tr key={idx}>
                    <td>{t.toppingName}</td>
                    <td>{t.ingredientName}</td>
                    <td>
                      <strong>
                        {t.totalAmount}
                        {t.unit}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          type="button"
          className={styles.btnPrimary}
          onClick={onClose}
          style={{ marginTop: '12px' }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
