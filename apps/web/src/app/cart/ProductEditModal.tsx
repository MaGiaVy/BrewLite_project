'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Flame,
  Snowflake,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { CartItem } from '../../stores/cart-store';
import { MOCK_PRODUCTS } from '../../data/mock-products';
import styles from './ProductEditModal.module.css';

export interface ToppingItem {
  id: string;
  name: string;
  subtext: string;
  price: number;
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

interface ProductEditModalProps {
  item: CartItem;
  onClose: () => void;
  onSave: (updatedData: Partial<CartItem>) => void;
}

export function ProductEditModal({ item, onClose, onSave }: ProductEditModalProps) {
  // Tìm thông tin sản phẩm gốc từ MOCK_PRODUCTS
  const matchedProduct = useMemo(() => {
    return (
      MOCK_PRODUCTS.find((p) => String(p.id) === String(item.productId)) ||
      MOCK_PRODUCTS.find((p) => p.name.toLowerCase() === item.name.toLowerCase()) ||
      null
    );
  }, [item]);

  const isBakery = useMemo(() => {
    if (item.isBakery) return true;
    if (matchedProduct?.isBakery) return true;
    const n = item.name.toLowerCase();
    return (
      n.includes('bánh') ||
      n.includes('pain') ||
      n.includes('cheesecake') ||
      n.includes('tiramisu') ||
      n.includes('croissant')
    );
  }, [item, matchedProduct]);

  // Base price (giá chưa tính size/toppings)
  const basePrice = useMemo(() => {
    if (matchedProduct?.price) return matchedProduct.price;
    // Fallback: suy từ unitPrice hiện tại
    let est = item.unitPrice;
    if (item.size === 'M') est -= 5000;
    if (item.size === 'L') est -= 10000;
    return Math.max(15000, est);
  }, [matchedProduct, item]);

  // States
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>(item.size || 'M');
  const [temperature, setTemperature] = useState<'iced' | 'hot'>(
    item.temperature === 'hot' || item.temperature === 'HOT' || item.servingStyle === 'Hâm nóng'
      ? 'hot'
      : 'iced',
  );
  const [sweetness, setSweetness] = useState<string>(item.sugarLevel || '100');
  const [iceLevel, setIceLevel] = useState<string>(item.iceLevel || '100');
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>(item.toppingIds || []);
  const [baristaNotes, setBaristaNotes] = useState<string>(item.notes || '');
  const [quantity, setQuantity] = useState<number>(item.quantity || 1);

  const activeToppingList = isBakery ? BAKERY_TOPPINGS : DRINK_TOPPINGS;

  // Tính phụ thu Size
  const sizeUpcharge = useMemo(() => {
    if (isBakery) return 0;
    if (selectedSize === 'M') return 5000;
    if (selectedSize === 'L') return 10000;
    return 0; // Size S
  }, [isBakery, selectedSize]);

  // Tính phụ thu Toppings
  const toppingsExtraPrice = useMemo(() => {
    return activeToppingList
      .filter((t) => selectedToppingIds.includes(t.id))
      .reduce((sum, t) => sum + t.price, 0);
  }, [activeToppingList, selectedToppingIds]);

  const unitPrice = basePrice + sizeUpcharge + toppingsExtraPrice;
  const totalPrice = unitPrice * quantity;

  const toggleTopping = (toppingId: string) => {
    setSelectedToppingIds((prev) =>
      prev.includes(toppingId) ? prev.filter((id) => id !== toppingId) : [...prev, toppingId],
    );
  };

  const handleInsertNote = (chipText: string) => {
    if (!baristaNotes.trim()) {
      setBaristaNotes(chipText);
    } else if (!baristaNotes.includes(chipText)) {
      setBaristaNotes(`${baristaNotes}, ${chipText}`);
    }
  };

  const handleAdjustQuantity = (delta: number) => {
    const next = quantity + delta;
    if (next >= 1 && next <= 20) {
      setQuantity(next);
    }
  };

  const handleSave = () => {
    const selectedToppings = activeToppingList.filter((t) => selectedToppingIds.includes(t.id));

    onSave({
      size: isBakery ? 'M' : selectedSize,
      temperature,
      servingStyle: isBakery
        ? temperature === 'hot'
          ? 'Hâm nóng'
          : 'Dùng ngay'
        : undefined,
      iceLevel: isBakery || temperature === 'hot' ? undefined : iceLevel,
      sugarLevel: isBakery ? undefined : sweetness,
      toppingIds: selectedToppingIds,
      toppingNames: selectedToppings.map((t) => t.name),
      notes: baristaNotes,
      quantity,
      unitPrice,
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
        {/* ── 1. Modal Header ── */}
        <header className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <h3 className={styles.modalTitle}>Chỉnh sửa món</h3>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Đóng popup"
          >
            <X size={18} />
          </button>
        </header>

        {/* ── 2. Scrollable Body ── */}
        <div className={styles.modalScrollArea}>
          {/* Hero Image Showcase */}
          <section className={styles.heroSection}>
            <div className={styles.heroWrapper}>
              <img
                src={item.imageUrl || matchedProduct?.imageUrl || '/images/products/ca-phe-muoi.png'}
                alt={item.name}
                className={styles.heroImg}
              />

              <div className={styles.badgeTopLeft}>
                <span className={styles.pillBadge}>
                  <Sparkles size={12} color="#845326" />
                  <span>{matchedProduct?.badge ?? 'Barista Signature'}</span>
                </span>
                <span className={styles.timeBadge}>
                  <span>Chuẩn bị ~3 phút</span>
                </span>
              </div>

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

          {/* 3-Col Nutrition & Sensory Cards */}
          <div className={styles.nutritionGrid}>
            <div className={styles.nutritionCard}>
              <span className={styles.nutritionVal}>{isBakery ? '280 kcal' : '145 kcal'}</span>
              <span className={styles.nutritionLabel}>Khẩu phần chuẩn</span>
            </div>
            <div className={styles.nutritionCard}>
              <span className={styles.nutritionVal}>
                {isBakery ? 'Bơ Pháp & Bột mì' : 'Robusta & Arabica'}
              </span>
              <span className={styles.nutritionLabel}>Nguyên liệu mộc</span>
            </div>
            <div className={styles.nutritionCard}>
              <span className={styles.nutritionVal}>4.9 ★</span>
              <span className={styles.nutritionLabel}>328 đánh giá</span>
            </div>
          </div>

          {/* Title & Info */}
          <section className={styles.infoSection}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>{item.name}</h2>
              <div className={styles.priceBlock}>
                <span className={styles.currentPrice}>
                  {unitPrice.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
            <p className={styles.description}>
              {matchedProduct?.description ||
                'Hương vị đặc trưng hảo hạng từ hạt cà phê chín mọng hòa quyện cùng công thức pha chế độc quyền của BrewLite.'}
            </p>
          </section>

          <div className={styles.divider} />

          {/* Nhiệt độ / Cách thưởng thức (Icon cùng màu văn bản) */}
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
                    <Flame size={16} strokeWidth={2} />
                    <span>Hâm nóng giòn</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.tempBtn} ${temperature === 'iced' ? styles.tempBtnActive : ''}`}
                    onClick={() => setTemperature('iced')}
                  >
                    <Snowflake size={16} strokeWidth={2} />
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
                    <Snowflake size={16} strokeWidth={2} />
                    <span>Đá lạnh</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.tempBtn} ${temperature === 'hot' ? styles.tempBtnActive : ''}`}
                    onClick={() => setTemperature('hot')}
                  >
                    <Flame size={16} strokeWidth={2} />
                    <span>Nóng ấm</span>
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Chọn Kích Cỡ (Chỉ dành cho Đồ uống) */}
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
                <button
                  type="button"
                  role="radio"
                  aria-label="Kích cỡ S"
                  aria-checked={selectedSize === 'S'}
                  className={`${styles.sizeCard} ${selectedSize === 'S' ? styles.sizeCardActive : ''}`}
                  onClick={() => setSelectedSize('S')}
                >
                  <span className={styles.sizeLetter}>S</span>
                  <span className={styles.sizeDetail}>Nhỏ • 250ml</span>
                  <span className={styles.sizePrice}>+0đ</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-label="Kích cỡ M"
                  aria-checked={selectedSize === 'M'}
                  className={`${styles.sizeCard} ${selectedSize === 'M' ? styles.sizeCardActive : ''}`}
                  onClick={() => setSelectedSize('M')}
                >
                  <span className={styles.popularPill}>Phổ biến</span>
                  <span className={styles.sizeLetter}>M</span>
                  <span className={styles.sizeDetail}>Vừa • 350ml</span>
                  <span className={styles.sizePrice}>+5.000đ</span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-label="Kích cỡ L"
                  aria-checked={selectedSize === 'L'}
                  className={`${styles.sizeCard} ${selectedSize === 'L' ? styles.sizeCardActive : ''}`}
                  onClick={() => setSelectedSize('L')}
                >
                  <span className={styles.sizeLetter}>L</span>
                  <span className={styles.sizeDetail}>Lớn • 500ml</span>
                  <span className={styles.sizePrice}>+10.000đ</span>
                </button>
              </div>
            </section>
          )}

          {/* Độ ngọt (Chỉ dành cho Đồ uống) */}
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

          {/* Lượng đá (Chỉ hiện khi Đồ uống đá) */}
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
                    {iceLevel === opt.id && <span style={{ fontSize: 13, fontWeight: 700 }}>✓</span>}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Toppings / Món ăn kèm hảo hạng */}
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
                return (
                  <label
                    key={top.id}
                    className={`${styles.toppingRow} ${isChecked ? styles.toppingRowActive : ''}`}
                  >
                    <div className={styles.toppingLeft}>
                      <input
                        type="checkbox"
                        className={styles.toppingCheckbox}
                        checked={isChecked}
                        onChange={() => toggleTopping(top.id)}
                      />
                      <div className={styles.toppingInfo}>
                        <span className={styles.toppingName}>{top.name}</span>
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

          {/* Ghi chú cho Barista */}
          <section className={styles.customSection}>
            <div className={styles.sectionHeaderRow}>
              <span className={styles.sectionTitle}>Ghi chú cho Barista</span>
              <span className={styles.badgeOptional}>Gợi ý nhanh</span>
            </div>

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
                rows={2}
                maxLength={100}
                placeholder={
                  isBakery
                    ? 'Ví dụ: Hâm thật nóng, chia đôi bánh, thêm khăn giấy...'
                    : 'Ví dụ: Ít sữa đặc, giao riêng kem béo, ly giấy bảo vệ môi trường...'
                }
                value={baristaNotes}
                onChange={(e) => setBaristaNotes(e.target.value)}
              />
            </div>
          </section>
        </div>

        {/* ── 3. Sticky Bottom Action Bar ── */}
        <div className={styles.stickyBottomBar}>
          <div className={styles.bottomContainer}>
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
                <span>+{Math.max(1, Math.floor(totalPrice / 1000))} Hạt Vàng</span>
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
                  disabled={quantity <= 1}
                >
                  <Minus size={14} strokeWidth={2.5} />
                </button>

                <span className={styles.stepQty}>{quantity}</span>

                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  className={styles.stepBtn}
                  onClick={() => handleAdjustQuantity(1)}
                  disabled={quantity >= 20}
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* Nút Cập Nhật Món */}
              <button
                type="button"
                className={styles.ctaButton}
                onClick={handleSave}
              >
                <div className={styles.ctaLeft}>
                  <ShoppingBag size={18} />
                  <span>Cập nhật món</span>
                </div>

                <span className={styles.ctaPrice}>
                  {totalPrice.toLocaleString('vi-VN')} ₫
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

