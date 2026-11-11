'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { setAuthSession } from '../../../lib/api-client';
import styles from '../auth.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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

      setAuthSession({
        token: data.accessToken ?? data.token,
        user: data.user,
      });

      router.push(redirectParam);
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
        {/* Ngăn trình duyệt tự động điền thông tin đã lưu */}
        <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', zIndex: -1 }}>
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

export default function LoginPage() {
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
