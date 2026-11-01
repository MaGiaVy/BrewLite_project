'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProductCard } from '../../components/ProductCard';
import type { ProductSummary } from '../../components/ProductCard';
import styles from './menu.module.css';

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

export default function Menu() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [state, setState] = useState<MenuState>('loading');
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    const loadProducts = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const response = await fetch(`${baseUrl}/products`, { signal: controller.signal });
        if (!response.ok) throw new Error('API lỗi');
        const json: unknown = await response.json();
        if (!json || typeof json !== 'object' || !('data' in json) ||
            !Array.isArray(json.data)) throw new Error('Sai định dạng API');
        if (controller.signal.aborted) return;
        const data = json.data as ProductSummary[];
        setProducts(data);
        setState(data.length > 0 ? 'ready' : 'empty');
      } catch {
        if (!controller.signal.aborted) setState('error');
      }
    };
    void loadProducts();
    return () => controller.abort();
  }, [attempt]);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Menu BrewLite</h1>
      <MenuContent products={products} state={state} retry={retry} />
    </main>
  );
}
