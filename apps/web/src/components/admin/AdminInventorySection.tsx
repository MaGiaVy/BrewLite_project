import React from 'react';
import styles from './admin.module.css';
import { PlusIcon } from './AdminIcons';

export interface IngredientItem {
  id: number;
  code: string;
  name: string;
  unit: string;
  stock: number;
  minThreshold: number;
  status: 'OK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  percentage?: number;
}

interface AdminInventorySectionProps {
  ingredients: IngredientItem[];
  onQuickStockIn: (ingredientId: number, amount: number) => void;
  onOpenAddModal: () => void;
}

export function AdminInventorySection({
  ingredients,
  onQuickStockIn,
  onOpenAddModal,
}: AdminInventorySectionProps) {
  return (
    <div className={styles.sectionStack}>
      <div className={styles.sectionHeaderRow}>
        <div>
          <h2 className={styles.sectionTitle}>
            Kho nguyên liệu BOM ({ingredients.length})
          </h2>
          <p className={styles.sectionSubtitle}>
            Kiểm soát tồn kho định lượng công thức
          </p>
        </div>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onOpenAddModal}
          data-testid="open-stockin-btn"
        >
          <PlusIcon size={16} />
          <span>Nhập kho</span>
        </button>
      </div>

      {/* Ingredient Card Stack */}
      <div className={styles.stackMd}>
        {ingredients.length === 0 ? (
          <div className={`${styles.card} ${styles.emptyCard}`}>
            Chưa có nguyên liệu nào trong kho
          </div>
        ) : (
          ingredients.map((ing) => {
            const isAlert =
              ing.status === 'LOW_STOCK' || ing.status === 'OUT_OF_STOCK' || ing.stock <= ing.minThreshold;
            const pct = Math.min(
              100,
              Math.max(0, ing.percentage ?? Math.round((ing.stock / (ing.minThreshold * 2 || 10)) * 100)),
            );

            let fillClass = styles.fillGreen;
            if (pct <= 35) fillClass = styles.fillRed;
            else if (pct <= 60) fillClass = styles.fillAmber;

            const quickAmount = ing.unit?.includes('kg')
              ? 5
              : ing.unit === 'g' || ing.unit === 'ml'
                ? 500
                : 10;

            return (
              <div
                key={ing.id}
                className={`${styles.itemCard} ${isAlert ? styles.itemCardAlert : ''}`.trim()}
                data-testid={`ingredient-card-${ing.id}`}
              >
                <div className={styles.itemHeaderRow}>
                  <div>
                    <div className={styles.ingTitleRow}>
                      <h3 className={styles.ingName}>
                        {ing.name}
                      </h3>
                      {isAlert && (
                        <span className={styles.alertPill}>
                          CẦN NHẬP
                        </span>
                      )}
                    </div>
                    <span className={styles.ingCodeText}>
                      Mã: {ing.code} • Đơn vị: {ing.unit}
                    </span>
                  </div>

                  <div className={styles.ingRightCol}>
                    <div
                      className={`${styles.ingStockValue} ${isAlert ? styles.ingStockAlert : styles.ingStockOk}`}
                    >
                      {ing.stock} {ing.unit}
                    </div>
                    <span className={styles.ingMinText}>
                      Tối thiểu: {ing.minThreshold} {ing.unit}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={styles.progressBarTrack}>
                  <div
                    className={`${styles.progressBarFill} ${fillClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Quick Add Action */}
                <div className={styles.itemFooterRow}>
                  <span className={styles.stockEstimate}>
                    Tình trạng: {isAlert ? 'Thiếu hàng' : 'Đảm bảo'}
                  </span>
                  <button
                    type="button"
                    className={`${styles.secondaryBtn} ${styles.quickStockBtn}`}
                    onClick={() => onQuickStockIn(ing.id, quickAmount)}
                    data-testid={`quick-stockin-${ing.id}`}
                  >
                    + Nhập {quickAmount} {ing.unit}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
