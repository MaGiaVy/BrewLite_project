'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Coffee,
  HelpCircle,
  User,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Zap,
  BellRing,
  Award,
} from 'lucide-react';
import { BrewLiteLogo } from '../../components/BrewLiteLogo';
import styles from './auth.module.css';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : '';

  const isRegister = pathname?.includes('/register');
  const [isPerksOpen, setIsPerksOpen] = useState(false);

  return (
    <div className={styles.container}>
      {/* ===== Header Navigation cố định chuẩn Google Stitch ===== */}
      <header className={styles.topNav}>
        <div className={styles.navLeft}>
          <Link href="/menu" aria-label="Quay lại thực đơn" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div className={styles.brandWrap}>
            <BrewLiteLogo height={32} />
            <span className={styles.navTitle} style={{ borderLeft: '1px solid #ede7e3', paddingLeft: 10, marginLeft: 2 }}>
              Đăng Nhập &amp; Đăng Ký
            </span>
          </div>
        </div>

        <div className={styles.navRight}>
          <button
            type="button"
            aria-label="Trợ giúp"
            className={styles.iconBtn}
            onClick={() => alert('Trung tâm trợ giúp BrewLite: Vui lòng liên hệ hotline 1900-BREW hoặc email support@brewlite.vn')}
          >
            <HelpCircle size={20} />
          </button>
          <div className={styles.userBadge}>
            <User size={17} />
          </div>
        </div>
      </header>

      {/* ===== Main Content Canvas ===== */}
      <main className={styles.mainContent}>
        {/* Cozy Brand Visual Banner (Stitch Spec) */}
        <div className={styles.heroBanner}>
          <div
            className={styles.heroBannerBg}
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC9lrtcn-Wbd28wU309QOmQKaOSt4xvfi2oDs24Ks25OSQyJNsd0eWlsQICbD4vVKHrl_MHw9D_kD7FSfKCuJUlaM4LeNFWEmpBnB6r3ehK0Rk3nvmyuNZRRM0bz8EYyz7I1txJ_GIO2A9lTxWz1kejJO0uyG7GuM12R0HPw24IDb2OgITjQ4XwAIDIS3Mo6lEohq5fK5BmE4FrmRmNptEwgP_UHu9ejPMStc45ez3S')",
            }}
          />
          <div className={styles.heroBannerGradient} />

          <div className={styles.heroBannerContent}>
            <div className={styles.heroBannerText}>
              <div className={styles.cashlessPill}>
                <Coffee size={12} />
                <span>Trải nghiệm Cashless</span>
              </div>
              <h2 className={styles.heroBannerTitle}>
                Cà phê ngon, chạm nhẹ là thanh toán.
              </h2>
              <p className={styles.heroBannerSub}>
                Không tiền mặt, không hàng chờ, trọn vị sáng.
              </p>
            </div>

            <div className={styles.heroBannerThumb}>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgRICjN8iwhj2VGMt8e0Euisu2EU13VSs9vQ2tbbiA0gNIiqHqBd-9r2JB_jUKpeQvPfyUdJ4uHif3Dcor9-9IGXh6db6LlAgUQ7Hwyykmj80pj4Dsk89bwTMUX6tGb6gODbIDJoJ45GUvExfQL4ZIzN9UQXjqYMsqiJSySUWkj9pMvblD61wnFylOunyemRPb5MoVHY8algr6xbqkWRyfCLQet-jnXRYJx_xljLN1"
                alt="Khách hàng BrewLite"
                className={styles.heroBannerImg}
              />
            </div>
          </div>
        </div>

        {/* Segmented Tab Switcher (Stitch Spec) */}
        <div className={styles.tabBar} role="tablist">
          <Link
            href={`/login${redirectQuery}`}
            role="tab"
            aria-selected={!isRegister}
            className={`${styles.tabBtn} ${!isRegister ? styles.tabBtnActive : styles.tabBtnInactive}`}
          >
            <span>Đăng nhập</span>
          </Link>
          <Link
            href={`/register${redirectQuery}`}
            role="tab"
            aria-selected={isRegister}
            className={`${styles.tabBtn} ${isRegister ? styles.tabBtnActive : styles.tabBtnInactive}`}
          >
            <span>Đăng ký</span>
          </Link>
        </div>

        {/* Nội dung form Login hoặc Register */}
        {children}

        {/* Security & Trust Badge */}
        <div className={styles.trustBadge}>
          <ShieldCheck size={16} color="#845326" />
          <span>100% Bảo mật dữ liệu &amp; Mã hóa giao dịch PCI-DSS</span>
        </div>

        {/* Member Perks Summary Accordion Card */}
        <div className={styles.perksCard}>
          <button
            type="button"
            className={styles.perksToggle}
            aria-expanded={isPerksOpen}
            onClick={() => setIsPerksOpen(!isPerksOpen)}
          >
            <div className={styles.perksLeft}>
              <div className={styles.perksIconBadge}>
                <Award size={16} />
              </div>
              <div>
                <h3 className={styles.perksTitle}>Đặc quyền tài khoản BrewLite</h3>
                <p className={styles.perksSubtitle}>Quyền lợi độc quyền cho thành viên</p>
              </div>
            </div>
            <div className={`${styles.perksChevron} ${isPerksOpen ? styles.perksChevronOpen : ''}`}>
              <ChevronDown size={18} />
            </div>
          </button>

          {isPerksOpen && (
            <div className={styles.perksList}>
              <div className={styles.perkItem}>
                <div className={styles.perkItemIcon}>
                  <Sparkles size={14} />
                </div>
                <div>
                  <h4 className={styles.perkItemName}>Tích lũy Hạt Vàng mỗi đơn</h4>
                  <p className={styles.perkItemDesc}>Tặng ngay 50 Hạt Vàng khi kích hoạt tài khoản hôm nay.</p>
                </div>
              </div>

              <div className={styles.perkItem}>
                <div className={styles.perkItemIcon}>
                  <Zap size={14} />
                </div>
                <div>
                  <h4 className={styles.perkItemName}>Express Pickup</h4>
                  <p className={styles.perkItemDesc}>Bỏ qua hàng chờ, nhận ly ngay tại khu vực pha chế riêng.</p>
                </div>
              </div>

              <div className={styles.perkItem}>
                <div className={styles.perkItemIcon}>
                  <BellRing size={14} />
                </div>
                <div>
                  <h4 className={styles.perkItemName}>Thông báo Barista tức thì</h4>
                  <p className={styles.perkItemDesc}>Biết chính xác khi nào tách cà phê của bạn vừa được chiết xuất xong.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
