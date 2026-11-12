'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ProductSummary } from '../../components/ProductCard';
import { MenuContent } from '../../components/MenuContent';
import type { MenuState } from '../../components/MenuContent';
import { BrewLiteLogo } from '../../components/BrewLiteLogo';
import { useCartStore } from '../../stores/cart-store';
import { MOCK_PRODUCTS } from '../../data/mock-products';
import styles from './menu.module.css';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'espresso', label: 'Espresso Bar' },
  { id: 'salt_phin', label: 'Cà Phê Muối & Phin' },
  { id: 'tea_matcha', label: 'Artisan Tea & Matcha' },
  { id: 'cold_brew', label: 'Cold Brew Craft' },
  { id: 'bakery', label: 'Bánh Nướng' },
] as const;

export default function Menu() {
  const [rawProducts, setRawProducts] = useState<ProductSummary[]>([]);
  const [state, setState] = useState<MenuState>('loading');
  const [attempt, setAttempt] = useState(0);

  // Search & Category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart Zustand store
  const rawTotalCount = useCartStore((s) => s.getTotalCount());
  const selectTotal = useCartStore((s) => s.selectTotal);
  const rawCartTotalAmount = selectTotal();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('openProfile') === 'true') {
        window.location.replace('/account');
      }
    }
  }, []);

  const totalCount = mounted ? rawTotalCount : 0;
  const cartTotalAmount = mounted ? rawCartTotalAmount : 0;

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const handleUseMock = useCallback(() => {
    setRawProducts(MOCK_PRODUCTS);
    setState('ready');
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    const loadProducts = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const response = await fetch(`${baseUrl}/products`, { signal: controller.signal });
        if (!response.ok) throw new Error('API lỗi');
        const json: unknown = await response.json();
        if (
          !json ||
          typeof json !== 'object' ||
          !('data' in json) ||
          !Array.isArray(json.data)
        ) {
          throw new Error('Sai định dạng API');
        }
        if (controller.signal.aborted) return;
        const data = json.data as ProductSummary[];
        setRawProducts(data);
        setState(data.length > 0 ? 'ready' : 'empty');
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          if (err instanceof Error && (err.message === 'API lỗi' || err.message === 'Sai định dạng API')) {
            setState('error');
          } else {
            // Khi API backend NestJS chưa chạy: nạp danh sách món mẫu chuẩn Stitch
            setRawProducts(MOCK_PRODUCTS);
            setState('ready');
          }
        }
      }
    };
    void loadProducts();
    return () => controller.abort();
  }, [attempt]);

  // Lọc sản phẩm theo Category và Từ khóa tìm kiếm
  const filteredProducts = useMemo(() => {
    return rawProducts.filter((p) => {
      const matchCategory =
        selectedCategory === 'all' ||
        !p.category ||
        p.category === selectedCategory;

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));

      return matchCategory && matchSearch;
    });
  }, [rawProducts, selectedCategory, searchQuery]);

  return (
    <div className={styles.container}>
      {/* 1. Header Sticky */}
      <header className={styles.header}>
        <Link href="/menu" className={styles.brandGroup}>
          <BrewLiteLogo height={28} />
        </Link>

        {/* Store Selector Pill */}
        <button
          type="button"
          className={styles.storePill}
          onClick={() => alert('Chi nhánh hiện tại: Roastery Bar (120 Pasteur, Q.1, TP.HCM)')}
        >
          <div className={styles.storePillContent}>
            <span className={`material-symbols-outlined ${styles.storePillIcon}`}>
              storefront
            </span>
            <div className={styles.storePillText}>
              <span className={styles.storePillTitle}>Roastery Bar</span>
              <span className={styles.storePillSubtitle}>120 Pasteur, Q.1</span>
            </div>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#827470' }}>
            expand_more
          </span>
        </button>

        {/* User Profile Avatar / Loyalty Pill */}
        <Link
          href="/account"
          aria-label="Tài khoản và điểm thưởng"
          className={styles.avatarButton}
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="User profile"
            className={styles.avatarImg}
          />
          <span className={styles.avatarBadge}>GOLD</span>
        </Link>
      </header>

      {/* 2. Sub-bar: Giờ mở cửa & Khoảng cách */}
      <section className={styles.subBar}>
        <div className={styles.statusChip}>
          <span className={styles.pulseDot} />
          <span className={styles.statusOpen}>Mở cửa đến 22:30</span>
          <span style={{ color: '#827470', fontSize: 10 }}>•</span>
          <span className={styles.statusServices}>Phục vụ tại bàn & Mang đi</span>
        </div>

        <button type="button" className={styles.distanceBtn}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            distance
          </span>
          <span>0.4 km</span>
        </button>
      </section>

      {/* 3. Search Bar */}
      <section className={styles.searchSection}>
        <div className={styles.searchWrapper}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>
            search
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm kiếm cà phê muối, cold brew, bánh nướng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            aria-label="Bộ lọc nâng cao"
            className={styles.searchFilterBtn}
            onClick={() => alert('Bộ lọc: Giá, Loại hạt, Mức độ ngọt')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              tune
            </span>
          </button>
        </div>
      </section>

      {/* 4. Promotion Announcement Banner (Happy Hour) */}
      <section className={styles.promoSection}>
        <div className={styles.promoCard}>
          <div className={styles.promoIconWrap}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              timer
            </span>
          </div>
          <div className={styles.promoContent}>
            <div className={styles.promoBadgeRow}>
              <span className={styles.promoBadge}>Happy Hour</span>
              <span className={styles.promoTitle}>Giảm 15% Cold Brew & Espresso</span>
            </div>
            <p className={styles.promoDesc}>
              Áp dụng khung giờ 13:00 - 17:00 khi đặt trước lấy liền.
            </p>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#c68b59' }}>
            bolt
          </span>
        </div>
      </section>

      {/* 6. Category Filter Scroll Pills */}
      <section className={styles.categorySection}>
        <div className={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === 'all'
                ? rawProducts.length
                : rawProducts.filter((p) => p.category === cat.id).length;
            const label = cat.id === 'all' ? `Tất cả (${count || rawProducts.length})` : cat.label;
            const isActive = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 7. Section Header & Roast Highlight */}
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Món Nổi Bật Hôm Nay</h2>
          <p className={styles.sectionSubtitle}>
            Rang mộc thủ công từ hạt Arabica Cầu Đất & Robusta Pleiku
          </p>
        </div>
        <span className={styles.seasonBadge}>Menu Mùa Thu</span>
      </div>

      {/* 8. Danh sách món (MenuContent) */}
      <section className={styles.productsSection}>
        <MenuContent
          products={filteredProducts}
          state={state}
          retry={retry}
          onUseMock={handleUseMock}
        />
      </section>

      {/* 9. Floating Cart Bar (Hiện khi có món trong giỏ) */}
      {totalCount > 0 && (
        <Link href="/cart" className={styles.floatingCart}>
          <div className={styles.cartLeft}>
            <div className={styles.cartIconWrap}>
              <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#febc85' }}>
                local_mall
              </span>
              <span className={styles.cartCountBadge}>{totalCount}</span>
            </div>
            <div className={styles.cartInfo}>
              <span className={styles.cartCountTitle}>{totalCount} món • Giỏ hàng</span>
              <span className={styles.cartSubtext}>Roastery Bar • Mang đi</span>
            </div>
          </div>

          <div className={styles.cartRight}>
            <span className={styles.cartTotal}>
              {cartTotalAmount.toLocaleString('vi-VN')} ₫
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#febc85' }}>
              arrow_forward
            </span>
          </div>
        </Link>
      )}

      {/* 10. Fixed Bottom Navigation Bar */}
      <nav className={styles.bottomNav}>
        <div className={styles.bottomNavInner}>
          <Link href="/menu" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span className={`material-symbols-outlined ${styles.navIcon}`} style={{ fontSize: 22 }}>
              coffee
            </span>
            <span>Thực đơn</span>
          </Link>

          <Link href="/cart" className={styles.navItem}>
            <div className={styles.navIconWrap}>
              <span className={`material-symbols-outlined ${styles.navIcon}`} style={{ fontSize: 22 }}>
                shopping_cart
              </span>
              {totalCount > 0 && (
                <span className={styles.navBadge}>{totalCount}</span>
              )}
            </div>
            <span>Giỏ hàng</span>
          </Link>

          <Link href="/orders" className={styles.navItem}>
            <span className={`material-symbols-outlined ${styles.navIcon}`} style={{ fontSize: 22 }}>
              receipt_long
            </span>
            <span>Đơn hàng</span>
          </Link>

          <Link href="/promotions" className={styles.navItem}>
            <span className={`material-symbols-outlined ${styles.navIcon}`} style={{ fontSize: 22 }}>
              confirmation_number
            </span>
            <span>Ưu đãi</span>
          </Link>

          <Link href="/account" className={styles.navItem}>
            <span className={`material-symbols-outlined ${styles.navIcon}`} style={{ fontSize: 22 }}>
              account_circle
            </span>
            <span>Tài khoản</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
