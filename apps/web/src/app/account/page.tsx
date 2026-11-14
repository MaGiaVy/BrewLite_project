'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tag, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/auth-store';
import { useCartStore } from '../../stores/cart-store';
import { apiClient, getAuthToken } from '../../lib/api-client';
import EditProfileModal from '../../components/EditProfileModal';
import { getInitials } from '../../lib/format';
import styles from './account.module.css';

export interface UserVoucher {
  code: string;
  title: string;
  description: string;
  discountPercent: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  badge?: string;
  expiresIn?: string;
  quantity: number;
}

function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

export default function AccountPage() {
  const router = useSafeRouter();
  const { user, isAuthenticated, logout, refreshProfile } = useAuthStore();
  const { items, setAppliedPromo, getTotalCount } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRefreshingPoints, setIsRefreshingPoints] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [vouchers, setVouchers] = useState<UserVoucher[]>([]);

  const loadUserData = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const [meRes, vouchersRes] = await Promise.all([
        apiClient('/auth/me'),
        apiClient('/auth/vouchers'),
      ]);
      if (meRes.ok) {
        const meData = await meRes.json();
        const u = meData?.data ?? meData;
        if (u && u.id) {
          useAuthStore.getState().setUser(u);
        }
      }
      if (vouchersRes.ok) {
        const vData = await vouchersRes.json();
        const vList = Array.isArray(vData) ? vData : (vData?.data ?? []);
        const mapped: UserVoucher[] = vList.map((v: any) => ({
          code: v.code,
          title:
            v.title ||
            (v.code === 'BREW10'
              ? 'Voucher Giảm 10% Toàn Đơn'
              : v.code === 'BREWCOZY'
              ? 'Ưu đãi Giờ Vàng giảm 15% toàn menu'
              : v.code === 'BREW20'
              ? 'Voucher Giảm 20% Đơn Từ 60k'
              : v.code === 'WELCOME20'
              ? 'Ưu đãi Thành Viên Mới 20%'
              : v.code === 'BREW50'
              ? 'Siêu Voucher VIP Giảm 50%'
              : `Voucher ${v.code}`),
          description:
            v.description ||
            `Giảm ${v.discountPercent}% tối đa ${(v.maxDiscountAmount || 0).toLocaleString('vi-VN')}đ`,
          discountPercent: v.discountPercent,
          maxDiscountAmount: v.maxDiscountAmount,
          minOrderAmount: v.minOrderAmount,
          badge: v.badge || (v.code === 'BREW50' ? '⭐ VIP' : 'Ưu đãi'),
          quantity: v.quantity ?? 1,
        }));
        setVouchers(mapped);
      }
    } catch {
      // offline / mock fallback
    }
  };

  useEffect(() => {
    setMounted(true);
    void loadUserData();
  }, []);

  const totalCartCount = mounted ? getTotalCount() : 0;
  const points = user?.loyaltyPoints ?? 0;
  const currentTier = points >= 300 ? 'Kim Cương' : points >= 100 ? 'Vàng' : 'Bạc';
  const pointsToNext = points >= 300 ? 0 : points >= 100 ? 300 - points : 100 - points;
  const progressPercent = Math.min(
    100,
    points >= 300
      ? 100
      : points >= 100
        ? Math.round(((points - 100) / 200) * 100)
        : Math.round((points / 100) * 100),
  );

  const displayName = user?.fullName || 'Khách hàng BrewLite';
  const displayEmail = user?.email || '';
  const displayPhone = user?.phone || '';
  const memberCode = user?.id ? `#BL-${user.id.toString().padStart(4, '0')}` : '#BL-0000';

  const initials = getInitials(displayName);

  // Lọc voucher còn số lượng khả dụng
  const myVouchers = vouchers.filter((v) => (v.quantity || 0) > 0);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg((curr) => (curr?.text === text ? null : curr));
    }, 3200);
  };

  // Cập nhật số hạt hiện tại
  const handleRefreshPoints = async () => {
    if (isRefreshingPoints) return;
    setIsRefreshingPoints(true);
    try {
      await refreshProfile();
      await loadUserData();
      showToast('success', 'Đã cập nhật số Hạt Vàng hiện tại thành công!');
    } catch {
      showToast('error', 'Không thể cập nhật số Hạt Vàng lúc này.');
    } finally {
      setIsRefreshingPoints(false);
    }
  };

  // Sử dụng voucher
  const handleUseVoucher = (code: string) => {
    // Nếu giỏ hàng đang trống -> báo lỗi và không sử dụng
    if (!items || items.length === 0) {
      showToast('error', 'Giỏ hàng đang trống! Vui lòng chọn món trước khi áp dụng mã.');
      return;
    }

    // Có món trong giỏ hàng -> Áp dụng mã và chuyển sang giỏ hàng
    setAppliedPromo(code);
    if (router) {
      router.push('/cart');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/cart';
    }
  };

  // Chuyển sang Kho ưu đãi
  const handleGoToPromotions = (tab = 'available') => {
    const target = tab === 'redeem' ? '/promotions?tab=redeem' : '/promotions';
    if (router) {
      router.push(target);
    } else if (typeof window !== 'undefined') {
      window.location.href = target;
    }
  };

  return (
    <main className={styles.accountContainer}>
      {/* ── 1. Top Bar Navigation ── */}
      <header className={styles.topBar}>
        <Link href="/menu" className={styles.backBtn} aria-label="Quay lại thực đơn">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            arrow_back
          </span>
          <span>Thực đơn</span>
        </Link>

        <div className={styles.tierPillTop}>
          <Sparkles size={13} color="#92400e" />
          <span>Thành viên {currentTier}</span>
        </div>
      </header>

      {/* ── 2. Header Section ── */}
      <section className={styles.headerSection}>
        <div className={styles.badgeRow}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            workspace_premium
          </span>
          <span>Hồ sơ thành viên BrewLite Rewards</span>
        </div>
        <h1 className={styles.pageTitle}>Tài khoản của tôi</h1>
        <p className={styles.pageSubtitle}>
          Quản lý thông tin tài khoản, tích lũy Hạt Vàng và sử dụng ưu đãi đặc quyền.
        </p>
      </section>

      {/* ── 3. Content Body ── */}
      <div className={styles.contentWrap}>
        {/* User Profile Summary */}
        <section className={styles.profileCard}>
          <div className={styles.avatarWrap}>
            <div className={styles.initialsAvatar}>{initials}</div>
          </div>
          <div className={styles.profileMeta}>
            <div className={styles.nameRow}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.tierBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  workspace_premium
                </span>
                <span>Thành viên {currentTier}</span>
              </span>
            </div>
            <div className={styles.profileActionsRow}>
              <button
                type="button"
                className={styles.editProfileBtn}
                onClick={() => setIsEditProfileOpen(true)}
                aria-label="Chỉnh sửa hồ sơ"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  person_edit
                </span>
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            </div>
            <p className={styles.contactText}>
              {displayEmail} {displayPhone ? `• ${displayPhone}` : ''}
            </p>
          </div>
        </section>

        {/* BrewLite Rewards Dark Card (Đầy đủ giao diện không bị co) */}
        <section className={styles.rewardsCard}>
          <div className={styles.radialGlow} />

          <div className={styles.rewardsHeader}>
            <div className={styles.rewardsBrand}>
              <span className={`material-symbols-outlined ${styles.starIcon}`}>
                stars
              </span>
              <span className={styles.brandLabel}>BREWLITE REWARDS</span>
            </div>
            <span className={styles.cardCodePill}>
              Mã thẻ: {memberCode}
            </span>
          </div>

          {/* Big Points Counter */}
          <div className={styles.pointsRow}>
            <span className={styles.pointsNumber}>
              {points.toLocaleString('vi-VN')}
            </span>
            <span className={styles.pointsLabel}>Điểm BrewLite (Hạt Vàng)</span>
          </div>

          <p className={styles.tierSub}>
            Hạng {currentTier} • Tích lũy 1 Hạt Vàng mỗi 1.000đ thanh toán
          </p>

          {/* Progress Bar to next tier */}
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span>Tiến trình nâng hạng</span>
              <span style={{ fontWeight: 700 }}>{progressPercent}%</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className={styles.progressNote}>
              {pointsToNext > 0
                ? `Tích lũy thêm ${pointsToNext} điểm để lên Hạng Kim Cương`
                : 'Bạn đã đạt Hạng Kim Cương cao nhất!'}
            </p>
          </div>

          {/* Refresh Points */}
          <div className={styles.refreshRow}>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={handleRefreshPoints}
              disabled={isRefreshingPoints}
              aria-label="Cập nhật số hạt hiện tại"
            >
              <span
                className={`material-symbols-outlined ${styles.refreshIcon} ${
                  isRefreshingPoints ? styles.refreshIconSpin : ''
                }`}
              >
                sync
              </span>
              <span>
                {isRefreshingPoints
                  ? 'Đang cập nhật...'
                  : 'Cập nhật số hạt hiện tại'}
              </span>
            </button>
          </div>
        </section>

        {/* Section: Ưu đãi của bạn (Vouchers Thực Tế) */}
        <section className={styles.vouchersSection}>
          <div className={styles.vouchersHeader}>
            <h3 className={styles.vouchersTitle}>
              <span className={`material-symbols-outlined ${styles.vouchersTitleIcon}`}>
                redeem
              </span>
              <span>Ưu đãi của bạn</span>
            </h3>
            <button
              type="button"
              className={styles.viewAllBtn}
              onClick={() => handleGoToPromotions('available')}
              aria-label="Xem tất cả ưu đãi"
            >
              <span>Xem tất cả</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Nếu không có voucher khả dụng -> Hiển thị thông báo và nút đổi điểm */}
          {myVouchers.length === 0 ? (
            <div className={styles.emptyVouchersBox}>
              <div className={styles.emptyIconWrap}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                  confirmation_number
                </span>
              </div>
              <h4 className={styles.emptyTitle}>Chưa có voucher khả dụng</h4>
              <p className={styles.emptyDesc}>
                Bạn hiện chưa có mã giảm giá nào. Vui lòng đổi điểm Hạt Vàng để lấy voucher ưu đãi hấp dẫn!
              </p>
              <button
                type="button"
                className={styles.emptyActionBtn}
                onClick={() => handleGoToPromotions('redeem')}
                aria-label="Đổi voucher ngay"
              >
                <span>Đổi voucher ngay</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            /* Danh sách thẻ voucher 2 phần chuẩn Đồ án 1 */
            <div className={styles.voucherCardList}>
              {myVouchers.map((v) => {
                const min = v.minOrderAmount || 0;
                const maxDiscount = v.maxDiscountAmount || 25000;
                const qty = v.quantity || 1;

                return (
                  <div key={v.code} className={styles.voucherCard}>
                    {/* Left Stub: Giảm % */}
                    <div className={styles.voucherStub}>
                      <span className={styles.stubDiscountLabel}>GIẢM</span>
                      <span className={styles.stubDiscountPercent}>
                        {v.discountPercent}%
                      </span>
                      <span className={styles.stubCodeTag}>{v.code}</span>
                    </div>

                    {/* Right Details */}
                    <div className={styles.voucherDetails}>
                      <div>
                        <h4 className={styles.voucherTitle} title={v.title}>
                          {v.title}
                        </h4>
                        <div className={styles.voucherRules}>
                          <p style={{ margin: 0 }}>
                            {min > 0
                              ? `Áp dụng cho đơn từ ${min.toLocaleString('vi-VN')}đ`
                              : 'Áp dụng cho mọi giá trị đơn hàng'}
                          </p>
                          <p style={{ margin: '2px 0 0' }}>
                            Giảm tối đa:{' '}
                            <strong style={{ color: '#2c1810' }}>
                              {maxDiscount.toLocaleString('vi-VN')}đ
                            </strong>
                          </p>
                        </div>
                      </div>

                      {/* Footer: Số lượng & Nút Dùng ngay */}
                      <div className={styles.voucherFooter}>
                        <span className={styles.voucherQtyBadge}>
                          <Tag size={11} />
                          <span>Số lượng: {qty}</span>
                        </span>

                        <button
                          type="button"
                          className={styles.useVoucherBtn}
                          onClick={() => handleUseVoucher(v.code)}
                          aria-label={`Dùng ngay mã ${v.code}`}
                        >
                          Dùng ngay
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Links */}
        <section className={styles.quickLinksGroup}>
          {user?.role === 'ADMIN' && (
            <>
              <Link href="/admin" className={styles.quickLinkRow} data-testid="account-admin-shortcut">
                <div className={styles.quickLinkLeft}>
                  <span className={`material-symbols-outlined ${styles.quickLinkIcon}`} style={{ color: '#D4AF37' }}>
                    shield_person
                  </span>
                  <span style={{ fontWeight: 700, color: '#2c1810' }}>Trang Quản Trị (Admin Portal)</span>
                </div>
                <span className={`material-symbols-outlined ${styles.quickLinkChevron}`}>
                  chevron_right
                </span>
              </Link>
              <Link href="/staff" className={styles.quickLinkRow} data-testid="account-staff-shortcut">
                <div className={styles.quickLinkLeft}>
                  <span className={`material-symbols-outlined ${styles.quickLinkIcon}`}>
                    coffee_maker
                  </span>
                  <span>Màn hình Pha chế (KDS Barista)</span>
                </div>
                <span className={`material-symbols-outlined ${styles.quickLinkChevron}`}>
                  chevron_right
                </span>
              </Link>
            </>
          )}

          {user?.role === 'STAFF' && (
            <Link href="/staff" className={styles.quickLinkRow} data-testid="account-staff-shortcut">
              <div className={styles.quickLinkLeft}>
                <span className={`material-symbols-outlined ${styles.quickLinkIcon}`}>
                  coffee_maker
                </span>
                <span>Màn hình Pha chế (KDS Barista)</span>
              </div>
              <span className={`material-symbols-outlined ${styles.quickLinkChevron}`}>
                chevron_right
              </span>
            </Link>
          )}

          <Link href="/orders" className={styles.quickLinkRow}>
            <div className={styles.quickLinkLeft}>
              <span className={`material-symbols-outlined ${styles.quickLinkIcon}`}>
                history
              </span>
              <span>Lịch sử đơn hàng</span>
            </div>
            <span className={`material-symbols-outlined ${styles.quickLinkChevron}`}>
              chevron_right
            </span>
          </Link>

          <Link href="/promotions" className={styles.quickLinkRow}>
            <div className={styles.quickLinkLeft}>
              <span className={`material-symbols-outlined ${styles.quickLinkIcon}`}>
                loyalty
              </span>
              <span>Kho ưu đãi & Đổi điểm</span>
            </div>
            <span className={`material-symbols-outlined ${styles.quickLinkChevron}`}>
              chevron_right
            </span>
          </Link>

          <button
            type="button"
            className={styles.quickLinkRow}
            onClick={() => showToast('success', 'BrewLite hỗ trợ Apple Pay, MoMo, Visa/Mastercard')}
          >
            <div className={styles.quickLinkLeft}>
              <span className={`material-symbols-outlined ${styles.quickLinkIcon}`}>
                account_balance_wallet
              </span>
              <span>Ví không tiền mặt (Apple Pay / MoMo)</span>
            </div>
            <span className={`material-symbols-outlined ${styles.quickLinkChevron}`}>
              chevron_right
            </span>
          </button>

          <button
            type="button"
            className={styles.quickLinkRow}
            onClick={() => showToast('success', 'Xuất hóa đơn điện tử VAT tự động qua email khách hàng')}
          >
            <div className={styles.quickLinkLeft}>
              <span className={`material-symbols-outlined ${styles.quickLinkIcon}`}>
                receipt
              </span>
              <span>Hóa đơn điện tử VAT</span>
            </div>
            <span className={`material-symbols-outlined ${styles.quickLinkChevron}`}>
              chevron_right
            </span>
          </button>
        </section>

        {/* Logout / Login */}
        <div style={{ marginTop: 4 }}>
          {isAuthenticated ? (
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={() => {
                logout();
                if (router) router.push('/login');
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                logout
              </span>
              <span>Đăng xuất tài khoản</span>
            </button>
          ) : (
            <Link href="/login" className={styles.loginLink}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                login
              </span>
              <span>Đăng nhập / Đăng ký tài khoản</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Toast Notification Wrapper ── */}
      {toastMsg && (
        <div className={styles.toastWrapper}>
          <div
            className={`${styles.toastBox} ${
              toastMsg.type === 'success' ? styles.toastSuccess : styles.toastError
            }`}
            role={toastMsg.type === 'error' ? 'alert' : 'status'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {toastMsg.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* ── Fixed Mobile Bottom Navigation Bar (5 tabs, Tài khoản active) ── */}
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
              {totalCartCount > 0 && (
                <span className={styles.navBadge}>{totalCartCount}</span>
              )}
            </div>
            <span>Giỏ hàng</span>
          </Link>

          <Link href="/orders" className={styles.navItem}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              receipt_long
            </span>
            <span>Đơn hàng</span>
          </Link>

          <Link href="/promotions" className={styles.navItem}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              confirmation_number
            </span>
            <span>Ưu đãi</span>
          </Link>

          <Link
            href="/account"
            className={`${styles.navItem} ${styles.navItemActive}`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}
            >
              account_circle
            </span>
            <span>Tài khoản</span>
          </Link>
        </div>
      </nav>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSuccess={(msg) => {
          showToast('success', msg);
          refreshProfile();
        }}
      />
    </main>
  );
}

