import { ProductCard } from './ProductCard';
import type { ProductSummary } from './ProductCard';
import styles from '../app/menu/menu.module.css';

export type MenuState = 'loading' | 'empty' | 'error' | 'ready';

export function MenuContent({
  products,
  state,
  retry,
}: {
  products: ProductSummary[];
  state: MenuState;
  retry: () => void;
}) {
  if (state === 'loading') {
    return (
      <section aria-label="Đang tải menu" role="status">
        <p>Đang tải menu...</p>
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
        <p>Không tải được menu. Vui lòng thử lại.</p>
        <button className={styles.retry} type="button" onClick={retry}>Thử lại</button>
      </section>
    );
  }

  if (state === 'empty') return <p className={styles.message}>Chưa có món</p>;

  return (
    <div className={styles.grid} data-testid="menu-grid">
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}
