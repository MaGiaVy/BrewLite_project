import React, { useEffect, useMemo, useState } from 'react';
import styles from './staff.module.css';

export interface StaffProductItem {
  id: number;
  name: string;
  price: number;
  isOutOfStock: boolean;
  availableServings: number;
  isSoldOutManual: boolean;
}

export interface SoldOutSheetProps {
  products: StaffProductItem[];
  busyProductId: number | null;
  error: string | null;
  onToggleSoldOut: (product: StaffProductItem) => void;
  onClose: () => void;
}

export function SoldOutSheet({
  products,
  busyProductId,
  error,
  onToggleSoldOut,
  onClose,
}: SoldOutSheetProps) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const soldOutCount = useMemo(
    () => products.filter((p) => p.isSoldOutManual).length,
    [products],
  );

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-soldout-sheet-title"
    >
      <div className={styles.sheetContent}>
        <div className={styles.sheetHeader}>
          <span id="staff-soldout-sheet-title">
            🚫 Báo hết món (86) · {soldOutCount} đang khóa
          </span>
          <button
            type="button"
            className={styles.recipeTriggerBtn}
            onClick={onClose}
            aria-label="Đóng bảng báo hết món"
          >
            ✕ Đóng
          </button>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm nhanh tên món..."
          className={styles.soldOutSearchInput}
          aria-label="Tìm món báo hết"
        />

        {error && (
          <div className={styles.soldOutError} role="alert">
            ⚠️ {error}
          </div>
        )}

        <div className={styles.soldOutList}>
          {filteredProducts.length === 0 ? (
            <div className={styles.emptyState}>Không tìm thấy món phù hợp</div>
          ) : (
            filteredProducts.map((product) => {
              const isBusy = busyProductId === product.id;
              return (
                <div key={product.id} className={styles.soldOutRow}>
                  <div className={styles.soldOutInfo}>
                    <div className={styles.soldOutName}>{product.name}</div>
                    <div className={styles.soldOutMeta}>
                      <span>{product.price.toLocaleString('vi-VN')}đ</span>
                      <span>·</span>
                      <span
                        className={
                          product.isSoldOutManual || product.isOutOfStock
                            ? styles.soldOutBadgeOff
                            : styles.soldOutBadgeOn
                        }
                      >
                        {product.isSoldOutManual
                          ? 'Hết món (86)'
                          : product.isOutOfStock
                          ? 'Hết nguyên liệu'
                          : `Còn ~${product.availableServings} phần`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onToggleSoldOut(product)}
                    className={
                      product.isSoldOutManual
                        ? styles.soldOutBtnRestore
                        : styles.soldOutBtnMark
                    }
                  >
                    {isBusy
                      ? 'Đang lưu...'
                      : product.isSoldOutManual
                      ? 'Mở bán lại'
                      : 'Báo hết món (86)'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
