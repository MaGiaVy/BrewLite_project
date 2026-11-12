'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../../stores/cart-store';
import { isProductOutOfStock, normalizeProduct } from '../../../lib/product-normalize';
import { BrewLiteLogo } from '../../../components/BrewLiteLogo';
import styles from '../product-detail.module.css';

export interface ProductDetail {
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
  sizeUpchargeM?: number | null;
  sizeUpchargeL?: number | null;
  description?: string | null;
  category?: string | null;
  badge?: string | null;
  isBakery?: boolean;
}

export interface ToppingItem {
  id: string;
  name: string;
  subtext: string;
  price: number;
  isOutOfStock?: boolean;
}

const DEFAULT_SIZE_PRICING = { sizeS: 0, sizeM: 5000, sizeL: 10000 };

function mapPricingToppings(list: unknown): ToppingItem[] | null {
  if (!Array.isArray(list) || list.length === 0) return null;
  const mapped: ToppingItem[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const t = item as Record<string, unknown>;
    if (t.isActive === false || !t.id || !t.name) continue;
    mapped.push({
      id: String(t.id),
      name: String(t.name),
      subtext: String(t.subtext ?? 'Topping thơm ngon chuẩn vị'),
      price: Number(t.price ?? 0),
      isOutOfStock: Boolean(t.isOutOfStock),
    });
  }
  return mapped.length > 0 ? mapped : null;
}

const DRINK_TOPPINGS: ToppingItem[] = [
  { id: 'boba', name: 'Trân châu trắng giòn', subtext: 'Crystal boba dẻo dai', price: 8000 },
  { id: 'cream', name: 'Thêm Kem Muối Béo', subtext: 'Velvety Salted Foam', price: 10000 },
  { id: 'jelly', name: 'Thạch Cà Phê Phin', subtext: 'Đậm vị Robusta giòn sần sật', price: 8000 },
  { id: 'shot', name: 'Thêm 1 Shot Espresso', subtext: 'Tăng cường tỉnh táo đậm sâu', price: 12000 },
];

const BAKERY_TOPPINGS: ToppingItem[] = [
  { id: 'bakery_butter', name: 'Bơ lạt Anchor', subtext: 'Bơ New Zealand thơm béo ngậy', price: 5000 },
  { id: 'bakery_cream_cheese', name: 'Phô mai kem', subtext: 'Phô mai tươi chua nhẹ, ngậy béo', price: 10000 },
  { id: 'bakery_jam', name: 'Mứt dâu tây', subtext: 'Dâu tây Đà Lạt nguyên quả chua ngọt', price: 8000 },
  { id: 'bakery_choco', name: 'Xốt sô-cô-la ấm', subtext: 'Socola Bỉ đun chảy đậm đà', price: 10000 },
];

const SWEETNESS_OPTIONS = [
  { id: '0', label: '0%' },
  { id: '25', label: '25%' },
  { id: '50', label: '50%' },
  { id: '75', label: '75%' },
  { id: '100', label: '100%' },
];

const ICE_OPTIONS = [
  { id: 'none', label: 'Không đá', extra: 0 },
  { id: 'separate', label: 'Đá riêng', extra: 0 },
  { id: '50', label: 'Ít đá (50%)', extra: 0 },
  { id: '100', label: 'Bình thường (100%)', extra: 0 },
];

const DRINK_NOTE_CHIPS = ['+ Ít sữa đặc', '+ Thêm túi mang đi', '+ Không đường'];
const BAKERY_NOTE_CHIPS = ['+ Hâm thật nóng', '+ Cắt đôi bánh', '+ Thêm túi mang đi', '+ Thêm sốt trực tiếp'];

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const rawCartCount = useCartStore((state) => state.getTotalCount());

  const [mounted, setMounted] = useState(false);
  const [resolvedId, setResolvedId] = useState<string>('');
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [sizePricing, setSizePricing] = useState(DEFAULT_SIZE_PRICING);
  const [drinkToppings, setDrinkToppings] = useState<ToppingItem[]>(DRINK_TOPPINGS);
  const [bakeryToppings, setBakeryToppings] = useState<ToppingItem[]>(BAKERY_TOPPINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
        navTimerRef.current = null;
      }
    };
  }, []);

  const cartCount = mounted ? rawCartCount : 0;

  // Customization States
  const isBakery = useMemo(() => {
    if (!product) return false;
    if (product.isBakery) return true;
    const cat = (product.category || '').toLowerCase();
    const name = product.name.toLowerCase();
    return (
      cat === 'bakery' ||
      name.includes('bánh') ||
      name.includes('croissant') ||
      name.includes('pain') ||
      name.includes('cheesecake') ||
      name.includes('tiramisu')
    );
  }, [product]);

  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('M');
  const [temperature, setTemperature] = useState<'iced' | 'hot'>('iced');
  const [sweetness, setSweetness] = useState('100');
  const [iceLevel, setIceLevel] = useState('100');
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>([]);
  const [baristaNotes, setBaristaNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Resolve params
  useEffect(() => {
    let mounted = true;
    Promise.resolve(params).then((resolved) => {
      if (mounted && resolved?.id) {
        setResolvedId(String(resolved.id));
      }
    });
    return () => {
      mounted = false;
    };
  }, [params]);

  // Load product data + pricing config
  useEffect(() => {
    if (!resolvedId) return;
    let active = true;
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
        const [productRes, pricingRes] = await Promise.allSettled([
          fetch(`${baseUrl}/products/${resolvedId}`),
          fetch(`${baseUrl}/inventory/pricing-config`),
        ]);

        if (
          active &&
          pricingRes.status === 'fulfilled' &&
          pricingRes.value.ok
        ) {
          try {
            const cfg = await pricingRes.value.json();
            if (cfg?.sizePricing && typeof cfg.sizePricing === 'object') {
              setSizePricing({
                sizeS: Number(cfg.sizePricing.sizeS ?? DEFAULT_SIZE_PRICING.sizeS),
                sizeM: Number(cfg.sizePricing.sizeM ?? DEFAULT_SIZE_PRICING.sizeM),
                sizeL: Number(cfg.sizePricing.sizeL ?? DEFAULT_SIZE_PRICING.sizeL),
              });
            }
            const nextDrinks = mapPricingToppings(cfg?.toppings ?? cfg?.drinkToppings);
            if (nextDrinks) setDrinkToppings(nextDrinks);
            const nextBakery = mapPricingToppings(cfg?.bakeryToppings);
            if (nextBakery) setBakeryToppings(nextBakery);
          } catch {
            // Keep default pricing/toppings if pricing-config JSON is malformed
          }
        }

        if (productRes.status === 'rejected' || !productRes.value.ok) {
          throw new Error('Không thể tải thông tin sản phẩm.');
        }

        const json = await productRes.value.json();
        const raw = json?.data ?? json;
        if (!raw || typeof raw !== 'object' || !raw.name) {
          throw new Error('Không thể tải thông tin sản phẩm.');
        }

        if (active) {
          const normalized = normalizeProduct(raw as Record<string, unknown>);
          const cat = String(raw.category ?? '').toLowerCase();
          const lowerName = String(raw.name ?? '').toLowerCase();
          const isBakeryItem =
            Boolean(raw.isBakery) ||
            cat === 'bakery' ||
            lowerName.includes('bánh') ||
            lowerName.includes('croissant') ||
            lowerName.includes('pain') ||
            lowerName.includes('cheesecake') ||
            lowerName.includes('tiramisu');
          const outOfStockSizes = Array.isArray(normalized.outOfStockSizes)
            ? normalized.outOfStockSizes
            : [];

          setProduct({
            id: normalized.id,
            name: normalized.name,
            price: normalized.price,
            basePrice: normalized.basePrice,
            originalPrice: normalized.originalPrice,
            imageUrl: normalized.imageUrl,
            stock: normalized.stock,
            availableServings: normalized.availableServings,
            isOutOfStock: normalized.isOutOfStock,
            outOfStockSizes,
            sizeUpchargeM:
              raw.sizeUpchargeM !== undefined && raw.sizeUpchargeM !== null
                ? Number(raw.sizeUpchargeM)
                : null,
            sizeUpchargeL:
              raw.sizeUpchargeL !== undefined && raw.sizeUpchargeL !== null
                ? Number(raw.sizeUpchargeL)
                : null,
            description: raw.description ?? null,
            category: raw.category ?? null,
            badge: normalized.badge ?? null,
            isBakery: isBakeryItem,
          });
          setTemperature(isBakeryItem ? 'hot' : 'iced');
          if (!isBakeryItem && outOfStockSizes.includes('M')) {
            const firstAvailable = (['S', 'M', 'L'] as const).find(
              (s) => !outOfStockSizes.includes(s),
            );
            setSelectedSize(firstAvailable ?? 'M');
          } else {
            setSelectedSize('M');
          }
        }
      } catch (err: unknown) {
        if (active) {
          setProduct(null);
          setError(
            err instanceof Error ? err.message : 'Không thể tải thông tin sản phẩm.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchDetail();
    return () => {
      active = false;
    };
  }, [resolvedId]);

  // Pricing calculations
  const sizeUpcharges = useMemo(
    () => ({
      S: sizePricing.sizeS,
      M: product?.sizeUpchargeM ?? sizePricing.sizeM,
      L: product?.sizeUpchargeL ?? sizePricing.sizeL,
    }),
    [sizePricing, product?.sizeUpchargeM, product?.sizeUpchargeL],
  );

  const sizeUpcharge = useMemo(() => {
    if (isBakery) return 0;
    return sizeUpcharges[selectedSize];
  }, [isBakery, selectedSize, sizeUpcharges]);

  const iceExtraCost = useMemo(() => {
    if (isBakery || temperature === 'hot') return 0;
    const item = ICE_OPTIONS.find((i) => i.id === iceLevel);
    return item?.extra ?? 0;
  }, [isBakery, temperature, iceLevel]);

  const activeToppingList = isBakery ? bakeryToppings : drinkToppings;

  const toppingsExtraPrice = useMemo(() => {
    return activeToppingList
      .filter((t) => selectedToppingIds.includes(t.id))
      .reduce((sum, t) => sum + t.price, 0);
  }, [activeToppingList, selectedToppingIds]);

  const unitPrice = (product?.price ?? 0) + sizeUpcharge + toppingsExtraPrice + iceExtraCost;
  const totalPrice = unitPrice * quantity;
  const outOfStockSizes = product?.outOfStockSizes ?? [];
  const isSoldOut = product ? isProductOutOfStock(product) : true;
  const isSelectedSizeOut = !isBakery && outOfStockSizes.includes(selectedSize);

  const toggleTopping = (toppingId: string) => {
    setSelectedToppingIds((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId],
    );
  };

  const handleInsertNote = (text: string) => {
    if (!baristaNotes.trim()) {
      setBaristaNotes(text);
    } else if (!baristaNotes.includes(text)) {
      setBaristaNotes(`${baristaNotes}, ${text}`);
    }
  };

  const handleAdjustQuantity = (delta: number) => {
    const next = quantity + delta;
    if (next >= 1 && next <= 20) {
      setQuantity(next);
    }
  };

  const cancelPendingNav = () => {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
  };

  const handleAddToCart = () => {
    if (!product || isSoldOut || isSelectedSizeOut) return;

    const toppingNames = activeToppingList
      .filter((t) => selectedToppingIds.includes(t.id))
      .map((t) => t.name);

    addItem({
      productId: product.id,
      name: product.name,
      size: isBakery ? 'M' : selectedSize,
      toppingIds: selectedToppingIds,
      toppingNames,
      unitPrice,
      quantity,
      imageUrl: product.imageUrl ?? undefined,
      temperature,
      servingStyle: isBakery ? (temperature === 'hot' ? 'Hâm nóng' : 'Dùng ngay') : undefined,
      iceLevel: isBakery || temperature === 'hot' ? undefined : iceLevel,
      sugarLevel: isBakery ? undefined : sweetness,
      notes: baristaNotes,
      isBakery,
    });

    cancelPendingNav();
    setShowToast(true);
    navTimerRef.current = setTimeout(() => {
      navTimerRef.current = null;
      setShowToast(false);
      router.push('/menu');
    }, 600);
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#827470', fontSize: 15, fontWeight: 500 }}>
          Đang tải thông tin hương vị...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.container} style={{ textAlign: 'center', padding: '60px 16px' }}>
        <h2 style={{ fontSize: 20, color: '#ba1a1a', marginBottom: 12 }}>
          {error ?? 'Không tìm thấy món.'}
        </h2>
        <Link href="/menu" style={{ color: '#845326', fontWeight: 600 }}>
          Quay lại danh mục Menu
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Toast thông báo */}
      {showToast && (
        <div role="status" className={styles.toast}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#febc85' }}>
            check_circle
          </span>
          <span>Đã thêm vào giỏ hàng thành công!</span>
        </div>
      )}

      {/* 1. Header Điều Hướng */}
      <header className={styles.header}>
        <button
          type="button"
          aria-label="Quay lại"
          className={styles.backBtn}
          onClick={() => router.back()}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            arrow_back
          </span>
        </button>

        <Link href="/menu" style={{ textDecoration: 'none' }}>
          <BrewLiteLogo height={28} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href="/cart"
            data-testid="cart-link"
            aria-label="Xem giỏ hàng"
            onClick={cancelPendingNav}
            className={styles.favoriteBtn}
            style={{ textDecoration: 'none', position: 'relative' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              shopping_cart
            </span>
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 18,
                  height: 18,
                  padding: '0 4px',
                  borderRadius: 9999,
                  background: '#845326',
                  color: '#fef8f4',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            aria-label="Lưu món yêu thích"
            className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteBtnActive : ''}`}
            onClick={() => setIsFavorite(!isFavorite)}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 20, fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </button>
        </div>
      </header>

      {/* 2. Hero Showcase Image */}
      <section className={styles.heroSection}>
        <div className={styles.heroWrapper}>
          <img
            src={product.imageUrl ?? '/images/products/ca-phe-muoi.png'}
            alt={product.name}
            className={styles.heroImg}
          />

          {/* Badges Overlays */}
          <div className={styles.badgeTopLeft}>
            <span className={styles.pillBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                workspace_premium
              </span>
              <span>{product.badge ?? 'Barista Signature'}</span>
            </span>

            <span className={styles.timeBadge}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                schedule
              </span>
              <span>Chuẩn bị ~3 phút</span>
            </span>
          </div>

          {/* Roast Meter Overlay on Bottom of Image */}
          {!isBakery && (
            <div className={styles.roastMeterWrap}>
              <div className={styles.roastHeader}>
                <span className={styles.roastTitle}>Mức độ rang (Roast Level)</span>
                <span className={styles.roastLevelName}>Medium-Dark (Vừa - Đậm)</span>
              </div>
              <div className={styles.roastBars}>
                <div className={`${styles.roastSegment} ${styles.roastSegmentActive}`} />
                <div className={`${styles.roastSegment} ${styles.roastSegmentActive}`} />
                <div className={`${styles.roastSegment} ${styles.roastSegmentActive}`} />
                <div className={`${styles.roastSegment} ${styles.roastSegmentActive}`} />
                <div className={styles.roastSegment} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. 3-Col Nutrition & Sensory Cards */}
      <div className={styles.nutritionGrid}>
        <div className={styles.nutritionCard}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#845326' }}>
            local_fire_department
          </span>
          <span className={styles.nutritionVal}>{isBakery ? '280 kcal' : '145 kcal'}</span>
          <span className={styles.nutritionLabel}>Khẩu phần chuẩn</span>
        </div>

        <div className={styles.nutritionCard}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#845326' }}>
            {isBakery ? 'bakery_dining' : 'coffee'}
          </span>
          <span className={styles.nutritionVal}>
            {isBakery ? 'Bơ Pháp & Bột mì' : 'Robusta & Arabica'}
          </span>
          <span className={styles.nutritionLabel}>Nguyên liệu mộc</span>
        </div>

        <div className={styles.nutritionCard}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#845326' }}>
            star
          </span>
          <span className={styles.nutritionVal}>4.9 ★</span>
          <span className={styles.nutritionLabel}>328 đánh giá</span>
        </div>
      </div>

      {/* 4. Product Info Header */}
      <section className={styles.infoSection}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>{product.name}</h1>
          </div>

          {/* Price Block */}
          <div className={styles.priceBlock}>
            <span className={styles.currentPrice}>
              {unitPrice.toLocaleString('vi-VN')} ₫
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className={styles.originalPrice}>
                {(product.originalPrice + sizeUpcharge).toLocaleString('vi-VN')} ₫
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className={styles.description}>{product.description}</p>
      </section>

      <div className={styles.divider} />

      {/* 5. Tùy Chọn Nhiệt Độ / Cách Phục Vụ */}
      <section className={styles.customSection}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeaderLeft}>
            <span className={styles.sectionTitle}>
              {isBakery ? 'Cách thưởng thức' : 'Nhiệt độ'}
            </span>
            <span className={styles.badgeRequired}>Bắt buộc</span>
          </div>
        </div>

        <div className={styles.tempGrid}>
          {isBakery ? (
            <>
              <button
                type="button"
                className={`${styles.tempBtn} ${temperature === 'hot' ? styles.tempBtnActive : ''}`}
                onClick={() => setTemperature('hot')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  local_fire_department
                </span>
                <span>Hâm nóng giòn</span>
              </button>

              <button
                type="button"
                className={`${styles.tempBtn} ${temperature === 'iced' ? styles.tempBtnActive : ''}`}
                onClick={() => setTemperature('iced')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  ac_unit
                </span>
                <span>Dùng ngay</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`${styles.tempBtn} ${temperature === 'iced' ? styles.tempBtnActive : ''}`}
                onClick={() => setTemperature('iced')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  ac_unit
                </span>
                <span>Đá lạnh</span>
              </button>

              <button
                type="button"
                className={`${styles.tempBtn} ${temperature === 'hot' ? styles.tempBtnActive : ''}`}
                onClick={() => setTemperature('hot')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  local_fire_department
                </span>
                <span>Nóng ấm</span>
              </button>
            </>
          )}
        </div>
      </section>

      {/* 6. Chọn Kích Cỡ (Chỉ dành cho Đồ uống) */}
      {!isBakery && (
        <section className={styles.customSection}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.sectionHeaderLeft}>
              <span className={styles.sectionTitle}>Chọn kích cỡ</span>
              <span className={styles.badgeRequired}>Bắt buộc</span>
            </div>
            <span className={styles.badgeOptional}>Chọn 1</span>
          </div>

          <div className={styles.sizeGrid} role="radiogroup" aria-label="Chọn kích cỡ">
            {([
              { id: 'S' as const, detail: 'Nhỏ • 250ml' },
              { id: 'M' as const, detail: 'Vừa • 350ml', popular: true },
              { id: 'L' as const, detail: 'Lớn • 500ml' },
            ]).map((sz) => {
              const isSizeOut = outOfStockSizes.includes(sz.id);
              const isSelected = selectedSize === sz.id;
              const upcharge = sizeUpcharges[sz.id];
              return (
                <button
                  key={sz.id}
                  type="button"
                  role="radio"
                  data-testid={`size-option-${sz.id}`}
                  aria-label={`Kích cỡ ${sz.id}`}
                  aria-checked={isSelected}
                  disabled={isSizeOut}
                  className={`${styles.sizeCard} ${isSelected ? styles.sizeCardActive : ''}`}
                  style={isSizeOut ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                  onClick={() => {
                    if (!isSizeOut) setSelectedSize(sz.id);
                  }}
                >
                  {sz.popular && !isSizeOut && (
                    <span className={styles.popularPill}>Phổ biến</span>
                  )}
                  <span className={styles.sizeLetter}>{sz.id}</span>
                  <span className={styles.sizeDetail}>
                    {isSizeOut ? `${sz.detail} (Hết)` : sz.detail}
                  </span>
                  <span className={styles.sizePrice}>
                    +{upcharge.toLocaleString('vi-VN')}đ
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. Độ Ngọt (Chỉ dành cho Đồ uống - 5 options hiển thị trên 1 hàng chuẩn tỉ lệ) */}
      {!isBakery && (
        <section className={styles.customSection}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.sectionHeaderLeft}>
              <span className={styles.sectionTitle}>Độ ngọt</span>
              <span className={styles.badgeOptional}>Mức: {sweetness}%</span>
            </div>
            <span className={styles.badgeOptional}>Chọn 1</span>
          </div>

          <div className={styles.sweetnessGrid} role="radiogroup" aria-label="Độ ngọt">
            {SWEETNESS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-label={`Độ ngọt ${opt.label}`}
                aria-checked={sweetness === opt.id}
                className={`${styles.sweetnessPill} ${sweetness === opt.id ? styles.sweetnessPillActive : ''}`}
                onClick={() => setSweetness(opt.id)}
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 8. Lượng Đá (Chỉ hiện khi Đồ uống đá - 4 options phân bổ 2x2 cân đối) */}
      {!isBakery && temperature === 'iced' && (
        <section className={styles.customSection}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.sectionHeaderLeft}>
              <span className={styles.sectionTitle}>Lượng đá</span>
              <span className={styles.badgeOptional}>
                {ICE_OPTIONS.find((i) => i.id === iceLevel)?.label}
              </span>
            </div>
            <span className={styles.badgeOptional}>Chọn 1</span>
          </div>

          <div className={styles.iceGrid} role="radiogroup" aria-label="Lượng đá">
            {ICE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-label={opt.label}
                aria-checked={iceLevel === opt.id}
                className={`${styles.icePill} ${iceLevel === opt.id ? styles.icePillActive : ''}`}
                onClick={() => setIceLevel(opt.id)}
              >
                <span>{opt.label}</span>
                {iceLevel === opt.id && (
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#febc85' }}>
                    check_circle
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 9. Toppings / Món Ăn Kèm Hảo Hạng */}
      <section className={styles.customSection}>
        <div className={styles.sectionHeaderRow}>
          <div className={styles.sectionHeaderLeft}>
            <span className={styles.sectionTitle}>
              {isBakery ? 'Món ăn kèm hảo hạng' : 'Thêm Topping'}
            </span>
            <span className={styles.badgeOptional}>Tùy chọn</span>
          </div>
        </div>

        <div className={styles.toppingList}>
          {activeToppingList.map((top) => {
            const isChecked = selectedToppingIds.includes(top.id);
            const topDisabled = Boolean(top.isOutOfStock);
            return (
              <label
                key={top.id}
                data-testid="topping-option"
                className={`${styles.toppingRow} ${isChecked ? styles.toppingRowActive : ''}`}
                style={topDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              >
                <div className={styles.toppingLeft}>
                  <input
                    type="checkbox"
                    className={styles.toppingCheckbox}
                    checked={isChecked}
                    disabled={topDisabled}
                    onChange={() => {
                      if (!topDisabled) toggleTopping(top.id);
                    }}
                  />
                  <div className={styles.toppingInfo}>
                    <span className={styles.toppingName}>
                      {top.name}{topDisabled ? ' (Hết)' : ''}
                    </span>
                    <span className={styles.toppingDesc}>{top.subtext}</span>
                  </div>
                </div>
                <span className={styles.toppingPrice}>
                  +{top.price.toLocaleString('vi-VN')}đ
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* 10. Ghi Chú Cho Barista kèm Gợi Ý Nhanh */}
      <section className={styles.customSection}>
        <div className={styles.sectionHeaderRow}>
          <span className={styles.sectionTitle}>Ghi chú cho Barista</span>
          <span className={styles.badgeOptional}>Gợi ý nhanh</span>
        </div>

        {/* Quick Chips */}
        <div className={styles.quickChipsWrap}>
          {(isBakery ? BAKERY_NOTE_CHIPS : DRINK_NOTE_CHIPS).map((chip) => (
            <button
              key={chip}
              type="button"
              className={styles.quickChip}
              onClick={() => handleInsertNote(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className={styles.noteWrapper}>
          <textarea
            className={styles.noteTextarea}
            rows={3}
            maxLength={120}
            placeholder={
              isBakery
                ? 'Ví dụ: Hâm thật nóng, chia đôi bánh, thêm khăn giấy...'
                : 'Ví dụ: Ít sữa đặc, giao riêng kem béo, ly giấy bảo vệ môi trường...'
            }
            value={baristaNotes}
            onChange={(e) => setBaristaNotes(e.target.value)}
          />
          <span className={`material-symbols-outlined ${styles.noteIcon}`}>
            edit_note
          </span>
        </div>
      </section>

      {/* 11. Thanh Nút Hành Động Cố Định Ở Đáy (Sticky Bottom Bar) */}
      <div className={styles.stickyBottomBar}>
        <div className={styles.bottomContainer}>
          {/* Tóm tắt lựa chọn & Điểm thưởng */}
          <div className={styles.summaryRow}>
            <div className={styles.selectionSummary}>
              <span>{isBakery ? '1 Phần' : `Size ${selectedSize}`}</span>
              <span>•</span>
              <span>
                {isBakery
                  ? temperature === 'hot'
                    ? 'Hâm nóng'
                    : 'Dùng ngay'
                  : temperature === 'iced'
                    ? 'Đá'
                    : 'Nóng'}
              </span>
              <span>•</span>
              <span style={{ color: '#845326', fontWeight: 600 }}>
                {selectedToppingIds.length === 0
                  ? 'Không topping'
                  : `${selectedToppingIds.length} topping`}
              </span>
            </div>

            <div className={styles.pointsEarn}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                stars
              </span>
              <span>+{Math.max(1, Math.floor(totalPrice / 1000))} Điểm Hạt Vàng</span>
            </div>
          </div>

          <div className={styles.bottomInner}>
            {/* Stepper Số Lượng */}
            <div className={styles.stepper}>
              <button
                type="button"
                aria-label="Giảm số lượng"
                className={styles.stepBtn}
                onClick={() => handleAdjustQuantity(-1)}
                disabled={quantity <= 1 || isSoldOut}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  remove
                </span>
              </button>

              <span className={styles.stepQty}>{quantity}</span>

              <button
                type="button"
                aria-label="Tăng số lượng"
                className={styles.stepBtn}
                onClick={() => handleAdjustQuantity(1)}
                disabled={quantity >= 20 || isSoldOut}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  add
                </span>
              </button>
            </div>

            {/* CTA Nút Thêm Vào Giỏ */}
            <button
              type="button"
              data-testid="add-to-cart-button"
              className={`${styles.ctaButton} ${isSoldOut || isSelectedSizeOut ? styles.ctaDisabled : ''}`}
              onClick={handleAddToCart}
              disabled={isSoldOut || isSelectedSizeOut}
            >
              <div className={styles.ctaLeft}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fab983', fontVariationSettings: "'FILL' 1" }}>
                  shopping_bag
                </span>
                <span>{isSoldOut || isSelectedSizeOut ? 'Món Tạm Hết Hàng' : 'Thêm vào giỏ hàng'}</span>
              </div>

              {!isSoldOut && !isSelectedSizeOut && (
                <span className={styles.ctaPrice}>
                  {totalPrice.toLocaleString('vi-VN')} ₫
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
