'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  Pencil,
  Plus,
  Minus,
  Snowflake,
  Flame,
  Store,
  Clock,
  Tag,
  Sparkles,
  Coffee,
  X,
  Ticket,
  AlertCircle,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { useCartStore, CartItem } from '../../stores/cart-store';
import { useAuthStore } from '../../stores/auth-store';
import { ProductEditModal } from './ProductEditModal';
import styles from './cart.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function vnd(n: number): string {
  return n.toLocaleString('vi-VN') + ' ₫';
}

const FALLBACK_IMG = '/images/products/ca-phe-sua.png';

/** 3 Món bánh gợi ý dùng kèm tương tự Đồ án 1 */
const SUGGESTED_ITEMS = [
  {
    id: 8,
    name: 'Bánh Pain au Chocolat',
    desc: 'Vỏ ngàn lớp giòn xốp ôm thanh socola Bỉ',
    price: 39000,
    img: '/images/products/pain-au-chocolat.png',
  },
  {
    id: 9,
    name: 'Basque Burnt Cheesecake',
    desc: 'Phô mai nướng cháy xém phong cách xứ Basque',
    price: 45000,
    img: '/images/products/basque-burnt-cheesecake.png',
  },
  {
    id: 10,
    name: 'Classic Tiramisu',
    desc: 'Cốt ladyfinger đẫm espresso & mascarpone',
    price: 49000,
    img: '/images/products/classic-tiramisu.png',
  },
];

/** Cấu hình Voucher ưu đãi */
export interface VoucherItem {
  code: string;
  title: string;
  desc: string;
  discountPercent: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
}

const AVAILABLE_VOUCHERS: VoucherItem[] = [
  {
    code: 'BREWCOZY',
    title: 'Giờ vàng ưu đãi 15%',
    desc: 'Giảm 15% tối đa 25.000đ cho mọi đơn hàng',
    discountPercent: 15,
    minOrderAmount: 0,
    maxDiscountAmount: 25000,
  },
  {
    code: 'BREW10',
    title: 'Voucher Giảm 10% Toàn Đơn',
    desc: 'Giảm 10% tối đa 15.000đ không giới hạn giá trị',
    discountPercent: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 15000,
  },
  {
    code: 'BREW20',
    title: 'Voucher Giảm 20% Đơn Từ 60k',
    desc: 'Giảm 20% tối đa 25.000đ cho đơn từ 60.000đ',
    discountPercent: 20,
    minOrderAmount: 60000,
    maxDiscountAmount: 25000,
  },
  {
    code: 'BREW50',
    title: 'Siêu Voucher VIP 50%',
    desc: 'Giảm 50% tối đa 60.000đ cho đơn từ 120.000đ',
    discountPercent: 50,
    minOrderAmount: 120000,
    maxDiscountAmount: 60000,
  },
  {
    code: 'BREWLITE10',
    title: 'Chào mừng thành viên mới',
    desc: 'Giảm 10% tối đa 15.000đ cho đơn hàng đầu tiên',
    discountPercent: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 15000,
  },
  {
    code: 'FREEFOAM',
    title: 'Miễn Phí Foam Muối Biển 0đ',
    desc: 'Tặng 1 phần kem bọt muối béo mịn 10.000đ',
    discountPercent: 100,
    minOrderAmount: 30000,
    maxDiscountAmount: 10000,
  },
  {
    code: 'FREEBAKERY',
    title: 'Tặng 1 Bánh Pain au Chocolat 0đ',
    desc: 'Miễn phí bánh sừng bò socola trị giá 39.000đ',
    discountPercent: 100,
    minOrderAmount: 50000,
    maxDiscountAmount: 39000,
  },
];

/** Định dạng lượng đá chuẩn Đồ án 1 */
function formatIceLevel(ice?: string): string {
  if (!ice) return '100% đá';
  const val = ice.trim();
  if (val.includes('100') || val === 'normal') return '100% đá';
  if (val.includes('70')) return '70% đá';
  if (val.includes('50')) return '50% đá';
  if (val === 'none' || val.includes('0') || val.toLowerCase().includes('không')) return 'Không đá';
  if (val === 'separate' || val.toLowerCase().includes('riêng')) return 'Đá riêng';
  return val;
}

/** Định dạng lượng đường chuẩn Đồ án 1 */
function formatSugarLevel(sugar?: string): string {
  if (!sugar) return '100% đường';
  const val = sugar.trim();
  if (val === '0' || val === '0%' || val.toLowerCase().includes('không')) return 'Không đường';
  if (val.endsWith('%')) return `${val} đường`;
  if (!val.toLowerCase().includes('đường')) return `${val}% đường`;
  return val;
}

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    updateQty,
    removeItem,
    clear,
    selectTotal,
    getTotalCount,
    appliedPromo,
    setAppliedPromo,
    addItem,
    updateCartItem,
  } = useCartStore();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [mounted, setMounted] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  // Modals
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Modal chỉnh sửa món chi tiết chuẩn popup products
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalCount = mounted ? getTotalCount() : 0;
  const subtotal = mounted ? selectTotal() : 0;
  const cartItems = mounted ? items : [];

  // Tính voucher
  const matchedVoucher = useMemo(() => {
    if (!appliedPromo) return null;
    return AVAILABLE_VOUCHERS.find((v) => v.code === appliedPromo) || null;
  }, [appliedPromo]);

  const isUnderMin = Boolean(
    matchedVoucher && matchedVoucher.minOrderAmount > 0 && subtotal < matchedVoucher.minOrderAmount,
  );
  const missingAmount = isUnderMin && matchedVoucher ? matchedVoucher.minOrderAmount - subtotal : 0;

  let discountAmount = 0;
  if (matchedVoucher && !isUnderMin) {
    const rawDiscount = Math.round(subtotal * (matchedVoucher.discountPercent / 100));
    discountAmount = Math.min(rawDiscount, matchedVoucher.maxDiscountAmount);
  }

  // Thuế VAT 8% sau giảm giá
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const vat = Math.floor(afterDiscount * 0.08);
  // Làm tròn xuống nghìn đồng (chuẩn Đồ án 1)
  const finalTotal = Math.floor((afterDiscount + vat) / 1000) * 1000;
  const loyaltyPoints = Math.floor(finalTotal / 1000);

  // Xử lý áp dụng mã giảm giá
  const handleApplyPromo = (codeToApply?: string) => {
    const rawCode = (codeToApply || promoInput).trim().toUpperCase();
    if (!rawCode) return;

    const found = AVAILABLE_VOUCHERS.find((v) => v.code === rawCode);
    if (!found) {
      setPromoError(`Mã ưu đãi "${rawCode}" không tồn tại hoặc đã hết hạn.`);
      return;
    }

    if (found.minOrderAmount > 0 && subtotal < found.minOrderAmount) {
      const diff = found.minOrderAmount - subtotal;
      setPromoError(
        `Mã "${rawCode}" yêu cầu đơn tối thiểu ${vnd(found.minOrderAmount)} (còn thiếu ${vnd(diff)}).`,
      );
      return;
    }

    setPromoError(null);
    setAppliedPromo(rawCode);
    setPromoInput('');
    setIsVoucherModalOpen(false);
  };

  // Thêm nhanh món bánh gợi ý
  const handleAddSuggested = (s: (typeof SUGGESTED_ITEMS)[0]) => {
    addItem({
      productId: s.id,
      name: s.name,
      size: 'M',
      unitPrice: s.price,
      quantity: 1,
      imageUrl: s.img,
      isBakery: true,
      servingStyle: 'Dùng ngay',
      temperature: 'hot',
      toppingIds: [],
      toppingNames: [],
    });
  };

  // Mở modal sửa món chi tiết chuẩn ProductDetailModal
  const handleOpenEdit = (item: CartItem) => {
    setEditingItem(item);
  };

  // Lưu chỉnh sửa món từ ProductEditModal
  const handleSaveEdit = (updatedData: Partial<CartItem>) => {
    if (!editingItem) return;
    updateCartItem(editingItem.lineId, updatedData);
    setEditingItem(null);
  };

  // Tiến hành thanh toán
  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=%2Fcheckout');
    } else {
      router.push('/checkout');
    }
  };

  if (!mounted) {
    return (
      <main className={styles.container}>
        <div style={{ padding: '60px 16px', textAlign: 'center', color: '#786c67' }}>
          Đang tải giỏ hàng...
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      {/* ── 1. Sticky Mobile Header ── */}
      <header className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <button
            type="button"
            onClick={() => router.push('/menu')}
            className={styles.backBtn}
            aria-label="Quay lại Menu"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.headerTitle}>Giỏ hàng của bạn</h1>
          {totalCount > 0 && (
            <span className={styles.headerBadge}>{totalCount} món</span>
          )}
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClearAll(true)}
            className={styles.clearAllBtn}
          >
            <Trash2 size={15} />
            <span>Xóa tất cả</span>
          </button>
        )}
      </header>

      {/* ── 2. Giỏ hàng trống ── */}
      {cartItems.length === 0 ? (
        <section className={styles.emptyContainer}>
          <div className={styles.emptyIconCircle}>
            <Coffee size={44} strokeWidth={1.5} />
          </div>
          <h2 className={styles.emptyTitle}>Giỏ hàng của bạn đang trống</h2>
          <p className={styles.emptyDesc}>
            Hãy bắt đầu ngày mới với một tách cà phê thơm ngát hoặc món nước yêu thích từ Menu nhé!
          </p>
          <button
            type="button"
            onClick={() => router.push('/menu')}
            className={styles.emptyBtn}
          >
            <span>Khám phá Menu ngay</span>
            <ArrowRight size={16} />
          </button>
        </section>
      ) : (
        <>
          {/* ── 3. Địa điểm nhận món & Thời gian pha chế (Pickup Card) ── */}
          <section className={styles.pickupCard}>
            <div className={styles.pickupTop}>
              <div className={styles.pickupShop}>
                <div className={styles.shopIconWrap}>
                  <Store size={18} />
                </div>
                <div className={styles.shopDetails}>
                  <span className={styles.shopName}>Downtown Roastery Bar</span>
                  <span className={styles.shopAddress}>124 Lê Lợi, Bến Nghé, Q.1, TP.HCM</span>
                </div>
              </div>
              <div className={styles.pulseTag}>
                <span className={styles.pulseDot} />
                <span>Nhận tại quầy</span>
              </div>
            </div>

            <div className={styles.pickupTimeBar}>
              <Clock size={14} color="#845326" />
              <span>
                Thời gian pha chế dự kiến:{' '}
                <strong className={styles.pickupTimeHighlight}>~5 phút</strong> sau khi đặt
              </span>
            </div>
          </section>

          {/* ── 4. Danh sách các món trong giỏ (Cart Items) ── */}
          <section className={styles.itemsSection}>
            {cartItems.map((item) => {
              const isBakery = item.isBakery || item.servingStyle;
              const isHot = item.temperature === 'hot' || item.temperature === 'HOT';
              const isWarm = item.servingStyle === 'Hâm nóng' || isHot;
              const lineTotal = item.unitPrice * item.quantity;

              return (
                <article key={item.lineId} className={styles.cartItemCard}>
                  {/* Thumbnail */}
                  <div className={styles.itemThumbWrap}>
                    <img
                      src={item.imageUrl || FALLBACK_IMG}
                      alt={item.name}
                      className={styles.itemThumb}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_IMG;
                      }}
                    />
                  </div>

                  {/* Chi tiết món */}
                  <div className={styles.itemInfo}>
                    <div className={styles.itemHeader}>
                      <h3 className={styles.itemName}>{item.name}</h3>
                      <div className={styles.itemActions}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className={`${styles.actionIconBtn} ${styles.actionIconBtnEdit}`}
                          title="Chỉnh sửa món"
                          aria-label="Chỉnh sửa món"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className={`${styles.actionIconBtn} ${styles.actionIconBtnDelete}`}
                          title="Xóa món"
                          aria-label="Xóa món"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Huy hiệu thuộc tính: Size, Đá, Đường (Chung 1 hàng) */}
                    <div className={styles.attributeBadges}>
                      {isBakery ? (
                        <span className={styles.badgeBase}>
                          {isWarm ? (
                            <>
                              <Flame size={12} strokeWidth={2} />
                              <span>Hâm nóng</span>
                            </>
                          ) : (
                            <>
                              <Snowflake size={12} strokeWidth={2} />
                              <span>Dùng ngay</span>
                            </>
                          )}
                        </span>
                      ) : (
                        <>
                          {item.size && (
                            <span className={styles.badgeBase}>Size {item.size}</span>
                          )}

                          <span className={styles.badgeBase}>
                            {isHot ? (
                              <>
                                <Flame size={12} strokeWidth={2} />
                                <span>Uống Nóng</span>
                              </>
                            ) : (
                              <>
                                <Snowflake size={12} strokeWidth={2} />
                                <span>Uống Lạnh</span>
                              </>
                            )}
                          </span>

                          {!isHot && (
                            <span className={styles.badgeBase}>
                              {formatIceLevel(item.iceLevel)}
                            </span>
                          )}

                          <span className={styles.badgeBase}>
                            {formatSugarLevel(item.sugarLevel)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Danh sách Toppings (Mỗi topping hiển thị riêng 1 hàng) */}
                    {item.toppingNames && item.toppingNames.length > 0 && (
                      <div className={styles.toppingColumn}>
                        {item.toppingNames.map((topName) => (
                          <span key={topName} className={styles.badgeTopping}>
                            <span>+</span>
                            <span>{topName}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Ghi chú Barista nếu có */}
                    {item.notes && (
                      <div className={styles.itemNote}>
                        <span>Ghi chú: {item.notes}</span>
                      </div>
                    )}

                    {/* Footer hàng giá + Stepper số lượng */}
                    <div className={styles.itemFooter}>
                      <div className={styles.priceGroup}>
                        <span className={styles.totalLinePrice}>{vnd(lineTotal)}</span>
                        {item.quantity > 1 && (
                          <span className={styles.unitPrice}>Đơn giá: {vnd(item.unitPrice)}</span>
                        )}
                      </div>

                      {/* Stepper số lượng */}
                      <div className={styles.stepper}>
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              setItemToDelete(item);
                            } else {
                              updateQty(item.lineId, item.quantity - 1);
                            }
                          }}
                          className={styles.stepBtn}
                          aria-label="Giảm số lượng"
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className={styles.stepQty}>{item.quantity}</span>
                        <button
                          type="button"
                          disabled={item.quantity >= 20}
                          onClick={() => updateQty(item.lineId, item.quantity + 1)}
                          className={`${styles.stepBtn} ${styles.stepBtnPrimary} ${item.quantity >= 20 ? styles.stepBtnDisabled : ''}`}
                          aria-label="Tăng số lượng"
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Nút thêm món khác */}
            <button
              type="button"
              onClick={() => router.push('/menu')}
              className={styles.addMoreBtn}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Thêm món khác vào giỏ</span>
            </button>
          </section>

          {/* ── 5. Món gợi ý dùng kèm (Pastries) ── */}
          <section className={styles.suggestedSection}>
            <div className={styles.suggestedHeader}>
              <Sparkles size={16} color="#f59e0b" />
              <h3 className={styles.suggestedTitle}>Món gợi ý dùng kèm</h3>
            </div>
            <div className={styles.suggestedList}>
              {SUGGESTED_ITEMS.map((s) => (
                <div key={s.id} className={styles.suggestedItemRow}>
                  <img src={s.img} alt={s.name} className={styles.suggestedThumb} />
                  <div className={styles.suggestedInfo}>
                    <h4 className={styles.suggestedName}>{s.name}</h4>
                    <p className={styles.suggestedDesc}>{s.desc}</p>
                    <span className={styles.suggestedPrice}>{vnd(s.price)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddSuggested(s)}
                    className={styles.suggestedAddBtn}
                    aria-label={`Thêm ${s.name}`}
                  >
                    <Plus size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── 6. Thẻ Mã giảm giá ưu đãi (Voucher Promo Card) ── */}
          <section className={styles.promoCard}>
            <div className={styles.promoHeader}>
              <div className={styles.promoTitle}>
                <Tag size={16} color="#845326" />
                <span>Mã giảm giá ưu đãi</span>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(true)}
                className={styles.voucherCountBtn}
              >
                <span>{AVAILABLE_VOUCHERS.length} mã khả dụng</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {!appliedPromo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleApplyPromo();
                  }}
                  className={styles.promoForm}
                >
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase());
                      if (promoError) setPromoError(null);
                    }}
                    placeholder="Nhập mã ưu đãi (VD: BREW10)"
                    className={styles.promoInput}
                  />
                  <button type="submit" className={styles.promoApplyBtn}>
                    Áp dụng
                  </button>
                </form>

                {promoError && (
                  <p className={styles.errorText}>
                    <AlertCircle size={13} />
                    <span>{promoError}</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(true)}
                  className={styles.promoSelectBtn}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Ticket size={16} />
                    <span>Chọn hoặc đổi mã giảm giá</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className={styles.appliedBanner}>
                  <div className={styles.appliedLeft}>
                    <span className={styles.appliedCodeTag}>{appliedPromo}</span>
                    <div>
                      <span className={styles.appliedDiscountText}>
                        -{matchedVoucher?.discountPercent ?? 10}%
                      </span>
                      <p className={styles.appliedMsg}>
                        {discountAmount > 0
                          ? `Đã giảm ${vnd(discountAmount)} vào đơn`
                          : 'Đã áp dụng mã vào đơn hàng'}
                      </p>
                    </div>
                  </div>

                  <div className={styles.appliedActions}>
                    <button
                      type="button"
                      onClick={() => setIsVoucherModalOpen(true)}
                      className={styles.changeVoucherBtn}
                    >
                      Đổi mã
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppliedPromo(null)}
                      className={styles.removeVoucherBtn}
                      aria-label="Gỡ mã"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {isUnderMin && matchedVoucher && (
                  <div className={styles.warningBox}>
                    <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>
                      Mã <strong>{appliedPromo}</strong> yêu cầu đơn tối thiểu{' '}
                      {vnd(matchedVoucher.minOrderAmount)}. Mua thêm{' '}
                      <strong>{vnd(missingAmount)}</strong> để được giảm!
                    </span>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── 7. Tóm tắt thanh toán (Payment Summary Card) ── */}
          <section className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Tóm tắt thanh toán</h3>

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Tạm tính ({totalCount} món)</span>
                <span className={styles.summaryValue}>{vnd(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className={styles.summaryRow}>
                  <span style={{ color: '#b45309', fontWeight: 600 }}>
                    Ưu đãi giảm giá ({appliedPromo})
                  </span>
                  <span className={styles.discountValue}>-{vnd(discountAmount)}</span>
                </div>
              )}

              <div className={styles.summaryRow}>
                <span>Thuế VAT (8%)</span>
                <span className={styles.summaryValue}>{vnd(vat)}</span>
              </div>

              <div className={styles.pointsRow}>
                <span>Tích luỹ hạt thưởng</span>
                <span className={styles.pointsValue}>
                  <Sparkles size={14} color="#f59e0b" />
                  <span>+{loyaltyPoints} Hạt Vàng</span>
                </span>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.totalRow}>
              <div>
                <div className={styles.totalLabelGroup}>
                  <span className={styles.totalLabel}>Tổng cộng</span>
                  <span className={styles.totalSub}>(đã làm tròn)</span>
                </div>
              </div>
              <span className={styles.totalAmount}>{vnd(finalTotal)}</span>
            </div>

            {!isAuthenticated && (
              <div className={styles.authNoticeBanner}>
                <div className={styles.authNoticeIconWrap}>
                  <Lock size={15} />
                </div>
                <div className={styles.authNoticeContent}>
                  <p className={styles.authNoticeTitle}>Yêu cầu đăng nhập để thanh toán</p>
                  <p className={styles.authNoticeText}>
                    Vui lòng{' '}
                    <Link href="/login?redirect=%2Fcheckout" className={styles.authNoticeLink}>
                      Đăng nhập
                    </Link>{' '}
                    hoặc{' '}
                    <Link href="/register?redirect=%2Fcheckout" className={styles.authNoticeLink}>
                      Đăng ký
                    </Link>{' '}
                    để bảo vệ quyền lợi thành viên và tiếp tục thanh toán đơn hàng.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── 8. Thanh cố định ở đáy (Sticky Bottom Bar) ── */}
          <div className={styles.stickyBottom}>
            <div className={styles.bottomContainer}>
              <div className={styles.bottomInfoRow}>
                <span className={styles.bottomTotalLabel}>
                  Tổng thanh toán ({totalCount} món):
                </span>
                <span className={styles.bottomTotalValue}>{vnd(finalTotal)}</span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className={styles.checkoutCta}
                id="proceedToCheckoutBtn"
              >
                <span>Tiến hành Thanh toán</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL 1: Xác nhận xóa 1 món ── */}
      {itemToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWrapRed}>
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className={styles.modalTitle}>Xác nhận xóa món</h4>
                <p className={styles.modalSub}>Thao tác sẽ bỏ món khỏi giỏ hàng</p>
              </div>
            </div>

            <p className={styles.modalBody}>
              Bạn có chắc chắn muốn xóa món{' '}
              <strong style={{ color: '#1d1b19' }}>{itemToDelete.name}</strong> khỏi giỏ hàng không?
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className={styles.modalCancelBtn}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  removeItem(itemToDelete.lineId);
                  setItemToDelete(null);
                }}
                className={styles.modalConfirmBtnRed}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Xác nhận xóa tất cả ── */}
      {confirmClearAll && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWrapRed}>
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className={styles.modalTitle}>Xóa toàn bộ giỏ hàng</h4>
                <p className={styles.modalSub}>Tất cả các món sẽ bị xóa</p>
              </div>
            </div>

            <p className={styles.modalBody}>
              Bạn có chắc chắn muốn làm sạch toàn bộ các món trong giỏ hàng không?
            </p>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className={styles.modalCancelBtn}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  clear();
                  setConfirmClearAll(false);
                }}
                className={styles.modalConfirmBtnRed}
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Chọn mã Voucher giảm giá ── */}
      {isVoucherModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIconWrapAmber}>
                <Ticket size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 className={styles.modalTitle}>Chọn mã ưu đãi</h4>
                <p className={styles.modalSub}>Chọn voucher phù hợp cho đơn hàng</p>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#786c67' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.voucherModalList}>
              {AVAILABLE_VOUCHERS.map((v) => {
                const isSelected = appliedPromo === v.code;
                const canUse = subtotal >= v.minOrderAmount;
                return (
                  <div
                    key={v.code}
                    className={`${styles.voucherOptionCard} ${isSelected ? styles.voucherOptionActive : ''}`}
                    onClick={() => handleApplyPromo(v.code)}
                  >
                    <div className={styles.voucherOptionLeft}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={styles.voucherCodeName}>{v.code}</span>
                        <span
                          style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 4,
                          }}
                        >
                          -{v.discountPercent}%
                        </span>
                      </div>
                      <span className={styles.voucherOptionDesc}>{v.title}</span>
                      <span style={{ fontSize: 10, color: '#8c7e77' }}>
                        {v.minOrderAmount > 0
                          ? `Đơn từ ${vnd(v.minOrderAmount)}`
                          : 'Áp dụng cho mọi giá trị đơn'}
                      </span>
                    </div>

                    <div>
                      {isSelected ? (
                        <span style={{ color: '#845326', fontSize: 12, fontWeight: 700 }}>
                          ✓ Đang dùng
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={styles.modalConfirmBtnPrimary}
                          style={{ padding: '6px 12px', fontSize: 11 }}
                        >
                          {canUse ? 'Chọn mã' : 'Chưa đủ đ/k'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className={styles.modalCancelBtn}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Popup chỉnh sửa món chi tiết chuẩn ProductDetailModal ── */}
      {editingItem && (
        <ProductEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      )}
    </main>
  );
}
