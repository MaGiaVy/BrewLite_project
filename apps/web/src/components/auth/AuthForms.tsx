'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BellRing,
  ChevronDown,
  Coffee,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { BrewLiteLogo } from '../BrewLiteLogo';
import { useAuthStore } from '../../stores/auth-store';
import styles from '../../app/(auth)/auth.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : '';

  const useAuthPrefix = Boolean(pathname?.startsWith('/auth/'));
  const loginHref = `${useAuthPrefix ? '/auth/login' : '/login'}${redirectQuery}`;
  const registerHref = `${useAuthPrefix ? '/auth/register' : '/register'}${redirectQuery}`;
  const isRegister = Boolean(pathname?.includes('/register'));
  const [isPerksOpen, setIsPerksOpen] = useState(false);

  return (
    <div className={styles.container}>
      <header className={styles.topNav}>
        <div className={styles.navLeft}>
          <Link href="/menu" aria-label="Quay lại thực đơn" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div className={styles.brandWrap}>
            <BrewLiteLogo height={32} />
            <span
              className={styles.navTitle}
              style={{ borderLeft: '1px solid #ede7e3', paddingLeft: 10, marginLeft: 2 }}
            >
              Đăng Nhập &amp; Đăng Ký
            </span>
          </div>
        </div>

        <div className={styles.navRight}>
          <button
            type="button"
            aria-label="Trợ giúp"
            className={styles.iconBtn}
            onClick={() =>
              alert(
                'Trung tâm trợ giúp BrewLite: Vui lòng liên hệ hotline 1900-BREW hoặc email support@brewlite.vn',
              )
            }
          >
            <HelpCircle size={20} />
          </button>
          <div className={styles.userBadge}>
            <User size={17} />
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
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

        <div className={styles.tabBar} role="tablist">
          <Link
            href={loginHref}
            role="tab"
            aria-selected={!isRegister}
            className={`${styles.tabBtn} ${!isRegister ? styles.tabBtnActive : styles.tabBtnInactive}`}
          >
            <span>Đăng nhập</span>
          </Link>
          <Link
            href={registerHref}
            role="tab"
            aria-selected={isRegister}
            data-testid="auth-switch-register"
            className={`${styles.tabBtn} ${isRegister ? styles.tabBtnActive : styles.tabBtnInactive}`}
          >
            <span>Đăng ký</span>
          </Link>
        </div>

        {children}

        <div className={styles.trustBadge}>
          <ShieldCheck size={16} color="#845326" />
          <span>100% Bảo mật dữ liệu &amp; Mã hóa giao dịch PCI-DSS</span>
        </div>

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
                  <p className={styles.perkItemDesc}>
                    Tặng ngay 50 Hạt Vàng khi kích hoạt tài khoản hôm nay.
                  </p>
                </div>
              </div>

              <div className={styles.perkItem}>
                <div className={styles.perkItemIcon}>
                  <Zap size={14} />
                </div>
                <div>
                  <h4 className={styles.perkItemName}>Express Pickup</h4>
                  <p className={styles.perkItemDesc}>
                    Bỏ qua hàng chờ, nhận ly ngay tại khu vực pha chế riêng.
                  </p>
                </div>
              </div>

              <div className={styles.perkItem}>
                <div className={styles.perkItemIcon}>
                  <BellRing size={14} />
                </div>
                <div>
                  <h4 className={styles.perkItemName}>Thông báo Barista tức thì</h4>
                  <p className={styles.perkItemDesc}>
                    Biết chính xác khi nào tách cà phê của bạn vừa được chiết xuất xong.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export function AuthLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#fef8f4' }} />}>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Suspense>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/menu';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Xóa sạch giá trị autofill nếu trình duyệt tự động điền thông tin cũ vào trang đăng nhập
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const emailEl = document.getElementById('email') as HTMLInputElement | null;
      const pwdEl = document.getElementById('password') as HTMLInputElement | null;
      if (emailEl && !email) {
        emailEl.value = '';
      }
      if (pwdEl && !password) {
        pwdEl.value = '';
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Email không đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data?.message)
          ? data.message.join('; ')
          : (data?.message ?? 'Email hoặc mật khẩu không chính xác.');
        throw new Error(msg);
      }

      const token = data.accessToken ?? data.token;
      useAuthStore.getState().login(token, data.user);

      // Role-based login redirection:
      // If user had an explicit deep link (e.g. ?redirect=/checkout), honor it.
      // Otherwise, redirect according to role (ADMIN -> /admin, STAFF -> /staff, CUSTOMER -> /menu).
      const role = data.user?.role;
      const explicitRedirect = searchParams.get('redirect');
      const targetPath =
        explicitRedirect && explicitRedirect !== '/menu'
          ? explicitRedirect
          : role === 'ADMIN'
            ? '/admin'
            : role === 'STAFF'
              ? '/staff'
              : explicitRedirect || '/menu';

      router.push(targetPath);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Đã xảy ra lỗi, vui lòng thử lại sau.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.authHeader}>
        <h1 className={styles.authHeading}>Đăng nhập BrewLite</h1>
        <p className={styles.authSubheading}>
          Đăng nhập để thanh toán và tiếp tục đơn hàng.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className={styles.form} autoComplete="off">
        <div
          style={{
            position: 'absolute',
            opacity: 0,
            height: 0,
            width: 0,
            overflow: 'hidden',
            zIndex: -1,
          }}
        >
          <input type="text" name="fake_email_remember" tabIndex={-1} autoComplete="off" />
          <input type="password" name="fake_password_remember" tabIndex={-1} autoComplete="off" />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.fieldLabel}>
            Email đăng nhập
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <Mail size={18} />
            </span>
            <input
              id="email"
              name="brewlite_user_account"
              type="email"
              data-testid="auth-email"
              autoComplete="new-password"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="barista@brewlite.com"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.fieldLabel}>
            Mật khẩu
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <Lock size={18} />
            </span>
            <input
              id="password"
              name="brewlite_user_secret"
              type={showPassword ? 'text' : 'password'}
              data-testid="auth-password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              className={styles.toggleEyeBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.rememberForgotRow}>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className={styles.checkboxInput}
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
        </div>

        {error && (
          <div role="alert" className={styles.errorAlert}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          data-testid="auth-submit"
          className={styles.submitBtn}
          style={{ minHeight: 48 }}
        >
          {isLoading ? (
            <span>Đang xác thực...</span>
          ) : (
            <>
              <span>Đăng nhập vào BrewLite</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 32, textAlign: 'center', color: '#504440' }}>
          Đang tải màn hình đăng nhập...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect') || '/menu';

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Họ và tên không được để trống.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Email không đúng định dạng. Vui lòng kiểm tra lại.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (confirmPassword.length > 0 && password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    if (!agreeTerms) {
      setError(
        'Vui lòng đồng ý với điều khoản dịch vụ và chính sách thành viên của BrewLite để tiếp tục.',
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
          email: trimmedEmail,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data?.message)
          ? data.message.join('; ')
          : (data?.message ?? 'Đăng ký không thành công, vui lòng thử lại.');
        throw new Error(msg);
      }

      const token = data.accessToken ?? data.token;
      useAuthStore.getState().login(token, data.user);

      // Role-based login redirection:
      // If user had an explicit deep link (e.g. ?redirect=/checkout), honor it.
      // Otherwise, redirect according to role (ADMIN -> /admin, STAFF -> /staff, CUSTOMER -> /menu).
      const role = data.user?.role;
      const explicitRedirect = searchParams.get('redirect');
      const targetPath =
        explicitRedirect && explicitRedirect !== '/menu'
          ? explicitRedirect
          : role === 'ADMIN'
            ? '/admin'
            : role === 'STAFF'
              ? '/staff'
              : explicitRedirect || '/menu';

      router.push(targetPath);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Đã xảy ra lỗi, vui lòng thử lại.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.authHeader}>
        <h1 className={styles.authHeading}>Tạo tài khoản BrewLite</h1>
        <p className={styles.authSubheading}>
          Đăng ký để đặt món không tiền mặt và tích điểm ưu đãi thành viên BrewLite.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <div className={styles.fieldGroup}>
          <label htmlFor="fullName" className={styles.fieldLabel}>
            Họ và tên
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <User size={18} />
            </span>
            <input
              id="fullName"
              type="text"
              data-testid="auth-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Huỳnh Tuấn Kiệt"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="phone" className={styles.fieldLabel}>
            Số điện thoại nhận món
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <Phone size={18} />
            </span>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.fieldLabel}>
            Email tài khoản
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <Mail size={18} />
            </span>
            <input
              id="email"
              type="email"
              data-testid="auth-email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user123@gmail.com"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.fieldLabel}>
            Mật khẩu (tối thiểu 6 ký tự)
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <Lock size={18} />
            </span>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              data-testid="auth-password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              className={styles.toggleEyeBtn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="confirmPassword" className={styles.fieldLabel}>
            Xác nhận lại mật khẩu
          </label>
          <div className={styles.inputWrap}>
            <span className={styles.inputIcon}>
              <Lock size={18} />
            </span>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Xác nhận mật khẩu"
              className={styles.input}
              style={{ minHeight: 48 }}
            />
            <button
              type="button"
              aria-label="Toggle confirm password visibility"
              className={styles.toggleEyeBtn}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <label htmlFor="agreeTerms" className={styles.checkboxRow}>
          <input
            id="agreeTerms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className={styles.checkboxInput}
          />
          <span>Tôi đồng ý với điều khoản dịch vụ và chính sách thành viên của BrewLite</span>
        </label>

        {error && (
          <div role="alert" className={styles.errorAlert}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          data-testid="auth-submit"
          className={styles.submitBtn}
          style={{ minHeight: 48 }}
        >
          {isLoading ? (
            <span>Đang tạo tài khoản...</span>
          ) : (
            <>
              <span>Đăng ký tài khoản ngay</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export function RegisterForm() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 32, textAlign: 'center', color: '#504440' }}>
          Đang tải màn hình đăng ký...
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
