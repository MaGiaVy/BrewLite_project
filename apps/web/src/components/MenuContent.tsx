import React from 'react';
import { ProductCard } from './ProductCard';
import type { ProductSummary } from './ProductCard';
import styles from '../app/menu/menu.module.css';

export type MenuState = 'loading' | 'empty' | 'error' | 'ready';

export function MenuContent({
  products,
  state,
  retry,
  onUseMock,
}: {
  products: ProductSummary[];
  state: MenuState;
  retry: () => void;
  onUseMock?: () => void;
}) {
  if (state === 'loading') {
    return (
      <section aria-label="Đang tải menu" role="status">
        <p className={styles.loadingText}>Đang tải menu...</p>
        <div className={styles.loadingGrid}>
          <div data-testid="menu-skeleton" className={styles.skeleton} />
          <div data-testid="menu-skeleton" className={styles.skeleton} />
          <div data-testid="menu-skeleton" className={styles.skeleton} />
        </div>
      </section>
    );
  }

  if (state === 'error') {
    return (
      <section className={styles.message} role="alert">
        <p style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 500, color: '#2c1810' }}>
          Không tải được menu. Vui lòng thử lại.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className={styles.retry} type="button" onClick={retry}>
            Thử lại
          </button>
          {onUseMock && (
            <button
              type="button"
              onClick={onUseMock}
              style={{
                background: '#845326',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: 9999,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Xem thực đơn mẫu (Offline Preview)
            </button>
          )}
        </div>
      </section>
    );
  }

  if (state === 'empty') {
    return <p className={styles.message}>Chưa có món</p>;
  }

  return (
    <div className={styles.grid} data-testid="menu-grid">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          isHero={product.isHero ?? (index === 0 && products.length > 1)}
        />
      ))}
    </div>
  );
}
