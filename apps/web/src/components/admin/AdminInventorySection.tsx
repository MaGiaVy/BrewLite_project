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
    <div className="space-y-3.5">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-sm font-bold text-[#fff8f0] m-0">
            Kho nguyên liệu BOM ({ingredients.length})
          </h2>
          <p className="text-[11px] text-[#a89587] m-0">
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
      <div className="space-y-3">
        {ingredients.length === 0 ? (
          <div className={`${styles.card} text-center py-6 text-xs text-[#a89587]`}>
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
                className={`${styles.itemCard} ${isAlert ? 'border-red-800/60 bg-red-950/20' : ''}`}
                data-testid={`ingredient-card-${ing.id}`}
              >
                <div className={styles.itemHeaderRow}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-[#fff8f0] m-0">
                        {ing.name}
                      </h3>
                      {isAlert && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#ef4444] text-white">
                          CẦN NHẬP
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#a89587] font-mono">
                      Mã: {ing.code} • Đơn vị: {ing.unit}
                    </span>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-bold font-mono ${isAlert ? 'text-[#f87171]' : 'text-[#34d399]'}`}
                    >
                      {ing.stock} {ing.unit}
                    </div>
                    <span className="text-[9px] text-[#a89587]">
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
                <div className="pt-2 border-t border-[#361f15] flex justify-between items-center">
                  <span className="text-[10px] text-[#a89587]">
                    Tình trạng: {isAlert ? 'Thiếu hàng' : 'Đảm bảo'}
                  </span>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    style={{ padding: '6px 12px', minHeight: '38px', fontSize: '11px' }}
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
