'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Tag,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Ticket,
  ArrowLeft,
  Coffee,
  ShoppingBag,
  Gift,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth-store';
import { useCartStore } from '../../stores/cart-store';
import { apiClient, getAuthToken } from '../../lib/api-client';
import styles from './promotions.module.css';

export interface PromotionVoucher {
  code: string;
  title: string;
  description: string;
  discountPercent: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  badge?: string;
  expiresIn: string;
  quantity: number;
}

export interface RedeemReward {
  id: string;
  code: string;
  title: string;
  description: string;
  pointCost: number;
  discountPercent: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  badge?: string;
}

const INITIAL_VOUCHERS: PromotionVoucher[] = [
  {
    code: 'BREWCOZY',
    title: 'Ưu đãi Giờ Vàng giảm 15% toàn menu',
    description: 'Áp dụng cho mọi giá trị đơn hàng trong khung giờ vàng 14h - 18h',
    discountPercent: 15,
    maxDiscountAmount: 25000,
    minOrderAmount: 0,
    badge: '🔥 Giờ Vàng',
    expiresIn: 'Còn 3 ngày',
    quantity: 1,
  },
  {
    code: 'BREW10',
    title: 'Voucher Giảm 10% Toàn Đơn',
    description: 'Áp dụng cho toàn bộ đồ uống & bánh nướng không giới hạn',
    discountPercent: 10,
    maxDiscountAmount: 15000,
    minOrderAmount: 0,
    badge: 'Phổ biến',
    expiresIn: 'Còn 7 ngày',
    quantity: 1,
  },
  {
    code: 'BREW20',
    title: 'Voucher Giảm 20% Đơn Từ 60k',
    description: 'Ưu đãi dành cho đơn từ 60.000đ trở lên',
    discountPercent: 20,
    maxDiscountAmount: 25000,
    minOrderAmount: 60000,
    badge: 'Tiết kiệm',
    expiresIn: 'Còn 5 ngày',
    quantity: 1,
  },
  {
    code: 'BREW50',
    title: 'Siêu Voucher VIP Giảm 50%',
    description: 'Đặc quyền thành viên VIP cho đơn từ 120.000đ',
    discountPercent: 50,
    maxDiscountAmount: 60000,
    minOrderAmount: 120000,
    badge: '⭐ VIP',
    expiresIn: 'Còn 10 ngày',
    quantity: 1,
  },
];

const REDEEM_REWARDS: RedeemReward[] = [
  {
    id: 'r_brew10',
    code: 'BREW10',
    title: 'Voucher Giảm 10% Toàn Đơn',
    description: 'Đổi 10 Hạt Vàng để nhận voucher giảm 10% tối đa 15.000đ',
    pointCost: 10,
    discountPercent: 10,
    maxDiscountAmount: 15000,
    minOrderAmount: 0,
    badge: '10% OFF',
  },
  {
    id: 'r_brewcozy',
    code: 'BREWCOZY',
    title: 'Ưu đãi Giờ Vàng Giảm 15%',
    description: 'Đổi 15 Hạt Vàng để nhận voucher giảm 15% tối đa 25.000đ',
    pointCost: 15,
    discountPercent: 15,
    maxDiscountAmount: 25000,
    minOrderAmount: 0,
    badge: '15% OFF',
  },
  {
    id: 'r_brew20',
    code: 'BREW20',
    title: 'Voucher Giảm 20% Đơn Từ 60k',
    description: 'Đổi 20 Hạt Vàng để nhận voucher giảm 20% tối đa 25.000đ đơn từ 60k',
    pointCost: 20,
    discountPercent: 20,
    maxDiscountAmount: 25000,
    minOrderAmount: 60000,
    badge: '20% OFF',
  },
  {
    id: 'r_welcome20',
    code: 'WELCOME20',
    title: 'Ưu đãi Thành Viên Mới 20%',
    description: 'Đổi 20 Hạt Vàng để nhận voucher chào mừng 20% tối đa 20.000đ',
    pointCost: 20,
    discountPercent: 20,
    maxDiscountAmount: 20000,
    minOrderAmount: 0,
    badge: '20% OFF',
  },
  {
    id: 'r_brew50',
    code: 'BREW50',
    title: 'Siêu Voucher VIP Giảm 50%',
    description: 'Đổi 50 Hạt Vàng để nhận voucher VIP giảm 50% tối đa 60.000đ đơn từ 120k',
    pointCost: 50,
    discountPercent: 50,
    maxDiscountAmount: 60000,
    minOrderAmount: 120000,
    badge: '50% VIP',
  },
];

const vnd = (n: number) => `${(n || 0).toLocaleString('vi-VN')} ₫`;

export default function PromotionsPage() {
  const router = useRouter();
  const { items, appliedPromo, setAppliedPromo, getTotalCount } = useCartStore();
  const { user, deductLoyaltyPoints, updateLoyaltyPoints } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'available' | 'redeem'>('available');
  const [manualCode, setManualCode] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [vouchers, setVouchers] = useState<PromotionVoucher[]>(INITIAL_VOUCHERS);

  const mapApiVoucher = (v: any): PromotionVoucher => ({
    code: v.code,
    title:
      v.code === 'BREW10'
        ? 'Voucher Giảm 10% Toàn Đơn'
        : v.code === 'BREWCOZY'
        ? 'Ưu đãi Giờ Vàng giảm 15% toàn menu'
        : v.code === 'BREW20'
        ? 'Voucher Giảm 20% Đơn Từ 60k'
        : v.code === 'WELCOME20'
        ? 'Ưu đãi Thành Viên Mới 20%'
        : v.code === 'BREW50'
        ? 'Siêu Voucher VIP Giảm 50%'
        : `Voucher ${v.code}`,
    description: `Giảm ${v.discountPercent}% tối đa ${(v.maxDiscountAmount || 0).toLocaleString('vi-VN')}đ`,
    discountPercent: v.discountPercent,
    maxDiscountAmount: v.maxDiscountAmount,
    minOrderAmount: v.minOrderAmount,
    badge: v.code === 'BREW50' ? '⭐ VIP' : 'Ưu đãi',
    expiresIn: 'Còn 30 ngày',
    quantity: v.quantity ?? 1,
  });

  const fetchUserVouchers = async () => {
    try {
      const token = getAuthToken();
      let mappedUser: PromotionVoucher[] = [];
      if (token) {
        const res = await apiClient('/auth/vouchers');
        if (res.ok) {
          const data = await res.json();
          const vList = Array.isArray(data) ? data : (data?.data ?? []);
          mappedUser = vList.map(mapApiVoucher);
        }
      }
      if (mappedUser.length > 0) {
        setVouchers(mappedUser);
        return;
      }

      const cfgRes = await apiClient('/inventory/pricing-config');
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        const rawList = Array.isArray(cfgData?.vouchers) ? cfgData.vouchers : [];
        const activeList = rawList.filter((v: any) => v?.isActive !== false);
        if (activeList.length > 0) {
          setVouchers(activeList.map(mapApiVoucher));
        }
      }
    } catch {
      // keep initial vouchers if API unreachable
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (getAuthToken()) {
      void useAuthStore.getState().refreshProfile();
    }
    void fetchUserVouchers();
  }, []);

  const totalCartCount = mounted ? getTotalCount() : 0;
  const points = user?.loyaltyPoints ?? 0;
  const displayName = user?.fullName || 'Khách hàng BrewLite';

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg((current) => (current?.text === text ? null : current));
    }, 3200);
  };

  // Áp dụng voucher
  const handleApplyVoucher = (code: string) => {
    // Nếu giỏ hàng trống thì bỏ qua, không sử dụng
    if (!items || items.length === 0) {
      showToast('error', 'Giỏ hàng đang trống! Vui lòng chọn món trước khi áp dụng mã.');
      return;
    }

    // Có món trong giỏ hàng -> Áp dụng và chuyển sang trang giỏ hàng
    setAppliedPromo(code);
    showToast('success', `Đã áp dụng mã "${code}". Đang chuyển đến giỏ hàng...`);
    router.push('/cart');
  };

  // Gỡ voucher
  const handleRemoveVoucher = () => {
    setAppliedPromo(null);
    showToast('success', 'Đã gỡ mã ưu đãi khỏi giỏ hàng.');
  };

  // Nhập mã thủ công
  const handleManualApply = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = manualCode.trim().toUpperCase();
    if (!cleanCode) return;

    // Nếu giỏ hàng trống thì bỏ qua, không sử dụng
    if (!items || items.length === 0) {
      showToast('error', 'Giỏ hàng đang trống! Vui lòng chọn món trước khi áp dụng mã.');
      return;
    }

    const matched = vouchers.find((v) => v.code === cleanCode);
    if (matched) {
      handleApplyVoucher(cleanCode);
      setManualCode('');
      return;
    }

    // Các mã hợp lệ đặc biệt
    if (['BREW10', 'BREW20', 'BREW50', 'BREWCOZY', 'WELCOME20'].includes(cleanCode)) {
      handleApplyVoucher(cleanCode);
      setManualCode('');
      return;
    }

    showToast('error', `Mã "${cleanCode}" không hợp lệ hoặc đã hết lượt sử dụng.`);
  };

  // Đổi Hạt Vàng
  const handleRedeem = async (reward: RedeemReward) => {
    if (points < reward.pointCost) {
      showToast('error', `Bạn còn thiếu ${reward.pointCost - points} Hạt Vàng để đổi ưu đãi này.`);
      return;
    }

    const token = getAuthToken();
    if (token) {
      try {
        const res = await apiClient('/auth/redeem-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: reward.pointCost,
            description: reward.title,
            voucherCode: reward.code,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const remaining = data.remainingPoints ?? (points - reward.pointCost);
          updateLoyaltyPoints(remaining);
          await fetchUserVouchers();
          showToast('success', `Đã đổi mã "${reward.code}" (-${reward.pointCost} Hạt Vàng)!`);
          return;
        }
        const errData = await res.json().catch(() => null);
        showToast('error', errData?.message || 'Không thể đổi điểm lúc này.');
        return;
      } catch {
        showToast('error', 'Không thể kết nối máy chủ để đổi điểm. Vui lòng thử lại.');
        return;
      }
    }

    const success = deductLoyaltyPoints(reward.pointCost);
    if (!success) {
      showToast('error', 'Số dư Hạt Vàng không đủ để thực hiện đổi thưởng.');
      return;
    }

    // Cập nhật danh sách voucher có sẵn
    setVouchers((prev) => {
      const existing = prev.find((v) => v.code === reward.code);
      let updated: PromotionVoucher[];
      if (existing) {
        updated = prev.map((v) => (v.code === reward.code ? { ...v, quantity: v.quantity + 1 } : v));
      } else {
        const newVoucher: PromotionVoucher = {
          code: reward.code,
          title: reward.title,
          description: reward.description,
          discountPercent: reward.discountPercent,
          maxDiscountAmount: reward.maxDiscountAmount,
          minOrderAmount: reward.minOrderAmount,
          badge: reward.badge,
          expiresIn: 'Còn 30 ngày',
          quantity: 1,
        };
        updated = [newVoucher, ...prev];
      }
      return updated;
    });

    showToast(
      'success',
      `Đã đổi mã "${reward.code}" (-${reward.pointCost} Hạt Vàng)!`
    );
  };

  return (
    <main className={styles.container}>
      <div className={styles.ambientGlow} />

      {/* ── 1. Top Header Bar ── */}
      <header className={styles.topBar}>
        <Link href="/menu" className={styles.backBtn} aria-label="Quay lại thực đơn">
          <ArrowLeft size={18} strokeWidth={2.4} />
        </Link>
        <h1 className={styles.pageTitle}>Kho Ưu Đãi &amp; Hạt Vàng</h1>
        <button
          type="button"
          onClick={() => setActiveTab('redeem')}
          className={styles.pointsPill}
          title="Xem điểm tích lũy"
        >
          <Sparkles size={13} strokeWidth={2.4} />
          <span>{points} Hạt</span>
        </button>
      </header>

      {/* ── 2. Member VIP Card ── */}
      <section className={styles.memberCard}>
        <div className={styles.cardGlowOverlay} />

        <div className={styles.cardTopRow}>
          <div>
            <div className={styles.tierBadge}>
              <span>⭐ Hạng Vàng • Gold Tier</span>
            </div>
            <h2 className={styles.memberName}>{displayName}</h2>
          </div>

          <div className={styles.pointsDisplay}>
            <div className={styles.pointsLabel}>Hạt Vàng khả dụng</div>
            <div className={styles.pointsNumber}>
              {points}
              <span className={styles.pointsUnit}>Hạt</span>
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className={styles.tierProgressWrap}>
          <div className={styles.tierProgressLabels}>
            <span>Tiến trình lên hạng Kim Cương</span>
            <span>{points} / 300 Hạt</span>
          </div>
          <div className={styles.tierProgressTrack}>
            <div
              className={styles.tierProgressBar}
              style={{ width: `${Math.min(100, Math.round((points / 300) * 100))}%` }}
            />
          </div>
        </div>

        {/* Member Barcode */}
        <div className={styles.cardBarcodeRow}>
          <span>Mã tích điểm: BL-8899-GOLD</span>
          <div className={styles.barcodeVisual}>
            {[4, 2, 5, 2, 3, 6, 2, 4, 3, 2, 5, 3, 2, 4, 2].map((w, idx) => (
              <span key={idx} className={styles.barcodeBar} style={{ width: w }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Manual Voucher Code Input Bar ── */}
      <section className={styles.inputCard}>
        <h3 className={styles.inputTitle}>
          <Tag size={14} className="text-[#845326]" />
          <span>Nhập mã khuyến mãi hoặc voucher</span>
        </h3>
        <form onSubmit={handleManualApply} className={styles.inputRow}>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="VD: BREW10, BREWCOZY, BREW20..."
            className={styles.voucherInput}
          />
          <button type="submit" className={styles.applyBtn} aria-label="Áp dụng mã nhập">
            Áp dụng
          </button>
        </form>

        <div className={styles.quickChipsRow}>
          <span className={styles.quickChipsLabel}>Gợi ý:</span>
          {['BREWCOZY', 'BREW10', 'BREW20', 'BREW50'].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setManualCode(chip);
                handleApplyVoucher(chip);
              }}
              className={styles.quickChip}
            >
              +{chip}
            </button>
          ))}
        </div>
      </section>

      {/* ── 4. Segmented Control Tabs ── */}
      <div className={styles.tabsContainer}>
        <button
          type="button"
          onClick={() => setActiveTab('available')}
          className={`${styles.tabBtn} ${activeTab === 'available' ? styles.tabBtnActive : ''}`}
        >
          <Ticket size={14} />
          <span>Mã có sẵn ({vouchers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('redeem')}
          className={`${styles.tabBtn} ${activeTab === 'redeem' ? styles.tabBtnActive : ''}`}
        >
          <Sparkles size={14} />
          <span>Đổi bằng Hạt Vàng</span>
        </button>
      </div>

      {/* ── 5. Tab Content: Mã có sẵn ── */}
      {activeTab === 'available' && (
        <section className={styles.vouchersList}>
          {vouchers.map((v) => {
            const isApplied = appliedPromo === v.code;
            return (
              <article
                key={v.code}
                className={`${styles.voucherCard} ${isApplied ? styles.applied : ''}`}
              >
                {/* Left Ticket Stub */}
                <div className={`${styles.stubLeft} ${isApplied ? styles.applied : ''}`}>
                  <span className={styles.stubPercent}>{v.discountPercent}%</span>
                  <span className={styles.stubLabel}>GIẢM</span>
                  <span className={styles.stubCode}>{v.code}</span>
                </div>

                {/* Middle Content */}
                <div className={styles.cardContent}>
                  <div className={styles.cardTopInfo}>
                    <div className={styles.cardTitleRow}>
                      <h4 className={styles.cardTitle}>{v.title}</h4>
                      {v.badge && <span className={styles.badgeTag}>{v.badge}</span>}
                    </div>

                    <p className={styles.cardDesc}>
                      {v.minOrderAmount > 0
                        ? `Áp dụng cho đơn từ ${vnd(v.minOrderAmount)}. Giảm tối đa ${vnd(v.maxDiscountAmount)}.`
                        : `Áp dụng cho mọi giá trị đơn hàng. Giảm tối đa ${vnd(v.maxDiscountAmount)}.`}
                    </p>
                  </div>

                  <div className={styles.cardMetaRow}>
                    <span className={styles.qtyTag}>Số lượng: x{v.quantity}</span>
                    <span className={styles.expiryTag}>⏳ {v.expiresIn}</span>
                  </div>
                </div>

                {/* Right Action */}
                <div className={styles.cardActionCol}>
                  {isApplied ? (
                    <>
                      <div className={styles.appliedPill}>
                        <Check size={11} strokeWidth={3} />
                        <span>Đang chọn</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className={styles.removeVoucherBtn}
                      >
                        Gỡ mã
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Áp dụng mã ${v.code}`}
                      onClick={() => handleApplyVoucher(v.code)}
                      className={styles.applyVoucherBtn}
                    >
                      Áp dụng
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* ── 6. Tab Content: Đổi bằng Hạt Vàng ── */}
      {activeTab === 'redeem' && (
        <section className={styles.vouchersList}>
          <div className={styles.redeemOverview}>
            <div className={styles.redeemOverviewLeft}>
              <Sparkles size={16} className="text-[#845326]" />
              <span>Quy đổi: 1.000₫ thanh toán = 1 Hạt Vàng</span>
            </div>
            <span style={{ fontWeight: 800, color: '#845326' }}>{points} Hạt khả dụng</span>
          </div>

          {REDEEM_REWARDS.map((reward) => {
            const canAfford = points >= reward.pointCost;
            const owned = vouchers.find((v) => v.code === reward.code);
            const ownedQty = owned?.quantity ?? 0;

            return (
              <article key={reward.id} className={styles.voucherCard}>
                {/* Left Ticket Stub */}
                <div className={styles.stubLeft}>
                  <span className={styles.stubPercent}>{reward.discountPercent}%</span>
                  <span className={styles.stubLabel}>QUÀ TẶNG</span>
                  <span className={styles.stubCode}>{reward.code}</span>
                </div>

                {/* Middle Content */}
                <div className={styles.cardContent}>
                  <div className={styles.cardTopInfo}>
                    <div className={styles.cardTitleRow}>
                      <h4 className={styles.cardTitle}>{reward.title}</h4>
                      {reward.badge && <span className={styles.badgeTag}>{reward.badge}</span>}
                    </div>

                    <p className={styles.cardDesc}>{reward.description}</p>
                  </div>

                  <div className={styles.cardMetaRow}>
                    <span style={{ color: '#845326', fontWeight: 800 }}>
                      ⚡ Chi phí: {reward.pointCost} Hạt Vàng
                    </span>
                    {ownedQty > 0 && (
                      <span className={styles.qtyTag}>Đang có: x{ownedQty}</span>
                    )}
                  </div>
                </div>

                {/* Right Action */}
                <div className={styles.cardActionCol}>
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => handleRedeem(reward)}
                    className={canAfford ? styles.redeemBtn : styles.redeemBtnDisabled}
                  >
                    {canAfford ? `Đổi (-${reward.pointCost}đ)` : `Thiếu ${reward.pointCost - points}đ`}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* ── 7. Floating Toast Alert (Centered & Responsive) ── */}
      {toastMsg && (
        <div className={styles.toastWrapper}>
          <aside
            role="alert"
            className={`${styles.toastAlert} ${
              toastMsg.type === 'success' ? styles.success : styles.error
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 size={16} strokeWidth={2.4} />
            ) : (
              <AlertCircle size={16} strokeWidth={2.4} />
            )}
            <span>{toastMsg.text}</span>
          </aside>
        </div>
      )}

      {/* ── 8. Fixed Mobile Bottom Navigation Bar (5 Items) ── */}
      <nav className={styles.bottomNav}>
        <div className={styles.bottomNavInner}>
          <Link href="/menu" className={styles.navItem}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              coffee
            </span>
            <span>Thực đơn</span>
          </Link>

          <Link href="/cart" className={styles.navItem} data-testid="cart-link">
            <div className={styles.navIconWrap}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                shopping_cart
              </span>
              {totalCartCount > 0 && <span className={styles.navBadge}>{totalCartCount}</span>}
            </div>
            <span>Giỏ hàng</span>
          </Link>

          <Link href="/orders" className={styles.navItem}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              receipt_long
            </span>
            <span>Đơn hàng</span>
          </Link>

          <Link href="/promotions" className={`${styles.navItem} ${styles.navItemActive}`}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
            >
              confirmation_number
            </span>
            <span>Ưu đãi</span>
          </Link>

          <Link href="/account" className={styles.navItem}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              account_circle
            </span>
            <span>Tài khoản</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}
