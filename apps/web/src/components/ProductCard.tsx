'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '../stores/cart-store';
import { isProductOutOfStock } from '../lib/product-normalize';
import styles from './ProductCard.module.css';

export type ProductSummary = {
  id: number | string;
  name: string;
  price: number;
  basePrice?: number;
  originalPrice?: number;
  imageUrl: string | null;
  stock: number;
  availableServings?: number;
  isOutOfStock?: boolean;
  outOfStockSizes?: string[];
  description?: string | null;
  category?: string;
  badge?: string;
  tag?: string | null;
  isHero?: boolean;
};

export function ProductCard({
  product,
  isHero = false,
}: {
  product: ProductSummary;
  isHero?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [isJustAdded, setIsJustAdded] = useState(false);
  const isSoldOut = isProductOutOfStock(product);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut) return;

    const preferredSize =
      (['M', 'S', 'L'] as const).find(
        (s) => !product.outOfStockSizes?.includes(s),
      ) ?? 'M';

    addItem({
      productId: product.id,
      name: product.name,
      size: preferredSize,
      unitPrice: Number(product.price ?? product.basePrice ?? 0),
      quantity: 1,
      imageUrl: product.imageUrl ?? undefined,
    });

    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 500);
  };

  const showAsHero = isHero || product.isHero;

  return (
    <Link
      href={`/products/${product.id}`}
      data-testid="product-card"
      className={`${showAsHero ? styles.cardHero : styles.card} ${isSoldOut ? styles.unavailable : ''}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className={showAsHero ? styles.imageWrapperHero : styles.imageWrapper}>
        {product.imageUrl ? (
          <img
            className={styles.picture}
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#e7e1dd',
              color: '#827470',
              fontSize: 24,
            }}
          >
            ☕
          </div>
        )}

        {product.badge && !isSoldOut && (
          <span
            className={`${styles.badge} ${
              product.badge === 'New Recipe'
                ? styles.badgeNew
                : product.badge === 'Yêu thích'
                ? styles.badgeSecondary
                : ''
            }`}
          >
            {product.badge}
          </span>
        )}
      </div>

      <div className={showAsHero ? styles.contentHero : styles.content}>
        <div>
          {showAsHero && (
            <div className={styles.heroTag}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                local_fire_department
              </span>
              <span>Signature Roastery</span>
            </div>
          )}

          <h3 className={`${styles.name} ${showAsHero ? styles.nameHero : ''}`}>
            {product.name}
          </h3>

          {product.description && (
            <p className={`${styles.description} ${showAsHero ? styles.descriptionHero : ''}`}>
              {product.description}
            </p>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.priceGroup}>
            <span className={`${styles.price} ${showAsHero ? styles.priceHero : ''}`}>
              {product.price.toLocaleString('vi-VN')} ₫
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className={styles.originalPrice}>
                {product.originalPrice.toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>

          {isSoldOut ? (
            <strong className={styles.soldOut}>Hết hàng</strong>
          ) : (
            <button
              type="button"
              aria-label={`Thêm ${product.name} vào giỏ hàng`}
              onClick={handleQuickAdd}
              className={`${styles.addButton} ${showAsHero ? styles.addButtonHero : ''} ${
                isJustAdded ? styles.addedFeedback : ''
              }`}
            >
              {isJustAdded ? (
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  check
                </span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: showAsHero ? 22 : 18 }}>
                  add
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
